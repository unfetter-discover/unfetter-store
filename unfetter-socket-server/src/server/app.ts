import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';

import * as publishController from '../controllers/publish';

const app: any = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/publish', publishController);

// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next: any) => {
    let err = new Error('Not Found');
    res.status(404);
    console.log('catching 404 error');
    return next(err);
});

export default app;
