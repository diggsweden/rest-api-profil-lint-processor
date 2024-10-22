import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import { Express } from 'express'
import { ERROR_TYPE, RapLPBaseApiError } from "../util/RapLPBaseApiError.ts"
import { decodeBase64String, processApiSpec, validateYamlInput } from "../util/apiUtil.ts"
import { ContentType, YamlContentDto } from "../model/YamlContentDto.ts"
import { importAndCreateRuleInstances } from "../util/ruleUtil.ts"

export const registerValidationRoutes = (app: Express) => {

    // Route for raw content upload.
    app.post("/api/v1/validate/content", async (req, res, next) => {
        try {
            const yamlContent: YamlContentDto = req.body

            let yamlContentString: string;
            if (yamlContent.contentType === ContentType.FILE) {
                //Handle base64Encoded file
                yamlContentString = decodeBase64String(yamlContent.yaml)
            } else {
                yamlContentString = yamlContent.yaml
            }

            if (!validateYamlInput(yamlContentString)) {
                next(new RapLPBaseApiError("Kunde inte parsa YAML filen.", ERROR_TYPE.BAD_REQUEST));
                return
            }

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
}
