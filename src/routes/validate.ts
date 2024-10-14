import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import { Express } from 'express'
import multer from 'multer'
import { ERROR_TYPE, RapLPCustomApiError } from "../util/RapLPCustomApiError.ts"
import { processApiSpec, validateYamlInput } from "../util/apiUtil.ts"

export const registerValidationRoutes = (app: Express, enabledRulesAndCategorys: { rules: Record<string, any>,
    instanceCategoryMap: Map<string, any> }) => {

    // Route for raw content upload.
    app.post("/validate/raw", async (req, res, next) => {
        const rawInput = req.body;

        if(!validateYamlInput(rawInput)) {
            next(new RapLPCustomApiError("Kunde inte parsa YAML filen.", ERROR_TYPE.BAD_REQUEST));
            return
        }

        const apiSpecDocument = new Document(
            rawInput,
            Parsers.Yaml,
            ""
        );

        const result = await processApiSpec(enabledRulesAndCategorys, apiSpecDocument)
        res.send(result)
    })

    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage })

    // Route for uploading file through standard multipart/form-data.
    app.post("/validate/file", upload.single("file"), async (req, res, next) => {

        const file = req.file;
        if (!file) {
            next(new RapLPCustomApiError("Kunde inte ladda upp fil.", ERROR_TYPE.INTERNAL_SERVER_ERROR))
            return
        }

        const fileContent = file.buffer.toString()
        if (!validateYamlInput(fileContent)) {
            next(new RapLPCustomApiError("Kunde inte parsa YAML filen.", ERROR_TYPE.BAD_REQUEST));
            return
        }

        const apiSpecDocument = new Document(
            fileContent,
            Parsers.Yaml,
            file.originalname
        );

        const result = await processApiSpec(enabledRulesAndCategorys, apiSpecDocument)
        res.send(result)
    })
}
