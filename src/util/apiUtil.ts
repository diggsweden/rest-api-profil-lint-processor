import { RapLPCustomSpectral } from "./RapLPCustomSpectral.ts";
import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import { ERROR_TYPE, RapLPBaseApiError } from "./RapLPBaseApiErrorHandling.ts";
import yaml from "js-yaml"

export const validateYamlInput = (input: string): input is string => {
    try {
        const parsed = yaml.load(input); // Parsar YAML till ett JSON-objekt

        if (typeof parsed !== 'object' || parsed === null) {
            throw new RapLPBaseApiError(
                "Could not validate Yaml",
                "Parsed YAML is not a valid object",
                ERROR_TYPE.BAD_REQUEST);
        }

        // Kontrollera att alla nödvändiga toppnivånycklar finns
        const requiredKeys = ['openapi', 'info', 'paths'];
        const missingKeys = requiredKeys.filter(key => !(key in parsed));

        if (missingKeys.length > 0) {
            throw new RapLPBaseApiError(
                "Missing required top-level keys",
                `Missing required top-level keys: ${missingKeys.join(', ')}`,
                ERROR_TYPE.BAD_REQUEST);
        }
    } catch (error) {
        // Handle YAML parsing error
        if (error instanceof yaml.YAMLException) {
            throw new RapLPBaseApiError(
                "Could not validate Yaml",
                `YAML Syntax Error: ${error.message}`,
                ERROR_TYPE.BAD_REQUEST);
        } else if (error instanceof RapLPBaseApiError) {
            throw error
        } else {
            throw new RapLPBaseApiError(
                "Failed to validate yaml",
                `Could not vaildate yaml: ${error}`,
                ERROR_TYPE.INTERNAL_SERVER_ERROR
            )
        }

    }

    return true;
}

export function decodeBase64String(base64YamlFile: string) {
    // Import the necessary Node.js module (Buffer is built-in)
    const atob = (b64String: string): string => Buffer.from(b64String, 'base64').toString('utf-8');

    // Decode the base64 string
    const decodedYaml = atob(base64YamlFile);

    return decodedYaml;
}

export async function processApiSpec(enabledRulesAndCategorys: { rules: Record<string, any>; instanceCategoryMap: Map<string, any>; }, apiSpecDocument: Document<unknown, Parsers.YamlParserResult<unknown>>) {
    const customSpectral = new RapLPCustomSpectral();
    customSpectral.setCategorys(enabledRulesAndCategorys.instanceCategoryMap);
    customSpectral.setRuleset(enabledRulesAndCategorys.rules);
    return await customSpectral.run(apiSpecDocument);
}

/**
 * https://oida.dev/typescript-hasownproperty/
 * @param obj Object to check
 * @param prop Property to check for
 * @returns Boolean
 */
export function hasOwnProperty<X extends {}, Y extends PropertyKey>
    (obj: X, prop: Y): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop)
}