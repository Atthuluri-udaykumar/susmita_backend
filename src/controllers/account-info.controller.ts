import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { setErrorResponse, setSuccessResponse } from '../utils/ediresponse.util';
import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { AbstractController } from './abstract-controller';
import { logger } from '../utils/winston.config';
import { IAccountInfoService } from '../services/interfaces/account-info-service.interface';
import { AccountInfo } from '../models/account-info.model';
import { EdiAccountActivity, GhprpAccountActivity } from '../models/account-activity.model';
import { AppType } from '../models/apptypes.model';
import { toDate } from '../utils/datetime.util';
/**
 * Account Info Controller
 */
@injectable()
export class AccountInfoController extends AbstractController {
    constructor(@inject(Symbols.IAccountInfoService) private service: IAccountInfoService) {
        super();
    }

    /**
     * Retrieves Submitter's details by either submitterId, ein or ssn
     * @param req, res
     * @return exists response's code status and body
     */
    @loggable(false, false)
    public async findAccountByEinAccountIdSsn(req: Request, res: Response, next: NextFunction): Promise<void> {
        const appType = AppType.valueOf(req.query.appType); 
        const accountId = req.query.accountId;
        const ein = req.query.ein;
        const ssn = req.query.ssn;

        try {
            if (!appType) {
                res.status(400).json({ message: "Your request was invalid. You must pass in an appType and either accountId or ein or ssn in the querystring." });
            } else {
                if (accountId) {
                    const accountInfo = await this.service.findAccountByAccountId(req.user!, appType, Number(accountId));
                    setSuccessResponse(accountInfo, res);
                } else if (ein) {
                    const accountInfo = await this.service.findAccountByEIN(req.user!, appType, Number(ein));
                    setSuccessResponse(accountInfo, res);
                } else if (ssn) {
                    const accountInfo = await this.service.findAccountBySSN(req.user!, appType, Number(ssn));
                    setSuccessResponse(accountInfo, res);
                } else {
                    res.status(400).json({ message: "Your request was invalid. You must pass in an appType and either accountId or ein or ssn in the querystring." });
                }
            }
        } catch (error) {
            logger.error( error);
            setErrorResponse(res, error);
        }
    }

    /**
     * Takes a spefic action for the submitted account
     * @param req, res
     * @return exists response's code status and body
     */
  @loggable(false, false)
    public async submitAction(req: Request, res: Response, next: NextFunction): Promise<void> {

        try {
            this.validateReceivedData(req);

            const appType = AppType.valueOf(req.query.appType);
            const accountInfo = req.body as AccountInfo;
            
            if (appType && accountInfo?.actionInfo) {
                const accountId = accountInfo.contactInfo.accountId;

                if (accountInfo.actionInfo.actionViewAccountActvity) {
                    const activity = (appType == AppType.GHPRP) ? 
                                     await this.service.fetchAccountActivity<GhprpAccountActivity>(req.user!, appType, accountId)
                                     : await this.service.fetchAccountActivity<EdiAccountActivity>(req.user!, appType, accountId);
                    
                    if(appType !== AppType.GHPRP){
                        (activity as EdiAccountActivity[]).forEach((actvty) => {
                            actvty.activityDt = actvty.activityDt? toDate(actvty.activityDt): '';
                        });
                    }                                     
                    setSuccessResponse(activity, res);
                } else if (accountInfo.actionInfo.actionGrantFullFunctions 
                            || accountInfo.actionInfo.actionUnlockPin
                            || accountInfo.actionInfo.actionResetPin
                ) {
                    const updateResult =  await this.service.submitAction(req.user!, appType, accountInfo); 
                    setSuccessResponse(updateResult, res);
                } else if (accountInfo.actionInfo.actionGoPaperlessParties) {
                    const partiesData = await this.service.fetchPartiesData<any>(req.user!, accountId)
                    setSuccessResponse(partiesData, res)
                }
            } else {
                res.status(400).json({ message: "Your request was invalid. You must pass in AppType param and valid Account info with selected action in request-body." });
            }
        } catch (error) {
            logger.error(error);
            setErrorResponse(res, error);
        }
    }    

}