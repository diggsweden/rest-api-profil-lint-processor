// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { ERROR_TYPE, errorHandler, RapLPBaseApiError } from '../../../src/util/RapLPBaseApiErrorHandling';
import { ProblemDetailsDTO } from '../../../src/model/ProblemDetailsDto';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

describe('errorHandler middleware', () => {
  let req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;
  let res: Response<any, Record<string, any>>;
  let next: NextFunction;

  beforeEach(async () => {
    // Mock the Express req, res, and next
    req = {
      originalUrl: '/example',
    } as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    next = jest.fn() as NextFunction;
  });

  it('should handle RapLPBaseApiError and return the correct response - http 400, bad request', () => {
    // Create a mock error
    const error = new RapLPBaseApiError('Test title', 'Test error', ERROR_TYPE.BAD_REQUEST);

    // Call the error handler
    errorHandler(error, req, res, next);

    // Check that res.status was called with the correct status code
    expect(res.status).toHaveBeenCalledWith(400);

    // Access the response object passed to res.send
    const sendMock = res.json as jest.Mock;
    const sentResponse = sendMock.mock.calls[0][0] as ProblemDetailsDTO;

    // Validate the structure and content of the sent response
    expect(sentResponse).toMatchObject({
      type: 'https://raplp.digg.se/problems/bad-request',
      title: 'Test title',
      status: 400,
      detail: 'Test error',
      instance: '/example',
    });
  });

  it('should handle RapLPBaseApiError and return the correct response - http 500, internal server error', () => {
    // Create a mock error
    const error = new RapLPBaseApiError('Test title', 'Test error', ERROR_TYPE.INTERNAL_SERVER_ERROR);

    // Call the error handler
    errorHandler(error, req, res, next);

    // Check that res.status was called with the correct status code
    expect(res.status).toHaveBeenCalledWith(500);

    // Access the response object passed to res.send
    const sendMock = res.json as jest.Mock;
    const sentResponse = sendMock.mock.calls[0][0] as ProblemDetailsDTO;

    // Validate the structure and content of the sent response
    expect(sentResponse).toMatchObject({
      type: 'https://raplp.digg.se/problems/internal-server-error',
      title: 'Test title',
      status: 500,
      detail: 'Test error',
      instance: '/example',
    });
  });

  it('should default to status code 500 if error is not RapLPBaseApiError', () => {
    // Create a mock error without a status code
    const error = new Error('Internal server error');

    // Call the error handler
    errorHandler(error, req, res, next);

    // Check that res.status was called with 500
    expect(res.status).toHaveBeenCalledWith(500);

    // Access the response object passed to res.send
    const sendMock = res.json as jest.Mock;
    const sentResponse = sendMock.mock.calls[0][0] as ProblemDetailsDTO;

    // Validate the structure and content of the sent response
    expect(sentResponse).toMatchObject({
      type: 'https://raplp.digg.se/problems/internal-server-error',
      title: 'An unexpected error occurred',
      status: 500,
      detail: 'Internal server error',
      instance: '/example',
    });
  });
});
