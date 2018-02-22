import { Db, MongoClient, MongoError } from 'mongodb';
import { CollectionType } from './collection-type.enum';

export class MongoConnectionService {

    /**
     * @description attempt a mongo connect, wait some time, return the mongo collection
     * @return {Promise<any>} a collection
     */
    public static async connect(): Promise<any> {
        const mongoConnect = () => {
            MongoClient.connect(MongoConnectionService.mongoUrl, (err: MongoError, db: Db) => {
                if (err) {
                    console.log(err);
                    return;
                }

                console.log('Connected to ', MongoConnectionService.mongoUrl);
                MongoConnectionService.db = db;
                const dataCollection = db.collection(MongoConnectionService.monogCollectionName);
                MongoConnectionService.dataCollection = dataCollection;
                const configCollection = db.collection(MongoConnectionService.mongoConfigCollectionName);
                MongoConnectionService.configCollection = configCollection;
            });
        };

        console.log(`attempting to connect to ${MongoConnectionService.mongoUrl}`);
        const p = new Promise(async (resolve, reject) => {
            MongoConnectionService.connecting = true;
            mongoConnect();
            const wait = setTimeout(() => {
                clearTimeout(wait);
                MongoConnectionService.connecting = false;
                resolve(MongoConnectionService.dataCollection);
            }, MongoConnectionService.waitTime);
        });
        return p;
    }

    /**
     * @description make sure we have a collection object to work with
     */
    public static async ensureConnection(): Promise<any> {
        if (!MongoConnectionService.dataCollection && MongoConnectionService.connecting === false) {
            await MongoConnectionService.connect();
        }

        return Promise.resolve(MongoConnectionService.dataCollection);
    }

    /**
     * @description
     * @return {Promise<any>} collection
     */
    public static async getCollection(name: CollectionType = CollectionType.DATA): Promise<any> {
        await MongoConnectionService.ensureConnection();

        let collection;
        if (name === CollectionType.DATA) {
            collection = MongoConnectionService.dataCollection;
        } else {
            collection = MongoConnectionService.configCollection;
        }

        return Promise.resolve(collection);
    }

    public static closeConnection(): void {
        MongoConnectionService.db.close();
    }

    protected static db: Db;
    protected static dataCollection: any;
    protected static configCollection: any;
    protected static connecting = false;
    protected static readonly mongoRepo = process.env.MONGO_REPOSITORY || 'localhost';
    protected static readonly mongoPort = process.env.MONGO_PORT || 27018;
    protected static readonly mongoDbName = process.env.MONGO_DBNAME || 'stix';
    protected static readonly monogCollectionName = process.env.MONGO_COLLECTION_NAME || 'stix';
    protected static readonly mongoConfigCollectionName = process.env.MONGO_CONFIG_COLLECTION_NAME || 'config';
    // tslint:disable-next-line:max-line-length
    protected static readonly mongoUrl = `mongodb://${process.env.MONGO_USER != null && process.env.MONGO_PASSWORD != null ? `${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@` : ''}${MongoConnectionService.mongoRepo}:${MongoConnectionService.mongoPort}/${MongoConnectionService.mongoDbName}`;
    protected static readonly waitTime = 600;
}
