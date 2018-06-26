from pymongo import MongoClient

# ~~~ Adjust these variables as needed ~~~

MONGO_HOST = 'localhost'
MONGO_PORT = 27018 # This assumes Unfetter's docker-compose.development.yml port mapping
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
    users_raw = users_collection.find({})
    users = [user for user in users_raw]
    print users[0]

    print '\n***************\n\nRegistered Users:\n\n\tIndex - User Name - User Role'
    for i in range(0, len(users)):
        if 'github' in users[i]:
            uacKey = u'github'
        else:
            uacKey = u'gitlab'
        print '\t' + str(i) + ' -- ' + users[i][uacKey][u'userName'] + ' -- ' + users[i][u'role']

    print '\n***************\n'

    inp = 'y'
    first_go = True
    while inp == 'Y' or inp =='y':
        if first_go == False:
            inp = str(raw_input('Do you wish to edit another user? [y/n]: '))

        first_go = False

        if inp != 'Y' and inp !='y':
            break

        user_index = int(raw_input('Enter the index of the user you wish to edit: '))

        print 'Enter the index of the role you wish this user to be:\n\tIndex - User Role'
        for i in range(0, len(UNFETTER_USER_ROLES)):
            print '\t' + str(i) + ' -- ' + UNFETTER_USER_ROLES[i]

        role_index = int(raw_input('Choice: '))
        new_role = UNFETTER_USER_ROLES[role_index]

        users[user_index][u'role'] = new_role
        users[user_index][u'approved'] = True

        users_collection.update_one({'_id': users[user_index][u'_id']}, {'$set': users[user_index]})
        if 'github' in users[user_index]:
            uacKey = u'github'
        else:
            uacKey = u'gitlab'
        print users[user_index][uacKey][u'userName'] + ' successully updated.'
