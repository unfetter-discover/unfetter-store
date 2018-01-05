import { } from 'jasmine';
import { Request } from 'express';

import { connections, findConnections, findConnectionsByUserId } from './connections';
import { Connection } from './connection';

describe('connections', () => {

    const mockConnections: Connection[] = [
        {
            user: {
                _id: 'abc',
                organization: 'acme'
            },
            token: '123',
            client: null,
            connected: null
        },
        {
            user: {
                _id: 'def',
                organization: 'acme'
            },
            token: '456',
            client: null,
            connected: null
        },
        {
            user: {
                _id: 'ghi',
                organization: 'somethingelse'
            },
            token: '789',
            client: null,
            connected: null
        }
    ];

    mockConnections.forEach((conn: Connection) => connections.push(conn));

    it('should find a user by id', () => {
        expect(findConnectionsByUserId('abc').length).toBe(1);
    });

    it('should 2 users by organization', () => {
        expect(findConnections((connection: Connection) => connection.user.organization === 'acme').length).toBe(2);
    });
});
