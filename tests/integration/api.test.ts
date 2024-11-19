import { readFileSync } from "fs";
import { startServer } from "../../src/api-mode.ts"
import { ValidateApi } from "../generated/apis/index.ts";
import { Configuration } from "../generated/runtime.ts";
import path from "path";
import { fileURLToPath } from "url";
import request from 'supertest'
import { YamlContentDto } from "../../src/model/YamlContentDto.ts";

// Emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
* Since we're both writing the openapi specification and the server manually
* we need a way to assure that they are in sync.
* 
* This test i dependent on the "pretest" stage in package.json, which will generate a 
* typescript client from the specification which we can use to test our server.
*/
describe("API Test", () => {
    var api: ValidateApi;
    var app: any

    beforeAll(async () => {
        const mockArgs = {
            enableUrlValidation: false,
            urlValidationConfigFile: 'custom-config.json',
          };

        app = await startServer(mockArgs);
        api = new ValidateApi(new Configuration({ basePath: "http://localhost:3000/api/v1" }))
    })

    it("Assert that the endpoint is returning correct body", async () => {
        const data = readFileSync(path.resolve(__dirname, "../../apis/dok-api.yaml"))

        const response = await api.validateContent({
            yamlContentDto: new YamlContentDto(data.toString("base64"), [])
        })

        expect(response.length).toBe(9)

    })

    it("Assert that the error handler is intercepting faults", async () => {
        const data = readFileSync(path.resolve(__dirname, "../../apis/dok-api.yaml"))
        const missingTopLevelKeysYaml = `
        name: Jane Smith
        age: 25
        occupation: Designer
      `;

        const response = await request(app)
            .post("/api/v1/validation/validate")
            .set('Content-Type', 'application/json')
            .send({
                yaml: Buffer.from(missingTopLevelKeysYaml).toString('base64'),
                categories: []
            })


        expect(response.status).toBe(400)
        expect(response.body).toMatchObject({
            type: "about:blank",
            title: "Missing required top-level keys",
            status: 400,
            detail: "Missing required top-level keys: openapi, info, paths",
            instance: "/api/v1/validation/validate"
        })



    })

    afterAll(async () => {
        app.close()
    })
})