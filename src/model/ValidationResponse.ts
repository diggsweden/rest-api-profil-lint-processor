// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { ValidationResponseDto } from './ValidationResponseDto.js';
import { Issue } from '../util/Issue.js';

/**
 * Overhead Validation type
 * Encapsulates either success or validation error.
 */
export type ValidationResponse = 
| ValidationSuccessResponse
| ValidationIssuesResponse;

export interface ValidationSuccessResponse {
    ok: true;
    payload: ValidationResponseDto;
}
/**
 * Not an technical error --> No ProblemDetailsDTO
 */
export interface ValidationIssuesResponse {
    ok: false;
    kind: 'validation';
    issues: Issue[];
    snippet: string;
}

