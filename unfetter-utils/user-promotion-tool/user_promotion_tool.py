from pymongo import MongoClient
import argparse

parser = argparse.ArgumentParser(description='Use this script to change the Unfetter role of users')

parser.add_argument(
    '--host',
    dest='host',
    help='The host for MongoDB [default: localhost]',
    default='localhost')

parser.add_argument(
    '--port',
    dest='port',
    type=int,
    help='The port for MongoDB [default: 27018]',
    default=27018)

args = parser.parse_args()

MONGO_HOST = args.host
MONGO_PORT = args.port

UNFETTER_DATABASE = 'stix'
UNFETTER_USERS_COLLECTION = 'user'
UNFETTER_USER_ROLES = [
    'STANDARD_USER',
    'ORG_LEADER',
    'ADMIN'
]

if __name__ == '__main__':

    client = MongoClient(MONGO_HOST, MONGO_PORT)
    db = client[UNFETTER_DATABASE]
    users_collection = db[UNFETTER_USERS_COLLECTION]
    users_raw = users_collection.find({ 'registered': True })
    users = [user for user in users_raw]
    inp = 'y'
    first_go = True
    while inp == 'Y' or inp =='y':
        if first_go == False:
            inp = str(raw_input('Do you wish to edit another user? [y/n]: '))

        first_go = False

        if inp != 'Y' and inp !='y':
            break
        print '\n***************\n\nRegistered Users:\n\n\tIndex - User Name - User Role'
        for i in range(0, len(users)):
            print '\t' + str(i) + ' -- ' + users[i][u'userName'] + ' -- ' + users[i][u'role']

        print '\n***************\n'
        user_index = int(raw_input('Enter the index of the user you wish to edit: '))

        print 'Enter the index of the role you wish this user to be:\n\tIndex - User Role'
        for i in range(0, len(UNFETTER_USER_ROLES)):
            print '\t' + str(i) + ' -- ' + UNFETTER_USER_ROLES[i]

        role_index = int(raw_input('Choice: '))
        new_role = UNFETTER_USER_ROLES[role_index]

        users[user_index][u'role'] = new_role
        users[user_index][u'approved'] = True

        users_collection.update_one({'_id': users[user_index][u'_id']}, {'$set': users[user_index]})
        print users[user_index][u'userName'] + ' successully updated.'
