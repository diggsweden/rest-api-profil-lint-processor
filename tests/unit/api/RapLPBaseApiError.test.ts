import { ERROR_TYPE, errorHandler, RapLPBaseApiError } from '../../../src/util/RapLPBaseApiError';
import { ErrorMessageDto } from '../../../src/model/ErrorMessageDto';
import { Request, Response, NextFunction } from 'express';

describe('errorHandler middleware', () => {
    it('should handle RapLPBaseApiError and return the correct response - http 400, bad request', () => {
        // Mock the Express req, res, and next
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;
        const next = jest.fn() as NextFunction;

        // Create a mock error
        const error = new RapLPBaseApiError('Test error', ERROR_TYPE.BAD_REQUEST);

        // Call the error handler
        errorHandler(error, req, res, next);

        // Check that res.status was called with the correct status code
        expect(res.status).toHaveBeenCalledWith(400);

         // Access the response object passed to res.send
         const sendMock = res.send as jest.Mock;
         const sentResponse = sendMock.mock.calls[0][0] as ErrorMessageDto;

        // Validate the structure and content of the sent response
        expect(sentResponse).toMatchObject({
            code: 400,
            message: 'Test error',
            timestamp: expect.any(Date),
        });

    });

    it('should handle RapLPBaseApiError and return the correct response - http 500, internal server error', () => {
        // Mock the Express req, res, and next
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;
        const next = jest.fn() as NextFunction;

        // Create a mock error
        const error = new RapLPBaseApiError('Test error', ERROR_TYPE.INTERNAL_SERVER_ERROR);

        // Call the error handler
        errorHandler(error, req, res, next);

        // Check that res.status was called with the correct status code
        expect(res.status).toHaveBeenCalledWith(500);

         // Access the response object passed to res.send
         const sendMock = res.send as jest.Mock;
         const sentResponse = sendMock.mock.calls[0][0] as ErrorMessageDto;

        // Validate the structure and content of the sent response
        expect(sentResponse).toMatchObject({
            code: 500,
            message: 'Test error',
            timestamp: expect.any(Date),
        });

    });

    it('should default to status code 500 if error is not RapLPBaseApiError', () => {
        // Mock the Express req, res, and next
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        } as unknown as Response;
        const next = jest.fn() as NextFunction;

        // Create a mock error without a status code
        const error = new Error('Internal server error');

        // Call the error handler
        errorHandler(error, req, res, next);

        // Check that res.status was called with 500
        expect(res.status).toHaveBeenCalledWith(500);

         // Access the response object passed to res.send
         const sendMock = res.send as jest.Mock;
         const sentResponse = sendMock.mock.calls[0][0] as ErrorMessageDto;

        // Validate the structure and content of the sent response
        expect(sentResponse).toMatchObject({
            code: 500,
            message: 'Internal server error',
            timestamp: expect.any(Date)
        });
    });
});
