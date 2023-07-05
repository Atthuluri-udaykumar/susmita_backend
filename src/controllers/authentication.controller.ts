
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { authenticateJwtToken } from '../authentication/jwt-validator';

import { IAuthenticationService } from '../services/interfaces/authentication-service.interface';
import { logger } from '../utils/winston.config'; 
import { setErrorResponse, setSuccessResponse } from '../utils/ediresponse.util';
import { createTokens, createTokensForUser } from '../utils/jwt.util';
import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { AbstractController } from './abstract-controller';
import { IAuthenticationController } from './interfaces/authentication-controller.interface';
import { ServiceResponse } from '../models/serviceresponse.model';
import { ISessionService } from '../services/interfaces/session-service.interface';
import { EdiSession } from '../models/edi-session.model';
import { setCurrentUser } from '../middleware/current-user';

/**
 * AuthenticationController Controller
 */
@injectable()
export class AuthenticationController extends AbstractController implements IAuthenticationController {

    constructor(@inject(Symbols.IAuthenticationService)  private service: IAuthenticationService,
        @inject(Symbols.ISessionService)  private sessionService: ISessionService) {
        super();
    }
    
    @loggable(false, false)
    public async login( req: Request, res: Response, next: NextFunction): Promise<void>{
        
        try {
            // authenticate the user, then return the jwt
            const user = await this.service.authenticateUser(req.body.username, req.body.password);
            const reply = createTokensForUser( user);
            this.prepareUserSession(reply);
            return setSuccessResponse( reply, res);
            
        } catch (error) {
            logger.error(error);
            if( error instanceof ServiceResponse ) {
                return setErrorResponse(res, error.errors, error.status, error.result);
            }
            return setErrorResponse(res, error);
        }
    }

    public async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        // if we get here, the request has a valid token and the User object should be set for us to use. 
        // But we are going to decode the payload to validate ourselves
        try {
            const payload = authenticateJwtToken(req, 'refresh');
            logger.debug(payload.user.personId);
            return setSuccessResponse( createTokens( payload.user), res);
        } catch (err) {
            logger.error( err);
            if( err instanceof ServiceResponse ) {
                return setErrorResponse(res, err.errors, err.status, err.result);
            }
             return setErrorResponse(res, err);
        }
    }


    public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            return setSuccessResponse("logout success", res);
        } catch (error) {
            logger.error( error);
            return setErrorResponse(res, error);
        }
    }

    public async prepareUserSession( reply : any) {
        let session: EdiSession = new EdiSession();
        setCurrentUser(reply.user.userName);
        session.refreshToken = reply.refreshToken;
        session.role = this.getUserRole(reply)
        await this.sessionService.updateSession(session);
    }

    getUserRole(reply: any): number {
        const memberOf: string[] = reply.user.memberOf ??= [];
        memberOf.forEach((element) => {
            if( element.toString().toLowerCase().search("dc=bbadmin")>=0) {
                return 1;
            }
        });
        return 0;
    
    }
}

