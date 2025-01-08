import { RapLPCustomSpectral } from "./RapLPCustomSpectral.ts";
import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import yaml from "js-yaml"

export const validateYamlInput = (input: string): input is string => {
    try {
        const parsed = yaml.load(input);

        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Parsed YAML is invalid or empty.',  { cause: 'INVALID_YAML'});
        }

        const requiredKeys = ['openapi', 'info', 'paths'];
        const missingKeys = requiredKeys.filter(key => !(key in parsed));

        if (missingKeys.length > 0) {
            throw new Error(`Missing required top-level keys: ${missingKeys.join(', ')}`,  { cause: 'MISSING_KEYS'});

        }
    } catch (error) {
        if (error instanceof yaml.YAMLException) {
            throw new Error( `YAML Syntax Error: ${error.message}`, { cause: 'SYNTAX_ERROR'});
        } else if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`Could not vaildate yaml: ${error}`)
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