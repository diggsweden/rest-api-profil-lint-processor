
// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export class SpecValidationRequestDto {
    /** Base 64 encoded OpenAPI spec (YAML or JSON) */
    spec!: string;

    /** Rule categories to enable */
    categories?: string[];

    /** Enable strict OpenAPI validation (structural and sematic) */
    strict?: boolean;
}