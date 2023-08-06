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
import { fromISO_YYYYMMDD, fromLocal_MMddyyyy } from '../utils/datetime.util';
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
            logger.error(error);
            setErrorResponse(res, error);
        }
    }

    //Returns a PDF bytestream as a Base64 encodeded string
    @loggable(false, false)
    public async downloadEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        const appType: any = AppType.valueOf(req.query.appType);
        const emailImageId: any = req.query.imageId as string;
        try {
            if (!appType) {
                res.status(400).json({ message: "Your request was invalid. You must pass in an appType and imageId in the querystring." });
            } else {
                if (emailImageId) {
                    const base64ByteStream = await this.service.downloadEmail(req.user!, appType, emailImageId);
                    setSuccessResponse(base64ByteStream, res);
                } else {
                    res.status(400).json({ message: "Your request was invalid. You must pass in an appType and imageId in the querystring." });
                }
            }
        } catch (error) {
            logger.error(error);
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

                    if (appType !== AppType.GHPRP) {
                        (activity as EdiAccountActivity[]).forEach((actvty) => {
                            actvty.activityDt = actvty.activityDt ? fromISO_YYYYMMDD(actvty.activityDt) : '';
                        });
                    }
                    return setSuccessResponse(activity, res);
                } else if (accountInfo.actionInfo.actionGrantFullFunctions
                    || accountInfo.actionInfo.actionUnlockPin
                    || accountInfo.actionInfo.actionResetPin
                    || accountInfo.actionInfo.actionVetSubmitter
                    || accountInfo.actionInfo.actionRemoveSubmitter
                ) {
                    const updateResult = await this.service.submitAction(req.user!, appType, accountInfo);
                    return setSuccessResponse(updateResult, res);
                } else if (accountInfo.actionInfo.actionGoPaperlessParties) {
                    const partiesData = await this.service.fetchPartiesData<any>(req.user!, accountId)
                    return setSuccessResponse(partiesData, res)
                } else if (accountInfo.actionInfo.actionPaperlessEmails) {
                    const emailFrom = req.query.emailFrom as string;
                    const emailTo = req.query.emailTo as string;
                    if (!emailFrom || !emailTo) {
                        return setErrorResponse(res, "Bad Request", 400, "Your request was invalid. You must pass in emailFrom and emailTo params also as part of your request.");
                    }
                    const emailNotifications = await this.service.emailNotification<any>(req.user!, accountId,
                        fromLocal_MMddyyyy(emailFrom),
                        fromLocal_MMddyyyy(emailTo));
                    return setSuccessResponse(emailNotifications, res)
                }
            } else {
                return setErrorResponse(res, "Bad Request", 400, "Your request was invalid. You must pass in AppType param and valid Account info with selected action in request-body.");
            }
        } catch (error) {
            logger.error(error);
            return setErrorResponse(res, error);
        }

        return setErrorResponse(res, "Bad Request", 400, "Your request was invalid");

    }

    //Returns a PDF bytestream as a Base64 encodeded string
    @loggable(false, false)
    public async getVettedSubmitters(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const base64ByteStream = await this.service.getVettedSubmitters(req.user!);
            setSuccessResponse(base64ByteStream, res);
        } catch (error) {
            logger.error(error);
            setErrorResponse(res, error);
        }
    }

    @loggable(false, false)
    public async resetSubmitter(req: Request, res: Response, next: NextFunction): Promise<void> {
        const appType = AppType.valueOf(req.query.appType);
        const accountId = req.query.accountId;
        const segmentId: any = req.query.segmentId
        const userId: any = req.query.userId;
        const sbmtrId: any = req.query.sbmtrId;
        try {
            if (!appType) {
                res.status(400).json({ message: "Your request was invalid. You must pass in an appType and either accountId or ein or ssn in the querystring." });
            } else {
                if (accountId) {
                    const accountInfo = await this.service.resetSubmitter(req.user!, appType, Number(accountId), segmentId, userId, sbmtrId);
                    setSuccessResponse(accountInfo, res);
                } else {
                    res.status(400).json({ message: "Your request was invalid. You must pass in an appType and either accountId or ein or ssn in the querystring." });
                }
            }
        } catch (error) {
            logger.error(error);
            setErrorResponse(res, error);
        }
    }


}