import express from 'express';
import { inject, injectable } from 'inversify';
import { jwtValidator } from '../authentication/jwt-validator';
import { AuthorisedRepController } from '../controllers/authorised-rep.controller';
import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { CustomRouter } from './interfaces/custom-router.interface';

@injectable()
export class AuthorisedRepRouter implements CustomRouter {
    public path = '/ar';
    public router = express.Router();

    constructor(  @inject(Symbols.IAuthorisedRepController) private controller: AuthorisedRepController) {
        this.initializeRoutes();
    }

    @loggable()
    private initializeRoutes(): void {
      this.router.get('/', [jwtValidator], this.controller.findReporterByRreOrEmail.bind(this.controller));
    }

}