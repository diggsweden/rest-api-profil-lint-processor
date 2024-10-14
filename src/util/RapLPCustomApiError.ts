import { Request, Response, NextFunction } from "express";

/**
 * Extended error class with errorType that will be used as HTTP error codes in custom error handler.
 */
export class RapLPCustomApiError extends Error {

    private _errorType: ERROR_TYPE;

    constructor(message: string, errorType: ERROR_TYPE) {
        super(message);
        this._errorType = errorType;
    }

    get errorType() {
        return this._errorType;
    }
}

export const isExtendedError = (error: unknown): error is RapLPCustomApiError => {
    return (error as RapLPCustomApiError)?.errorType != null;
}

// Express.js middleware to map Extended
export const errorHadler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if(isExtendedError(err)) {
        res
        .status(err.errorType)
    } else {
        res
        .status(ERROR_TYPE.INTERNAL_SERVER_ERROR)
    }

    res.send(`ERROR: ${err.message}`)
}

export enum ERROR_TYPE {
    BAD_REQUEST = 400,
    INTERNAL_SERVER_ERROR = 500
}