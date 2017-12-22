import { Router, Response, Request, NextFunction } from 'express';

import io from '../server/server';
import { connections, findConnectionsByUserId } from '../models/connections';
import { AppNotification, CreateAppNotification } from '../models/notification';
import { WSMessageTypes } from '../models/messages';
import { Connection } from '../models/connection';
import { CreateJsonApiError, CreateJsonApiSuccess } from '../models/jsonapi';
import { isDefinedJsonApi } from '../controllers/shared/isdefined';
import notificationStoreModel from '../models/mongoose/notification-store';

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

        const notificationDoc = new notificationStoreModel({
            userId,
            messageType: WSMessageTypes.NOTIFICATION,
            messageContent: notification
        });       
        
        const errors = notificationDoc.validateSync();
        if (errors) {
            console.log(errors);
            return res.status(500).json(new CreateJsonApiError('500', req.url, 'Unable to save notification in notification store', errors));
        } else {
            notification._id = notificationDoc._id;
            const appNotification = new CreateAppNotification(WSMessageTypes.NOTIFICATION, notification);
            const userSessions = findConnectionsByUserId(userId);

            if (userSessions && userSessions.length) {
                // In case the same user has multiple session objects
                userSessions.forEach((connection: Connection) => {
                    console.log('Sending message to: ', userId);
                    connection.client.send(appNotification);
                });
            } 
            notificationDoc.save((err: any) => {
                if (err) {
                    return res.status(500).json(new CreateJsonApiError('500', req.url, 'Unable to save notification in notification store', errors));
                } else {
                    return res.json(new CreateJsonApiSuccess({'message': 'Successfully saved in notification store'}));
                }
            });
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
