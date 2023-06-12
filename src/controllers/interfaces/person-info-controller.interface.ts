import { NextFunction, Request, Response } from 'express';

export interface IPersonInfoController {

	findPersonByLoginOrEmail(req: Request, res: Response, next: NextFunction): any;
	updatePerson(req: Request, res: Response, next: NextFunction): any;
}
