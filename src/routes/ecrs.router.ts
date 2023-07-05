import express from 'express';
import { inject, injectable } from 'inversify';
import { jwtValidator } from '../authentication/jwt-validator';
import { EcrsController } from '../controllers/ecrs.controller';

import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { CustomRouter } from './interfaces/custom-router.interface';
import { param } from 'express-validator';

@injectable()
export class EcrsRouter implements CustomRouter {
    public path = '/ecrs';
    public router = express.Router();

    constructor(@inject(Symbols.IEcrsController) private controller: EcrsController) {
        this.initializeRoutes();
    }

    @loggable()
    private initializeRoutes(): void {
        
        this.router.get('/contractorData',
            [jwtValidator, param("contractorNo").isAlphanumeric()], this.controller.getContractorData.bind(this.controller));
    }

}