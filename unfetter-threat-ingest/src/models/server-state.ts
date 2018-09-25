import { Server } from 'https';
import { Connection } from 'mongoose';
import { BehaviorSubject } from 'rxjs';
import * as yargs from 'yargs';

export type RefreshFunction = (state: DaemonState, options?: yargs.Arguments) => void;

export enum StatusEnum {
    UNINITIALIZED = 'Uninitialized',
    INITIALIZING = 'Initializing',
    RUNNING = 'Running',
    STOPPING = 'Stopping',
    SHUTDOWN = 'Shutdown',
}

export class PromisedService<T> {
    constructor(
        public readonly response: string,
        public readonly service: T,
    ) {
    }
}

export interface FeedSource {
    name: string;
    source: string | {
        protocol: string;
        host: string;
        port: number;
        path: string;
    };
    parser: any;
    active?: boolean;
}

export interface DaemonConfiguration {
    [key: string]: any;
    feedSources?: FeedSource[];
    debug?: boolean;
}

export class DaemonState {

    public configuration: DaemonConfiguration = {};

    public readonly db: {
        conn?: Connection;
        refresh: RefreshFunction;
        refreshTimer?: NodeJS.Timer;
        status: BehaviorSubject<StatusEnum>;
    } = {
        refresh: () => {},
        status: new BehaviorSubject(StatusEnum.UNINITIALIZED)
    };

    public readonly rest: {
        server?: Server;
        refresh: RefreshFunction;
        status: BehaviorSubject<StatusEnum>;
    } = {
        refresh: () => {},
        status: new BehaviorSubject(StatusEnum.UNINITIALIZED)
    };

    public readonly processor: {
        pollTimer?: NodeJS.Timer;
        refresh: RefreshFunction;
        status: BehaviorSubject<StatusEnum>;
    } = {
        refresh: () => {},
        status: new BehaviorSubject(StatusEnum.UNINITIALIZED)
    };

    public status: StatusEnum = StatusEnum.UNINITIALIZED;

    public toString(): string {
        return JSON.stringify(this, (key, value) => {
            if (value instanceof BehaviorSubject) {
                return value.getValue();
            } else if (value instanceof Connection) {
                return '(Mongo connection)';
            } else if (value instanceof Server) {
                return '(HTTPS Server)';
            } else if (/Timer$/.test(key)) {
                return `${value._idleTimeout}ms`;
            } else {
                return value;
            }
        });
    }

};
