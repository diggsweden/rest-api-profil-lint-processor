import { Request, Response, NextFunction } from "express";
import { ErrorMessageDto } from "../model/ErrorMessageDto.ts"
import { hasOwnProperty } from "./apiUtil.ts";

/**
 * Extended error class with errorType that will be used as HTTP error codes in custom error handler.
 */
export class RapLPBaseApiError extends Error {

    private _errorType: ERROR_TYPE;

    constructor(message: string, errorType: ERROR_TYPE) {
        super(message);
        this._errorType = errorType;
    }

    get errorType() {
        return this._errorType;
    }
}

export const isExtendedError = (error: unknown): error is RapLPBaseApiError => {
    return (error as RapLPBaseApiError)?.errorType != null;
}

// Express.js middleware to map Extended
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err)
    var errorType: ERROR_TYPE;
    if (isExtendedError(err)) {
        errorType = err.errorType
    } else {
        if (hasOwnProperty(err, "status")) {
            errorType = err.status
        } else {
            errorType = ERROR_TYPE.INTERNAL_SERVER_ERROR
        }
    }

    const errorMessage = new ErrorMessageDto(
        errorType,
        err.message,
        new Date()
    )

    res.status(errorType).send(errorMessage)
}

export enum ERROR_TYPE {
    BAD_REQUEST = 400,
    INTERNAL_SERVER_ERROR = 500
}

export { errorHandler }