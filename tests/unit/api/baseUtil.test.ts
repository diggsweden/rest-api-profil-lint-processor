
import { validateYamlInput } from "../../../src/util/baseUtil.ts"
import { RapLPBaseApiError } from "../../../src/util/RapLPBaseApiErrorHandling.ts";

describe('validateYamlInput', () => {
  test('should return true for valid YAML string with all top-level keys', () => {
    const validYaml = `
        openapi: 3.0.3
        info: some info
        paths:
      `;

    const result = validateYamlInput(validYaml);
    expect(result).toBe(true);
  });

  test('should throw error for missing top-level keys', () => {
    const missingTopLevelKeysYaml = `
        name: Jane Smith
        age: 25
        occupation: Designer
      `;

    try {
      validateYamlInput(missingTopLevelKeysYaml);
    } catch (error) {
      if (error instanceof RapLPBaseApiError) {
        expect(error.title).toBe("Missing required top-level keys");
        expect(error.message).toContain("Missing required top-level keys: openapi, info, paths");
      }
    }
  });


  test('should throw error for invalid YAML string', () => {
    // Invalid YAML: Missing colon after 'age'
    const invalidYaml = `
        name: Jane Smith
        age 25
        occupation: Designer
      `;

    try {
      validateYamlInput(invalidYaml);
    } catch (error) {
      if (error instanceof RapLPBaseApiError) {
        expect(error.title).toBe("Could not validate Yaml");
        expect(error.message).toContain("YAML Syntax Error:");
      }
    }

  });

  test('should throw error for malformed YAML', () => {
    // Completely malformed YAML
    const malformedYaml = `Just 
      some 
      random: text: that is not YAML.`;

    try {
      validateYamlInput(malformedYaml);
    } catch (error) {
      if (error instanceof RapLPBaseApiError) {
        expect(error.title).toBe("Could not validate Yaml");
        expect(error.message).toContain("YAML Syntax Error:");
      }
    }
  });

  test('should throw error for empty string', () => {
    const emptyYaml = "";

    try {
      validateYamlInput(emptyYaml);
    } catch (error) {
      if (error instanceof RapLPBaseApiError) {
        expect(error.title).toBe("Could not validate Yaml");
        expect(error.message).toContain("Parsed YAML is not a valid object");
      }
    }
  });
});
