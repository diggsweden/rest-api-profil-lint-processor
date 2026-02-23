// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Document } from '@stoplight/spectral-core';
import Parsers from '@stoplight/spectral-parsers';
import { Express } from 'express';
import { decodeBase64String, processApiSpec, validateYamlInput } from '../util/apiUtil.js';
import { YamlContentDto } from '../model/YamlContentDto.js';
import { importAndCreateRuleInstances } from '../util/ruleUtil.js';
import { ApiInfo } from '../model/ApiInfo.js';
import { validationRules } from '../model/validationRules.js';
import { ExcelReportProcessor } from '../util/excelReportProcessor.js';
import { DiagnosticReport, RapLPDiagnostic } from '../util/RapLPDiagnostic.js';
import * as IssueHelper from '../util/RapLPIssueHelpers.js'; 
import { parseApiSpecInput,detectSpecFormatPreference, ParseResult} from '../util/validateUtil.js';
import { ProblemDetailsDTO } from '../model/ProblemDetailsDto.js';
import { SpecValidationRequestDto } from '../model/SpecValidationRequestDto.js';
import { ERROR_TYPE, RapLPBaseApiError } from '../util/RapLPBaseApiErrorHandling.js';
import type { IParser } from '@stoplight/spectral-parsers';
import { stringify } from 'node:querystring';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';



export const registerValidationRoutes = (app: Express) => {
  // Route for raw content upload.
  app.post('/api/v1/validation/validate', async (req, res, next) => {
    try {
      const context = new RuleExecutionContext();
      const yamlContent: YamlContentDto = req.body;

      let yamlContentString: string;
      yamlContentString = decodeBase64String(yamlContent.yaml);

      validateYamlInput(yamlContentString);

      const apiSpecDocument = new Document(yamlContentString, Parsers.Yaml, '');

      const rules = await importAndCreateRuleInstances(context, yamlContent.categories);

      const result = await processApiSpec(context,rules, apiSpecDocument);
      res.send(result);
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/v1/validation/rules', (req, res) => {
    res.send(validationRules);
  });

  app.get('/api/v1/api-info', async (req, res, next) => {
    res.send(
      new ApiInfo('RAP-LP', '1.0.11', new Date().toDateString(), 'http://example.digg.se/RAP-LP-docs', 'development'),
    );
  });

  app.post('/api/v1/validation/generate-report', async (req, res, next): Promise<any> => {
    try {
      const data = req.body;
      const context = new RuleExecutionContext();

      if (!data || !data.result || !Array.isArray(data.result)) {
        return res.status(400).json({ error: 'Invalid data format. Expected an object with a "result" array.' });
      }

      const reportHandler = new ExcelReportProcessor();
      let buffer: Buffer;

      const ruleCategories = data.categories && data.categories.length > 0 ? data.categories : undefined;

      const enabledRulesAndCategorys = await importAndCreateRuleInstances(ruleCategories);
      const customDiagnostic = new RapLPDiagnostic(context);
      customDiagnostic.processRuleExecutionInformation(data.result, enabledRulesAndCategorys.instanceCategoryMap);
      const diagnosticReports: DiagnosticReport[] = customDiagnostic.processDiagnosticInformation();

      try {
        buffer = reportHandler.generateReportDocumentBuffer(customDiagnostic);
      } catch (error) {
        console.error('Error generating report buffer:', error);
        return res.status(500).json({ error: 'Failed to generate report.' });
      }

      res.setHeader('Content-Disposition', 'attachment; filename="avstamningsfil.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (e) {
      next(e);
    }
  });
  /**
   * Endpoint 
   */
  app.post('/api/v1/validation/validatespec', async (req, res, next) => {
    try {
      const context = new RuleExecutionContext();
      const body: SpecValidationRequestDto = req.body;
      
      //0.5 Check input
      if (!body.spec) {
        throw new RapLPBaseApiError(
          'Ogiltig request',
          'Obligatoriskt fält saknas: spec',
          ERROR_TYPE.BAD_REQUEST,
          );
      }

      // 1. Decode input
      const raw = decodeBase64String(body.spec);
      const strict = body.strict ?? true;
      const categories = body.categories ?? [];

      // 2. Detect format-preferens 
      const prefer = detectSpecFormatPreference(
        undefined,
        raw,
        'auto',
      );
      // 3. Parse handling + strict-validate (Structural / Semantic errors)
      const parseResult = await parseApiSpecInput(
        { raw },
        {strict,preferJsonError: prefer},
      );

      // 4. Strict-issues → 
      if (parseResult.strictIssues?.length) {
        const sorted = IssueHelper.sortIssues(parseResult.strictIssues);
        const snippet = IssueHelper.formatIssuesAsEditorText(sorted);

         return res.status(400).json(
            new ProblemDetailsDTO({
              type: 'https://rap-lp./problems/semantic-validation',
              title: 'Regelvalideringen misslyckades',
              status: 400,
              detail: 'Specifikationen innehåller strukturella eller semantiska fel',
              instance: req.originalUrl,

              // Put in kind field to indicate violation
              kind: 'spec-validation',
              //Payload 
              issues: sorted, 
              snippet,
            }),          
         );
      }

      // 5. No strict-errors → run raplp ruleengine
      const parser: IParser<any> = (parseResult.format === 'json' ? Parsers.Json : Parsers.Yaml) as unknown as IParser<any>;
       const apiSpecDocument = new Document(parseResult.raw, parser, 'payload.yaml'); // In-memory-file to calculate correct positions when parsing
      const rules = await importAndCreateRuleInstances(context, categories);
      const result = await processApiSpec(context, rules, apiSpecDocument);

      const hasRuleViolations = result.result.some(
        d =>d.allvarlighetsgrad === 'ERROR' || d.allvarlighetsgrad === 'WARNING'
      );
      if (hasRuleViolations) {
         //Rulevalidation occured in RapLP-ruleengine
         return res.status(400).json(
            new ProblemDetailsDTO({
              type: 'https://rap-lp./problems/rule-validation',
              title: 'Regelvalideringen misslyckades',
              status: 400,
              detail: 'API-specifikationen bryter mot en eller flera regler enligt den svenska REST API-profilen.',
              instance: req.originalUrl,

              // Put in kind field to indicate violation
              kind: 'rule-validation',
              //Payload 
              payload: result,
            }),          
         );
      }
      // No rule violation and success response goes here
      return res.status(200).json({
        ok: true,
        //Payload 
        payload: result, 
      });
    } catch (e) {
      // Hantera SpecParseError här 
      next(e);
    }
  });  
};
