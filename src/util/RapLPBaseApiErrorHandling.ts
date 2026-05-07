// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Request, Response, NextFunction } from 'express';
import { ProblemDetailsDTO } from '../model/ProblemDetailsDto.js';
import { SpecParseError } from './RapLPSpecParseError.js';

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

    return res.status(ERROR_TYPE.BAD_REQUEST).send(problemDetails);  
}
  const status = err.errorType || err.status || ERROR_TYPE.INTERNAL_SERVER_ERROR;
  const title = err.title || 'An unexpected error occurred';
  const detail = err.message || 'An unknown error occurred.';

  const problemDetails = new ProblemDetailsDTO({
    status,
    title,
    detail,
    instance: req.originalUrl,
  });

  res.status(status).send(problemDetails);
};

export enum ERROR_TYPE {
  BAD_REQUEST = 400,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export { errorHandler, RapLPBaseApiError, RuleCategoryError };
