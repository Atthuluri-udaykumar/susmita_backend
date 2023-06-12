import express from 'express';
import { body } from 'express-validator';
import { inject, injectable } from 'inversify';
import { jwtValidator } from '../authentication/jwt-validator';
import { PersonInfoController } from '../controllers/person-info.controller';
import { loggable } from '../utils/logger.util';
import { Symbols } from '../utils/types';
import { CustomRouter } from './interfaces/custom-router.interface';
import { PersonInfo } from '../models/person-info.model';

@injectable()
export class PersonInfoRouter implements CustomRouter {
  public path = '/person';
  public router = express.Router();

  constructor(  @inject(Symbols.IPersonInfoController) private controller: PersonInfoController) {
      this.initializeRoutes();
  }

  @loggable()
  private initializeRoutes(): void {
    this.router.get('/', [jwtValidator], this.controller.findPersonByLoginOrEmail.bind(this.controller));
    this.router.post('/', [jwtValidator], this.controller.updatePerson.bind(this.controller));
  }

}
