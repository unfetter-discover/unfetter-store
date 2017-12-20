import { Connection } from './connection';

export const connections: Connection[] = [];

export const findConnections = (query: (connection: Connection) => boolean): Connection[] => {
    return connections.filter(query);
};

export const findConnectionsByUserId = (userId: string): Connection[] => {
    return findConnections((connection) => connection.user._id.toString() === userId.toString())
}
