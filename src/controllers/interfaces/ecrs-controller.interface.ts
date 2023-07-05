import { NextFunction, Request, Response } from 'express';

export interface IEcrsController {

	getContractorData(req: Request, res: Response, next: NextFunction): any;
	uploadContractorList(req: Request, res: Response, next: NextFunction): any;

}