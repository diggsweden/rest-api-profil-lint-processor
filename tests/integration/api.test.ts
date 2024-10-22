import { readFileSync } from "fs";
import { startServer } from "../../src/api-mode.ts"
import { ValidateApi } from "../generated/apis/index.ts";
import { Configuration, ResponseError } from "../generated/runtime.ts";
import path from "path";
import { fileURLToPath } from "url";
import request from 'supertest'

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
        app = await startServer();
        api = new ValidateApi(new Configuration({ basePath: "http://localhost:3000/api/v1" }))
    })

    it("test", async () => {
        const data = readFileSync(path.resolve(__dirname, "../../openapi.yaml"))

        const response = await api.validateContent({
            body: data.toString()
        })

        expect(response.length).toBeGreaterThan(0)


    })

    it("assert error handler works as intended with simple invalid yaml", async () => {
        const invalidYaml = `
            this: is
              invalid: yaml
            not-well-formatted
        `;


        const response = await request(app)
            .post("/api/v1/validate/content")
            .set('Content-Type', 'application/yaml')
            .send(invalidYaml)

        expect(response.status).toBe(400)
        expect(response.body).toMatchObject({
            code: 400,
            message: "Invalid YAML",
            timestamp: expect.any(String),
        })


    })

    afterAll(async () => {
        app.close()
    })
})