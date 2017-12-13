import { Router, Response, Request, NextFunction } from 'express';

import io from '../server/server';
import { connections, findConnectionsByUserId } from '../models/connections';
import { AppNotification, CreateAppNotification } from '../models/notification';
import { WSMessageTypes } from '../models/messages';
import { Connection } from '../models/connection';
import { CreateJsonApiError, CreateJsonApiSuccess } from '../models/jsonapi';
import { isDefinedJsonApi } from '../controllers/shared/isdefined';

let router: any = Router();

interface UserNotification {
    userId: any;
    notification: AppNotification;
}

// Notification for a single user
router.post('/notification/user', (req: Request, res: Response) => {
    if (isDefinedJsonApi(req, ['userId'], ['notification'])) {
        const { userId, notification }: UserNotification = req.body.data.attributes;
        notification.submitted = notification.submitted || new Date();

        const appNotification = new CreateAppNotification(WSMessageTypes.NOTIFICATION, notification);
        const userSessions = findConnectionsByUserId(userId);

        if (userSessions && userSessions.length) {
            // In case the same user has multiple session objects
            userSessions.forEach((connection: Connection) => {
                connection.client.send(appNotification);
            });
            return res.json(new CreateJsonApiSuccess({'success': true}));
        } else {
            console.log('Unable to find session for', userId);
            return res.status(404).json(new CreateJsonApiError('404', req.url, 'Unable to find user socket'));
        }            
    } else {
        console.log('Malformed request to', req.url);
        return res.status(400).json(new CreateJsonApiError('400', req.url, 'Malformed request'));
    }
});

// Notification for all users in an organization
// router.post('/notification/organization', (req: Request, res: Response) => {
// });

// Notification for organization leaders
// Note - Send to all admins and all org leaders of X org
// router.post('/notification/orgleaders', (req: Request, res: Response) => {
// });

// Notification for admins
// Note - Use rooms or namespaces for this?
// router.post('/notification/admin', (req: Request, res: Response) => {
// });

export = router;
