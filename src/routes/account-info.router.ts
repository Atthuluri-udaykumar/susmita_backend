import express from 'express';
import { inject, injectable } from 'inversify';
import { jwtValidator } from '../authentication/jwt-validator';
import { AccountInfoController } from '../controllers/account-info.controller';
import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { CustomRouter } from './interfaces/custom-router.interface';
import { param } from 'express-validator';

@injectable()
export class AccountInfoRouter implements CustomRouter {
    public path = '/account';
    public router = express.Router();

    constructor(@inject(Symbols.IAccountInfoController) private controller: AccountInfoController) {
        this.initializeRoutes();
    }

    @loggable()
    private initializeRoutes(): void {
        this.router.get('/email',
                    [jwtValidator], 
                    this.controller.downloadEmail.bind(this.controller));

        this.router.get('/', 
                    [jwtValidator, param('accountId').isNumeric(), param('ein').isNumeric(), param('ssn').isNumeric()], 
                    this.controller.findAccountByEinAccountIdSsn.bind(this.controller));

        this.router.post('/', 
                    [jwtValidator], this.controller.submitAction.bind(this.controller));  

    }

}