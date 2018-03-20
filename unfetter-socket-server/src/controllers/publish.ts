import { Router, Response, Request, NextFunction } from 'express';

import { connections, findConnectionsByUserId } from '../models/connections';
import { AppNotification, CreateAppNotification } from '../models/notification';
import { WSMessageTypes } from '../models/messages';
import { Connection } from '../models/connection';
import { CreateJsonApiError, CreateJsonApiSuccess } from '../models/jsonapi';
import { isDefinedJsonApi } from '../controllers/shared/isdefined';
import notificationStoreModel from '../models/mongoose/notification-store';
import userModel from '../models/mongoose/user';
import { UserRoles } from '../models/user-roles.enum';
import { renderUserRegistered } from './shared/render-template';
import { sendMailAlert } from './shared/email-alert';
import { routeEmail } from './shared/route-email';

const SEND_EMAIL_ALERTS = process.env.SEND_EMAIL_ALERTS || false;

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

// Email alert only, to user
router.post('/email/user', (req: Request, res: Response) => {
    if (SEND_EMAIL_ALERTS && isDefinedJsonApi(req, ['userEmail'])) {
        routeEmail(req, [req.body.data.attributes.userEmail]);
        return res.json(new CreateJsonApiSuccess({ 'message': 'Successfully recieved email-user data' }));
    } else {
        return res.status(501).json(new CreateJsonApiError('501', req.url, 'SEND_EMAIL_ALERTS is turned off'));
    }
});

// Social for all users, eg comment, like etc
router.post('/social/all', (req: Request, res: Response) => {
    if (isDefinedJsonApi(req, ['notification'])) {
        const { userId, notification }: UserNotification = req.body.data.attributes;

        const appNotification = new CreateAppNotification(WSMessageTypes.SOCIAL, notification);

        connections.forEach((connection: Connection) => {
            connection.client.send(appNotification);
        });

        return res.json(new CreateJsonApiSuccess({ 'message': 'Successfully recieved social-all notification' }));
    } else {
        console.log('Malformed request to', req.url);
        return res.status(400).json(new CreateJsonApiError('400', req.url, 'Malformed request'));
    }
});

interface OrgNotification extends UserNotification {
    orgId: any;
}

// Notification for all users in an organization
router.post('/notification/organization', (req: Request, res: Response) => {
    if (isDefinedJsonApi(req, ['orgId'], ['notification'], ['userId'])) {
        const { orgId, userId, notification }: OrgNotification = req.body.data.attributes;
        notification.submitted = notification.submitted || new Date();

        // TODO don't include elements by user
        const orgMembersQuery = {
            'organizations': {
                $elemMatch: {
                    'id': orgId,
                    'approved': true,
                    'subscribed': true
                }
            },
            '_id': {
                $ne: Object(userId)
            }
        };

        userModel.find(orgMembersQuery, (err, userResults) => {
            if (err || !(userResults && userResults.length))  {
                return res.status(500).json(new CreateJsonApiError('500', req.url, 'Unable to find users belonging to the organization'));
            } else {
                const userIds = userResults
                    .map((user) => user.toObject())
                    .map((user: any) => user._id);

                const promises: any[] = [];
                
                userIds.forEach((userIdInner) => {
                    const notificationDoc = new notificationStoreModel({
                        userId: userIdInner,
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
                        const userSessions = findConnectionsByUserId(userIdInner);

                        if (userSessions && userSessions.length) {
                            // In case the same user has multiple session objects
                            userSessions.forEach((connection: Connection) => {
                                console.log('Sending message to: ', userIdInner);
                                connection.client.send(appNotification);
                            });
                        }
                        promises.push(notificationDoc.save());
                    }
                });

                Promise.all(promises)
                    .then((promiseResults: any) => {
                        return res.json(new CreateJsonApiSuccess({ 'message': 'Successfully saved organization notifications  in notification store' }));
                    })
                    .catch((promiseErr) => {
                        return res.status(500).json(new CreateJsonApiError('500', req.url, 'Unable to save organization notifications in notification store', promiseErr));
                    });
            }
        });
        
    } else {
        console.log('Malformed request to', req.url);
        return res.status(400).json(new CreateJsonApiError('400', req.url, 'Malformed request'));
    }
});

// Notification for admins
router.post('/notification/admin', (req: Request, res: Response) => {
    if (isDefinedJsonApi(req, ['notification'])) {
        const notification: AppNotification = req.body.data.attributes.notification;
        notification.submitted = notification.submitted || new Date();

        const appNotification = new CreateAppNotification(WSMessageTypes.NOTIFICATION, notification);

        userModel.find({ role: UserRoles.ADMIN}, (err, findAdminResults) => {
            if (err || !(findAdminResults || findAdminResults.length)) {
                return res.status(500).json(new CreateJsonApiError('500', req.url, 'Unable to find admins'));
            } else {
                const docsToInsert = findAdminResults
                    .map((adminUser: any) => adminUser.toObject())
                    .map((adminUser: any) => adminUser._id.toString())
                    .map((userId: string) => {
                        return {
                            userId,
                            ...appNotification
                        };
                    });
                notificationStoreModel.insertMany(docsToInsert, (insertError, notificationResults) => {
                    if (insertError) {
                        return res.status(500).json(new CreateJsonApiError('500', req.url, 'Unable to save notifications'));
                    } else {
                        const notificationResObjs = notificationResults.map((notificationRes) => notificationRes.toObject());
                        notificationResObjs.forEach((notificationResObj) => {
                            const userId = notificationResObj.userId;
                            const userSessions = findConnectionsByUserId(userId);
    
                            if (userSessions && userSessions.length) {
                                // In case the same user has multiple session objects
                                userSessions.forEach((connection: Connection) => {
                                    console.log('Sending message to: ', userId);
                                    connection.client.send({ 
                                        ...notificationResObj, 
                                        messageContent: { 
                                            ...notificationResObj.messageContent,
                                            _id: notificationResObj._id
                                        }
                                    });
                                });
                            }
                        });
                        
                        if (SEND_EMAIL_ALERTS) {
                            const adminEmails = findAdminResults
                                .map((adminUser: any) => adminUser.toObject())
                                .map((adminUser: any) => adminUser.email);
                            routeEmail(req, adminEmails);
                        }

                        return res.json(new CreateJsonApiSuccess({ 'message': 'Successfully recieved admin notification' }));
                    }
                });                
            }
        });

    } else {
        console.log('Malformed request to', req.url);
        return res.status(400).json(new CreateJsonApiError('400', req.url, 'Malformed request'));
    }
});

// Notification for organization leaders
// Note - Send to all admins and all org leaders of X org
// router.post('/notification/orgleaders', (req: Request, res: Response) => {
// });

export = router;
