import { Request, Response, NextFunction } from "express";
import { ProblemDetailsDTO } from "../model/ProblemDetailsDto.js";

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
        super("Rule Category Error", message, ERROR_TYPE.BAD_REQUEST);
    }
}


// Express.js middleware to map Extended
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err)

    const status = err.errorType || err.status || ERROR_TYPE.INTERNAL_SERVER_ERROR
    const title = err.title || "An unexpected error occurred";
    const detail = err.message || "An unknown error occurred.";

    const problemDetails = new ProblemDetailsDTO({
        status,
        title,
        detail,
        instance: req.originalUrl
    });

    res.status(status).send(problemDetails)
}

export enum ERROR_TYPE {
    BAD_REQUEST = 400,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500
}

export { errorHandler, RapLPBaseApiError, RuleCategoryError }