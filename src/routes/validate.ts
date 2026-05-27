// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import * as fs from 'node:fs';
import util from 'util';
import { Document } from '@stoplight/spectral-core';
import Parsers from '@stoplight/spectral-parsers';
import { Express } from 'express';
import { decodeBase64String, processApiSpec,logError} from '../util/apiUtil.js';
import { importAndCreateRuleInstances } from '../util/ruleUtil.js';
import { ApiInfo } from '../model/ApiInfo.js';
import { ExcelReportProcessor } from '../util/excelReportProcessor.js';
import { DiagnosticReport, RapLPDiagnostic } from '../util/RapLPDiagnostic.js';
import * as IssueHelper from '../util/RapLPIssueHelpers.js'; 
import { parseApiSpecInput,detectSpecFormatPreference, ParseResult} from '../util/validateUtil.js';
import { ProblemDetailsDTO } from '../model/ProblemDetailsDto.js';
import { SpecValidationRequestDto } from '../model/SpecValidationRequestDto.js';
import { ERROR_TYPE, RapLPBaseApiError, sendProblem } from '../util/RapLPBaseApiErrorHandling.js';
import type { IParser } from '@stoplight/spectral-parsers';
import { RuleExecutionContext } from '../util/RuleExecutionContext.js';
import { parseRuleCategories,resolveRuleCategories,RULE_REGISTRY} from '../rulesets/util/ruleModules.js';
import { mapValidationExecutionError } from '../util/mapValidationExecutionError.js';
import { AggregateError } from '../util/RapLPCustomErrorInfo.js'

import { validateConcurrencyLimit } from '../util/validationConcurrencyLimit.js'


declare var AggregateError: {
  prototype: AggregateError;
  new (errors: any[], message?: string): AggregateError;
};


export const registerValidationRoutes = (app: Express) => {
  // Route for raw content upload.
  app.get('/api/v1/validation/rules', (req, res) => {
    res.send(RULE_REGISTRY);
  });

  app.get('/api/v1/api-info', async (req, res, next) => {
    res.send(
      new ApiInfo('RAP-LP', '1.0.11', new Date().toDateString(), 'http://raplp.digg.se/RAP-LP-docs', 'development'),
    );
  });
  app.post('/api/v1/validation/generate-report',
    validateConcurrencyLimit(Number(process.env.MAX_CONCURRENT_REPORTS ?? 2)),
    async (req, res, next): Promise<any> => {
    try {
      const data = req.body;
      const context = new RuleExecutionContext();
      const reportHandler = new ExcelReportProcessor();
      let buffer: Buffer;

      const customDiagnostic = new RapLPDiagnostic(context);
      customDiagnostic.setFromPrecomputedReport(data.report);
      const diagnosticReports: DiagnosticReport[] = customDiagnostic.processDiagnosticInformation();

      try {
        buffer = reportHandler.generateReportDocumentBuffer(customDiagnostic);
      } catch (error) {
        console.error('Error generating report buffer:', error);
        return sendProblem(res, 500,
          new ProblemDetailsDTO({
            type: 'https://raplp.digg.se/problems/internal-server-error',
            title: 'Failed to generate report',
            status: 500,
            detail: 'Failed to generate report.',
            instance: req.originalUrl,
          }),
        );
      }

      res.setHeader('Content-Disposition', 'attachment; filename="avstamningsfil.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (e) {
      next(e);
    }
  });
  app.post(
    '/api/v1/validation/validatespec',
    validateConcurrencyLimit(Number(process.env.MAX_CONCURRENT_VALIDATIONS ?? 4)),
     async (req, res, next) => {

    //Tmp testing
    console.log('VALIDATION_TEST_DELAY_MS=', process.env.VALIDATION_TEST_DELAY_MS);
    
    if (process.env.VALIDATION_TEST_DELAY_MS) {
      console.log('Delaying validation...START');
      await new Promise(resolve =>
        setTimeout(resolve, Number(process.env.VALIDATION_TEST_DELAY_MS)),
      );
      console.log('Delaying validation...END');      
    }      

    let strict = true;
    try {
      const context = new RuleExecutionContext();
      const body: SpecValidationRequestDto = req.body;
      
      //0.1 Check input
      if (!body.spec) {
        throw new RapLPBaseApiError(
          'Invalid Request',
          'Required field missing: spec',
          ERROR_TYPE.BAD_REQUEST,
          );
      }
      //0.2 Check input 
      if (typeof body.spec !== 'string') {
        throw new RapLPBaseApiError(
          'Invalid Request',
          'Field "spec" must be a base64 encoded string',
          ERROR_TYPE.BAD_REQUEST,
        );
      }      
      // 1. Decode input
      const raw = decodeBase64String(body.spec);
      strict = body.strict ?? true;
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

         return sendProblem(res, 400,
            new ProblemDetailsDTO({
              type: 'https://raplp.digg.se/problems/semantic-validation',
              title: 'Rule validation failed',
              status: 400,
              detail: 'Specifikationen innehåller strukturella eller semantiska fel',
              instance: req.originalUrl,

              // Put in kind field to indicate violation
              kind: 'spec-validation',
              format: parseResult.format,
              stage: 'strict',
              //Payload 
              issues: sorted, 
              snippet,
            }),          
         );
      }
      // 5. No strict-errors → run raplp ruleengine
      const parser: IParser<any> = (parseResult.format === 'json' ? Parsers.Json : Parsers.Yaml) as unknown as IParser<any>;
      const apiSpecDocument = new Document(parseResult.raw, parser, 'payload.yaml'); // In-memory-file to calculate correct positions when parsing

      const ruleCategories = parseRuleCategories(categories);
      const resolvedCategories = resolveRuleCategories(ruleCategories);

      const rules = await importAndCreateRuleInstances(context, resolvedCategories);
      const result = await processApiSpec(context, rules, apiSpecDocument);

      const hasRuleViolations = result.result.some(
        d =>d.allvarlighetsgrad === 'ERROR' || d.allvarlighetsgrad === 'WARNING'
      );
      if (hasRuleViolations) {
         //Rulevalidation occured in RapLP-ruleengine
         return sendProblem(res, 400,
            new ProblemDetailsDTO({
              type: 'https://raplp.digg.se/problems/rule-validation',
              title: 'Rule validation failed',
              status: 400,
              detail: 'API-specifikationen bryter mot en eller flera regler enligt den svenska REST API-profilen.',
              instance: req.originalUrl,

              // Put in kind field to indicate violation
              kind: 'rule-validation',
              stage: 'rule-engine',
              format: parseResult.format,
              //Payload 
              payload: result,
            }),          
         );
      }
      // No rule violation and success response goes here
      return res.status(200).json({
        ok: true,
        stage: 'rule-engine',
        format:parseResult.format,
        //Payload 
        payload: result, 
      });
    } catch (e) {
      // Hantera SpecParseError här 
      logError(e);
      next(
        mapValidationExecutionError(e, {
          strictEnabled: strict,
        }) 
      );
    }
  });  
};
