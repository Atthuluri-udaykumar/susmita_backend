import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { setErrorResponse, setSuccessResponse } from '../utils/ediresponse.util';
import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { AbstractController } from './abstract-controller';
import { logger } from '../utils/winston.config';
import { IAuthorisedRepService } from '../services/interfaces/authorised-rep-service.interface';
/**
 * Authorized Representative Controller
 */
@injectable()
export class AuthorisedRepController extends AbstractController {
     constructor(@inject(Symbols.IAuthorisedRepService)  private service: IAuthorisedRepService) {
        super();
    }

    /**
     * Retrieves Person's details by either login-id or email-id
     * @param req, res
     * @return exists response's code status and body
     */
    @loggable(false, false)
    public async findReporterByRreOrEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        const email = req.query.email;
        const rreId = req.query.rreid;

        try {
            if (rreId) {
                const personinfo = await this.service.findARbyRptrId(rreId as string);
                setSuccessResponse(personinfo, res);
            } else if (email) {
                const personinfo = await this.service.findARbyEmail((email as string).toLowerCase());
                setSuccessResponse(personinfo, res);
            } else {
                res.status(400).json({ message: "Your request was invalid. You must pass in an rreid or email in the querystring." });
            }
        } catch (error) {
            logger.error( error);
            setErrorResponse(res, error);
        }
    }
}