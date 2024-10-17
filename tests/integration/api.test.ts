import { readFileSync } from "fs";
import { startServer } from "../../src/api-mode.ts"
import { ValidateApi } from "../generated/apis/index.ts";
import { Configuration, ResponseError } from "../generated/runtime.ts";
import path from "path";
import { fileURLToPath } from "url";

/*
* Since we're both writing the openapi specification and the server manually
* we need a way to assure that they are in sync.
* 
* This test i dependent on the "pretest" stage in package.json, which will generate a 
* typescript client from the specification which we can use to test our server.
*/


// Emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("API Test", () => {
    var api: ValidateApi;
    var app: any
    beforeAll(async () => {
        app = await startServer();
        api = new ValidateApi(new Configuration({ basePath: "http://localhost:3000/api/v1" }))
    })
    it("test", async () => {
        const data = readFileSync(path.resolve(__dirname, "../../openapi.yaml"))
        //try {
            const response = await api.validateContent({
                body: data.toString()
            })

            expect(response.length).toBeGreaterThan(0)
        /*}
        catch (error: any) { //Ta reda på varför den failar och lyckas fallera då den kommer in i catch
            fail("Something went wrong, shouldn't reach this catch")
        }*/

        
    })
    afterAll(async () => {
        app.close()
    })
})