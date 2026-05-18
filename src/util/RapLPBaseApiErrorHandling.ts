// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Request, Response, NextFunction } from 'express';
import { ProblemDetailsDTO } from '../model/ProblemDetailsDto.js';
import { SpecParseError } from './RapLPSpecParseError.js';

export const sendProblem = (res: Response, status: number, body: ProblemDetailsDTO) =>
  res.status(status).set('Content-Type', 'application/problem+json').json(body);

export enum ERROR_TYPE {
  BAD_REQUEST = 400,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

const PROBLEM_TYPE: Record<ERROR_TYPE, string> = {
  [ERROR_TYPE.BAD_REQUEST]: 'https://raplp.digg.se/problems/bad-request',
  [ERROR_TYPE.CONFLICT]: 'https://raplp.digg.se/problems/conflict',
  [ERROR_TYPE.INTERNAL_SERVER_ERROR]: 'https://raplp.digg.se/problems/internal-server-error',
};

/**
 * Extended error class with errorType that will be used as HTTP error codes in custom error handler.
 */
class RapLPBaseApiError extends Error {
  errorType: ERROR_TYPE;
  title: String;

  constructor(title: String, message: string, errorType: ERROR_TYPE) {
    super(message);
    this.errorType = errorType;
    this.title = title;
  }
}

class RuleCategoryError extends RapLPBaseApiError {
  constructor(message: string) {
    super('Rule Category Error', message, ERROR_TYPE.BAD_REQUEST);
  }
}

// Express.js middleware to map Extended

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

// SpecParseError --> 400 adapter impl
if (err instanceof SpecParseError) {

    const isRuleEngineCase = err.stage === 'rule-engine';  
    const isStrictCase = err.stage === 'strict';

    const problemDetails = new ProblemDetailsDTO({
      type: isRuleEngineCase 
        ? 'https://raplp.digg.se/problems/spec-validation'
        : 'https://raplp.digg.se/problems/spec-parse-error',

      title: isRuleEngineCase || isStrictCase
        ? 'Specifikationen kunde inte utvärderas fullt ut'
        : 'Okänt fel vid parsning av API-specifikationen',
      status: ERROR_TYPE.BAD_REQUEST,
      detail: err.message,
      instance: req.originalUrl,
      cause: err.cause instanceof Error
        ? { name: err.cause.name, message: err.cause.message }
        : undefined,
      /**Extra fields**/ 
      kind: isRuleEngineCase || isStrictCase ? 'spec-validation' : 'spec-parse',
      line: err.line,
      column: err.column,
      format: err.source, // For now used with backward compability
      stage: err.stage, // More finetuning needed, use this field

      //Optional metadata
      snippet: err.snippet,
    });

    return sendProblem(res, ERROR_TYPE.BAD_REQUEST, problemDetails);
}
  const status = err.errorType || err.status || ERROR_TYPE.INTERNAL_SERVER_ERROR;
  const isValidatorError = Array.isArray(err.errors);
  const title = err.title || (isValidatorError ? 'Invalid Request' : 'An unexpected error occurred');
  const detail = err.message || 'An unknown error occurred.';

  const problemDetails = new ProblemDetailsDTO({
    type: PROBLEM_TYPE[status as ERROR_TYPE] ?? 'about:blank',
    status,
    title,
    detail,
    instance: req.originalUrl,
  });

  sendProblem(res, status, problemDetails);
};

export { errorHandler, RapLPBaseApiError, RuleCategoryError };
