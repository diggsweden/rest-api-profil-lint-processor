import { Document } from "@stoplight/spectral-core";
import Parsers from "@stoplight/spectral-parsers";
import { Express } from "express";
import {
  decodeBase64String,
  processApiSpec,
  validateYamlInput,
} from "../util/apiUtil.ts";
import { YamlContentDto } from "../model/YamlContentDto.ts";
import { importAndCreateRuleInstances } from "../util/ruleUtil.ts";
import { ApiInfo } from "../model/ApiInfo.ts";
import { validationRules } from "../model/validationRules.ts";
import { ExcelReportProcessor } from "../util/excelReportProcessor.ts"
import {DiagnosticReport, RapLPDiagnostic } from "../util/RapLPDiagnostic.ts";

export const registerValidationRoutes = (app: Express) => {
  // Route for raw content upload.
  app.post("/api/v1/validation/validate", async (req, res, next) => {
    try {
      const yamlContent: YamlContentDto = req.body;

      let yamlContentString: string;
      yamlContentString = decodeBase64String(yamlContent.yaml);

      validateYamlInput(yamlContentString);

      const apiSpecDocument = new Document(yamlContentString, Parsers.Yaml, "");

      const rules = await importAndCreateRuleInstances(yamlContent.categories);

      const result = await processApiSpec(rules, apiSpecDocument);
      res.send(result);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/v1/validation/rules", (req, res) => {
    res.send(validationRules);
  });

  app.get("/api/v1/api-info", async (req, res, next) => {
    res.send(
      new ApiInfo(
        "RAP-LP",
        "1.0.11",
        new Date().toDateString(),
        "http://example.digg.se/RAP-LP-docs",
        "development"
      )
    );
  });

  app.post("/api/v1/validation/generate-report", async (req, res, next): Promise<any> => {
    try {
      const data = req.body;

    if (!data || !data.result || !Array.isArray(data.result)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an object with a "result" array.' });
    }
    
    const reportHandler = new ExcelReportProcessor();
    let buffer: Buffer;

    const ruleCategories = data.categories && data.categories.length > 0 ?  data.categories: undefined;


    const enabledRulesAndCategorys = await importAndCreateRuleInstances(ruleCategories);
    const customDiagnostic = new RapLPDiagnostic();
    customDiagnostic.processRuleExecutionInformation(data.result,enabledRulesAndCategorys.instanceCategoryMap);
    const diagnosticReports: DiagnosticReport[] = customDiagnostic.processDiagnosticInformation();

    try {
        buffer = reportHandler.generateReportDocumentBuffer(customDiagnostic);
    } catch (error) {
        console.error("Error generating report buffer:", error);
        return res.status(500).json({ error: 'Failed to generate report.' });
    }
  
    res.setHeader('Content-Disposition', 'attachment; filename="avstamningsfil.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer)

    } catch (e) {
      next(e)
    }
  });
};
