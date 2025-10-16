// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

// validateUtil.ts

async function validate(filepath: string) {


}
export const validateSpecification = (input: string): input is string => {

    return true;
}





export const validateYamlInput = (input: string): input is string => {
  try {
    //Parse the yaml to verify
    //yaml.load(input);
  } catch (e) {
    // Handle YAML parsing error
    /*throw new RapLPBaseApiError(
      "Could not validate Yaml",
      "Invalid YAML",
      ERROR_TYPE.BAD_REQUEST
    );*/
  }

  return true;
};


/**
 * 
 * 
 * 
 */
