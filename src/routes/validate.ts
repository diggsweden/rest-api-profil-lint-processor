import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import { Express } from 'express'
import { decodeBase64String, processApiSpec, validateYamlInput } from "../util/baseUtil.ts"
import { YamlContentDto } from "../model/YamlContentDto.ts"
import { importAndCreateRuleInstances } from "../util/ruleUtil.ts"
import { ApiInfo } from "../model/ApiInfo.ts"
import { validationRules } from "../model/validationRules.ts";
import { ERROR_TYPE, RapLPBaseApiError } from "../util/RapLPBaseApiErrorHandling.ts";

import { ExcelReportProcessor } from "../util/excelReportProcessor.ts"

export const registerValidationRoutes = (app: Express) => {
  app.post("/api/v1/validation/validate", async (req, res, next) => {
    try {
      const yamlContent: YamlContentDto = req.body;

        let yamlContentString: string;
        yamlContentString = decodeBase64String(yamlContent.yaml)
        try {
          validateYamlInput(yamlContentString);
        } catch (error) {
          if (error instanceof Error) {
            const cause = error.cause;
            switch (cause) {
              case 'INVALID_YAML':
                throw new RapLPBaseApiError(
                  "Could not validate Yaml",
                  `${error}`,
                  ERROR_TYPE.BAD_REQUEST);
              case 'MISSING_KEYS':
                throw new RapLPBaseApiError(
                  "Missing required top-level keys",
                  `${error}`,
                  ERROR_TYPE.BAD_REQUEST);
              case 'SYNTAX_ERROR':
                throw new RapLPBaseApiError(
                  "Could not validate Yaml",
                  `${error}`,
                  ERROR_TYPE.BAD_REQUEST);
              default:
                console.error(`Unexpected error: ${error.message}`);
            }
            return;
          } else {
            console.error('Unknown error occurred.');
            return;
          }
        }

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

    if (!data || !data.report || !Array.isArray(data.report)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an object with a "report" array.' });
    }
    
    const reportHandler = new ExcelReportProcessor();
    let buffer: Buffer;

    try {
        buffer = reportHandler.generateReportDocumentBuffer(data.report);
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
