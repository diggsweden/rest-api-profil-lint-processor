import { RapLPCustomSpectral } from "./RapLPCustomSpectral.ts";
import { Document } from "@stoplight/spectral-core"
import Parsers from "@stoplight/spectral-parsers"
import { ERROR_TYPE, RapLPBaseApiError } from "./RapLPBaseApiError.ts";
import yaml from "js-yaml"

export const validateYamlInput = (input: unknown): input is string => {
    if(typeof input !== 'string') {
        return false
    }

    try {
        //Parse the yaml to verify
        yaml.load(input);
    } catch (e) {
        // Handle YAML parsing error
        throw new RapLPBaseApiError("Invalid YAML", ERROR_TYPE.BAD_REQUEST);
    }

    return true
}

export async function processApiSpec(enabledRulesAndCategorys: { rules: Record<string, any>; instanceCategoryMap: Map<string, any>; }, apiSpecDocument: Document<unknown, Parsers.YamlParserResult<unknown>>) {
    const customSpectral = new RapLPCustomSpectral();
    customSpectral.setCategorys(enabledRulesAndCategorys.instanceCategoryMap);
    customSpectral.setRuleset(enabledRulesAndCategorys.rules);
    return await customSpectral.run(apiSpecDocument);
}
