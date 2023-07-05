import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { setErrorResponse, setSuccessResponse } from '../utils/ediresponse.util';
import { Symbols } from '../utils/types';
import { AbstractController } from './abstract-controller';
import { logger } from '../utils/winston.config';
import { IEcrsService } from '../services/interfaces/ecrs-service.interface';
import { IEcrsController } from './interfaces/ecrs-controller.interface';
import { HttpException } from '../models/HttpException';
/**
 * Account Info Controller
 */
@injectable()
export class EcrsController extends AbstractController implements IEcrsController {
    constructor(@inject(Symbols.IEcrsService) private service: IEcrsService) {
        super();
    }

    public async getContractorData(req: Request, res: Response, next: NextFunction): Promise<void> {

        try {
            const contractorNo = req.query.contractorNo;
            if (!contractorNo) {
                throw new HttpException(500, "Mising contractorNo");
            }
            const resData = await this.service.getContractorData(req.user!, contractorNo as string);
            setSuccessResponse(resData, res);

        } catch (error) {
            logger.error(error);
            setErrorResponse(res, error);
        }
    }

    public async uploadContractorList(req: Request, res: Response, next: NextFunction): Promise<void> {

        try {
            const userId = req.query.userId;
            if (!userId) {
                throw new HttpException(500, "Mising userId");
            }
            const resData = await this.service.uploadContractorList(req.user!, userId as string);
            setSuccessResponse(resData, res);
        } catch (error) {
            logger.error(error);
            setErrorResponse(res, error);
        }
    }

}