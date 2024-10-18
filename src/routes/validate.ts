import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import { Express } from 'express'
import multer from 'multer'
import { ERROR_TYPE, RapLPBaseApiError } from "../util/RapLPBaseApiError.ts"
import { processApiSpec, validateYamlInput } from "../util/apiUtil.ts"

export const registerValidationRoutes = (app: Express, enabledRulesAndCategorys: { rules: Record<string, any>,
    instanceCategoryMap: Map<string, any> }) => {

    // Route based on content-type, in order to support file upload.
    app.use(function(req, res, next) {
        if (req.url === "/api/v1/validate/content" && req.headers["content-type"]?.includes("multipart/form-data")) {
            req.url = "/api/v1/validate/file"
        }
        next();
    });

    // Route for raw content upload.
    app.post("/api/v1/validate/content", async (req, res, next) => {
        const rawInput = req.body;

        try {
            if(!validateYamlInput(rawInput)) {
                next(new RapLPBaseApiError("Kunde inte parsa YAML filen.", ERROR_TYPE.BAD_REQUEST));
                return
            }

            const apiSpecDocument = new Document(
                rawInput,
                Parsers.Yaml,
                ""
            );

            const result = await processApiSpec(enabledRulesAndCategorys, apiSpecDocument)
            res.send(result)
        } catch (e) {
            next(e)
        }
    })

    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage })

    // Route for uploading file through standard multipart/form-data.
    app.post("/api/v1/validate/file", upload.single("file"), async (req, res, next) => {

        const file = req.file;
        if (!file) {
            next(new RapLPBaseApiError("Kunde inte ladda upp fil.", ERROR_TYPE.INTERNAL_SERVER_ERROR))
            return
        }

        const fileContent = file.buffer.toString()
        if (!validateYamlInput(fileContent)) {
            next(new RapLPBaseApiError("Kunde inte parsa YAML filen.", ERROR_TYPE.BAD_REQUEST));
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
