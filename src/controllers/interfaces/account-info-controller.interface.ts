import { NextFunction, Request, Response } from 'express';

export interface IAccountInfoController {

	findAccountByEinAccountIdSsn(req: Request, res: Response, next: NextFunction): any;
	submitAction(req: Request, res: Response, next: NextFunction): any;
}