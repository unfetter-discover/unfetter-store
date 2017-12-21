import os
import json
import getpass

# Schema
template = {
    "github": {
        "clientID": "",
        "clientSecret": "",
        "callbackURL": "https://%s/api/auth/github-callback"
    },
    "sessionSecret": "",
    "jwtSecret": "",
    "unfetterUiCallbackURL": "https://%s/#/users/login-callback"
}

if __name__ == '__main__':

    inp_file = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                            '../unfetter-discover-api/api/config/private-config.json')
    
    socket_server_config = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                            '../unfetter-socket-server/config/private-config.json')

    file_exists = False

    if os.path.isfile(inp_file):
        file_contents = open(inp_file, 'r')
        private_config = json.loads(file_contents.read())
        file_contents.close()
        file_exists = True
    else:
        private_config = template

    print """\nThis application will require a GitHub OAuth application to be created.\n\nIf one is not already created, please create one at:
        \n\thttps://github.com/settings/applications/new\n\n"""

    if file_exists:
        print 'Configuration file already exists: You may skip any entry to preserve the current setting by hitting [enter].\n'

    api_domain = str(raw_input('Please enter the public domain that the Unfetter-Discover-API is hosted on: '))
    if not file_exists or api_domain != '':
        private_config['github']['callbackURL'] = template['github']['callbackURL'] % (api_domain)

    ui_domain = str(raw_input('Please enter the public domain that the Unfetter-UI is hosted on: '))
    if not file_exists or ui_domain != '':
        private_config['unfetterUiCallbackURL'] = template['unfetterUiCallbackURL'] % (ui_domain)

    client_id = getpass.getpass('Please enter the GitHub application client ID: (hidden)')
    if not file_exists or client_id != '':
        private_config['github']['clientID'] = client_id

    client_secret = getpass.getpass('Please enter the GitHub application client secret: (hidden)')
    if not file_exists or client_secret != '':
        private_config['github']['clientSecret'] = client_secret

    session_secret = getpass.getpass('Please enter a unique password that the Unfetter-Discover-API will use to encrypt session variables: (hidden)')
    if not file_exists or session_secret != '':
        private_config['sessionSecret'] = session_secret

    jwt_secret = getpass.getpass('Please enter a unique password that the Unfetter-Discover-API and Unfetter-Socket-Server will use to encrypt JSON Web Tokens: (hidden)')
    if not file_exists or jwt_secret != '':
        private_config['jwtSecret'] = jwt_secret

    print '\nAll fields successfully entered.'

    write_to_file = str(raw_input('Do you wish for the configuration to be saved to file? [y/n]: '))

    if write_to_file == 'y' or write_to_file == 'Y':
        try:
            out_file = open(inp_file, 'w')
            json.dump(private_config, out_file)
            print 'Configuration successfully written to ' + inp_file
            socket_out_file = open (socket_server_config, 'w')
            json.dump(private_config, socket_out_file)
            print 'Configuration successfully written to ' + socket_server_config
        except:
            print 'Unable to write configuration to file'

    else:
        print 'Exiting program without writing configurations to file.'
