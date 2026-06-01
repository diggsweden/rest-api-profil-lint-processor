// SPDX-FileCopyrightText: 2026 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2
import { Request, Response, NextFunction } from 'express';

/**
 * activeValidations is a global counter that keeps track of how many requests are currently active.
 * It is shared between all incoming requests.
 */
let activeValidations = 0; 

/**
 * Limit how many simultaneous “validations” or requests can be run at the same time. 
 * @param maxConcurrent Maximum of simultaneous requests may be active.
 * @returns 
 */
export function validateConcurrencyLimit(maxConcurrent: number) {
    return (req: Request, res:Response, next: NextFunction) => {
        if (activeValidations >= maxConcurrent) { // Check if the request fits or if it is full 
            //Service Unavailable
            console.log('REJECTING request, activeValidations is to high:', activeValidations );
            return res.status(503).json({
                error: 'Server is busy, Please try again later'
            });
        }
        activeValidations +=1;
        console.log('ACCEPTED request:', activeValidations);
        let released = false;

        //Releases handle when the request is complete.
        const release = () => {
            if (!released) {
                released = true;
                activeValidations = Math.max(0,activeValidations -1); // Decrease the value in activeValidations by 1,no negative values
            }
        };
        /***
         * Register cleanup-event-listeners that could release handle
         */
        res.on('finish', release); 
        res.on('close', release);
        res.on('error', release);

        next();        
    };
}
