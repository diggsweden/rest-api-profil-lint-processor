import { Request, Response, NextFunction } from 'express';

let activeValidations = 0;


export function validateConcurrencyLimit(maxConcurrent: number) {
    return (req: Request, res:Response, next: NextFunction) => {
        if (activeValidations >= maxConcurrent) {
            //Service Unavailable
            return res.status(503).json({
                error: 'Server is busy, Please try again later'
            });
        }
        activeValidations +=1;
        console.log('INCREMENT:', activeValidations);
        let released = false;

        const release = () => {
            if (!released) {
                released = true;
                activeValidations = Math.max(0,activeValidations -1);
                console.log('RELEASE:', activeValidations);
            }
        };
        res.on('finish', release);
        res.on('close', release);
        res.on('error', release);

        next();        
    };
}