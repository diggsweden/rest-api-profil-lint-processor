import { readFileSync } from "fs";
import { startServer } from "../src/api-mode.ts"
import { ValidateApi } from "./generated/apis/index.ts";
import { Configuration } from "./generated/runtime.ts";
import { Server } from 'http'
import path from "path";

/*
* Since we're both writing the openapi specification and the server manually
* we need a way to assure that they are in sync.
* 
* This test i dependent on the "pretest" stage in package.json, which will generate a 
* typescript client from the specification which we can use to test our server.
*/
describe("API Test", () => {
    var api: ValidateApi;
    var app: Server
    beforeAll(async () => {
        app = await startServer();
        api = new ValidateApi(new Configuration({basePath: "http://localhost:3000/api/v1" }))
    })
    it("test", async () => {
        const data = readFileSync(path.resolve(__dirname, "../openapi.yaml"))
        const response = await api.validateContent({
            body: data.toString()
        })

        expect(response.length).toBeGreaterThan(0)
    })
    afterAll(async () => {
        app.close()
    })
})