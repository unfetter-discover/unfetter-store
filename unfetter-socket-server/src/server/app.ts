import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';

import * as publishController from '../controllers/publish';

const app: any = express();

// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/publish', publishController);

app.get('/', (req: express.Request, res: express.Response) => {
    res.json({'message': 'Successful reached base route'});
});

// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next: any) => {
    let err = new Error('Not Found');
    console.log('catching 404 error');
    // console.log(req.url);
    return res.status(404).json({'error': '404 not found'});
    // res.status(404);
    // return next(err);
});

export default app;
