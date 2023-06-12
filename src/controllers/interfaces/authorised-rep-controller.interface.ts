import { NextFunction, Request, Response } from 'express';

export interface IAuthorisedRepController {

	findReporterByRreOrEmail(req: Request, res: Response, next: NextFunction): any;

}