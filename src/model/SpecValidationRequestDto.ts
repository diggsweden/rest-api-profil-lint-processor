export class SpecValidationRequestDto {
    /** Base 64 encoded OpenAPI spec (YAML or JSON) */
    spec!: string;

    /** Rule categories to enable */
    categories?: string[];

    /** Enable strict OpenAPI validation (structural and sematic) */
    strict?: boolean;
}