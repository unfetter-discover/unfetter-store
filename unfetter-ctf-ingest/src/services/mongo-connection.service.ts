import { MongoClient } from 'mongodb';

export class MongoConnectionService {

    /**
     * @description attempt a mongo connect, wait some time, return the mongo collection
     * @return {Promise<any>} a collection
     */
    public static async connect(): Promise<any> {
        const mongoConnect = () => {
            MongoClient.connect(MongoConnectionService.mongoUrl, (err, db) => {
                if (err) {
                    console.log(err);
                    return;
                }

                console.log('Connected to ', MongoConnectionService.mongoUrl);
                MongoConnectionService.db = db;
                const collection = db.collection(MongoConnectionService.monogCollectionName);
                MongoConnectionService.collection = collection;
            });
        };

        console.log(`attempting to connect to ${MongoConnectionService.mongoUrl}`);
        const p = new Promise(async (resolve, reject) => {
            MongoConnectionService.connecting = true;
            mongoConnect();
            const wait = setTimeout(() => {
                clearTimeout(wait);
                MongoConnectionService.connecting = false;
                resolve(MongoConnectionService.collection);
            }, MongoConnectionService.waitTime);
        });
        return p;
    }

    /**
     * @description make sure we have a collection object to work with
     */
    public static async ensureConnection(): Promise<any> {
        // console.log(`collection is ${MongoConnectionService.collection}`);
        if (!MongoConnectionService.collection && MongoConnectionService.connecting === false) {
            const collection = await MongoConnectionService.connect();
            console.log('setting collection to ', collection);
            MongoConnectionService.collection = collection;
        }
        return Promise.resolve(MongoConnectionService.collection);
    }

    /**
     * @description
     * @return {Promise<any>} collection
     */
    public static async getCollection(): Promise<any> {
        return Promise.resolve(MongoConnectionService.ensureConnection());
    }

    public static closeConnection(): void {
        MongoConnectionService.db.close();
    }

    protected static db: any;
    protected static collection: any;
    protected static connecting = false;
    protected static readonly mongoRepo = process.env.MONGO_REPOSITORY || 'localhost';
    protected static readonly mongoPort = process.env.MONGO_PORT || 27018;
    protected static readonly mongoDbName = process.env.MONGO_DBNAME || 'stix';
    protected static readonly monogCollectionName = process.env.MONGO_COLLECTION_NAME || 'stix';
    // tslint:disable-next-line:max-line-length
    protected static readonly mongoUrl =
        `mongodb://${MongoConnectionService.mongoRepo}:${MongoConnectionService.mongoPort}/${MongoConnectionService.mongoDbName}`;
    protected static readonly waitTime = 600;
}
