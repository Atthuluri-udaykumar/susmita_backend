import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { setErrorResponse, setSuccessResponse } from '../utils/ediresponse.util';
import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { AbstractController } from './abstract-controller';
import { logger } from '../utils/winston.config';
import { IPersonInfoService } from '../services/interfaces/person-info-service.interface';
import { PersonInfo } from '../models/person-info.model';
/**
 * Person info Controller
 */
@injectable()
export class PersonInfoController extends AbstractController {

     constructor(@inject(Symbols.IPersonInfoService)  private service: IPersonInfoService) {
        super();
    }

    /**
     * Retrieves Person's details by either login-id or email-id
     * @param req, res
     * @return exists response's code status and body
     */
    @loggable(false, false)
    public async findPersonByLoginOrEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        const email = req.query.email;
        const loginId = req.query.loginid;

        try {
            if (loginId || email) {
                const personinfo =  loginId? 
                                    await this.service.find(req.user!, null, loginId as string): 
                                    await this.service.find(req.user!, (email as string).toLowerCase(), null);
                setSuccessResponse(personinfo, res);
            } else {
                res.status(400).json({ message: "Your request was invalid. You must pass in an loginid or email in the querystring." });
            }
        } catch (error) {
            logger.error( error);
            setErrorResponse(res, error);
        }
    }

    /**
     * Update Person's detail based on the action-item selected
     * @param req, res
     * @return exists response's code status and body
     */
    @loggable(false, false)
    public async updatePerson(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.validateReceivedData(req);
            const personInfo = req.body as PersonInfo;

            if (personInfo && personInfo.actionInfo) {
                const updateResult =  await this.service.update(req.user!, personInfo); 
                setSuccessResponse(updateResult, res);
            } else {
                res.status(400).json({ message: "Your request was invalid. You must pass in valid Person info with selected action in request-body." });
            }
        } catch (error) {
            logger.error( error);
            setErrorResponse(res, error);
        }
    }
}
