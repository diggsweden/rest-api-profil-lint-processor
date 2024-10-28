import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import { Express } from 'express'
import { decodeBase64String, processApiSpec, validateYamlInput } from "../util/apiUtil.ts"
import { YamlContentDto } from "../model/YamlContentDto.ts"
import { importAndCreateRuleInstances } from "../util/ruleUtil.ts"
import { ApiInfo } from "../model/ApiInfo.ts"

export const registerValidationRoutes = (app: Express) => {

    // Route for raw content upload.
    app.post("/api/v1/validation/validate", async (req, res, next) => {
        try {
            const yamlContent: YamlContentDto = req.body

            let yamlContentString: string;
            yamlContentString = decodeBase64String(yamlContent.yaml)

            validateYamlInput(yamlContentString)

            const apiSpecDocument = new Document(
                yamlContentString,
                Parsers.Yaml,
                ""
            );

            const rules = await importAndCreateRuleInstances(yamlContent.categories);

            const result = await processApiSpec(rules, apiSpecDocument)
            res.send(result)
        } catch (e) {
            next(e)
        }
    })

    app.get("/api/v1/api-info", async (req, res, next) => {
        res.send(new ApiInfo("RAP-LP", "1.0.11", new Date().toDateString(), "http://example.digg.se/RAP-LP-docs", "development"));
    })
}
