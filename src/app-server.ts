/*
 * Created on 2022-11-29 ( Time 14:29:37 )
 * Generated by Telosys Tools Generator ( version 3.3.0 )
 */
import bodyParser from 'body-parser';
import express from 'express';
import { Server } from 'http';
import 'reflect-metadata';
import { AuthenticationRouter } from './routes/authentication.router';
import { AuthorisedRepRouter } from './routes/authorised-rep.router';
import { BulletinBoardRouter } from './routes/bulletinboard.router';
import { PersonInfoRouter } from './routes/person-info.router';
import { contextPath, serverPort, version } from './utils/app.config';
import container from './utils/inversify.config';
import { logger } from './utils/winston.config';
import { AccountInfoRouter } from './routes/account-info.router';
import { EcrsRouter } from './routes/ecrs.router';
import { RandomUtils } from './utils/random-util';
import { jwtDecodeUserName } from './authentication/jwt-validator';
import { setCurrentUser } from './middleware/current-user';
import { middleware } from 'express-http-context';
import { setTransactionId } from './middleware/transaction-id';
export class AppServer {
    public static readonly PORT: number = serverPort;
    public server!: Server;
    private app!: express.Application;
    private port!: string | number;

    private bulletinboardRouter!: BulletinBoardRouter;
    private authenticationRouter!: AuthenticationRouter;
    private personInfoRouter!: PersonInfoRouter;
    private authorisedRepRouter!: AuthorisedRepRouter;
    private accountInfoRouter!: AccountInfoRouter;
    private ecrsRouter!: EcrsRouter;
    
    constructor() {
        this.startup();
    }

    public getApp(): express.Application {
        return this.app;
    }

    public async shutdown(e?: Error) {
        let err = e;

        logger.info('Shutting down application');

        try {
            logger.info('Closing web server module');

            this.server.close();
        } catch (e1: any) {
            logger.error(e1);

            err = err || e1;
        }

        logger.info('Exiting process');

        if (err) {
            process.exit(1); // Non-zero failure code
        } else {
            process.exit(0);
        }
    }

    private startup() {
        logger.info('Starting application');
        this.initIoC();
        this.createApp();
        this.config();
        this.listen();
    }

    private createApp(): void {
        logger.info('Creating Server');
        this.app = express();
    }

    private config(): void {
        logger.info('Configuring Server');

        this.port = process.env.PORT ?? AppServer.PORT;

        // support application/json type post data
        this.app.use(bodyParser.json());

        this.app.use(middleware);

        this.app.use((req, res, next) => {
            const traceId = req.header("x-b3-traceid") ?? RandomUtils.generateTrasactionId();
            logger.info( "request started: "+ traceId);
            setTransactionId(traceId);
            next();
        });

        this.app.use((req, res, next) => {
            const currentUser = jwtDecodeUserName(req);
            setCurrentUser(currentUser);
            next();
        });

        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader(
                'Access-Control-Allow-Methods',
                'OPTIONS, GET, POST, PUT, PATCH, DELETE',
            );
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
            next();
        });

        this.app.get(contextPath + '/version', (req, res) => res.send(version));

    	this.app.use(contextPath + this.bulletinboardRouter.path, this.bulletinboardRouter.router);
    	this.app.use(contextPath + this.authenticationRouter.path, this.authenticationRouter.router);
        this.app.use(contextPath + this.personInfoRouter.path, this.personInfoRouter.router);
        this.app.use(contextPath + this.authorisedRepRouter.path, this.authorisedRepRouter.router);
        this.app.use(contextPath + this.accountInfoRouter.path, this.accountInfoRouter.router);
        this.app.use(contextPath + this.ecrsRouter.path, this.ecrsRouter.router);


        // defaul to  404 not found
        this.app.get("*", (req, res) => res.sendStatus(404));   

    }

    private listen(): void {
        this.server = this.app.listen(this.port, () => {
            logger.info('Running server on port ' + this.port);
        });
    }

    private initIoC(): void {
        logger.info('Resolving IoC Dependency Container');

		this.bulletinboardRouter = container.resolve<BulletinBoardRouter>(BulletinBoardRouter);
		this.authenticationRouter = container.resolve<AuthenticationRouter>(AuthenticationRouter);
        this.personInfoRouter = container.resolve<PersonInfoRouter>(PersonInfoRouter);
        this.authorisedRepRouter = container.resolve<AuthorisedRepRouter>(AuthorisedRepRouter);
        this.accountInfoRouter =  container.resolve<AccountInfoRouter>(AccountInfoRouter);
        this.ecrsRouter = container.resolve<EcrsRouter>(EcrsRouter);
    }
}
