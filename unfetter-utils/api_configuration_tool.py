import os
import json
import getpass

# Schema
template = {
    "authServices": "github|gitlab",
    "github": {
        "clientID": "",
        "clientSecret": ""
    },
    "gitlab": {
        "gitlabURL": "https://gitlab.com",
        "clientID": "",
        "clientSecret": ""
    },
    "jwtSecret": "",
    "sessionSecret": "",
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

    if file_exists:
        print """Configuration file already exists:
            You may skip any entry to preserve the current setting by hitting [enter].\n"""

    at_least_one_service_configured = False
    services = []

    use_github = str(raw_input('Do you wish to set the application up for Github authentication? [y/n]: '))
    if use_github == 'y' or use_github == 'Y':

        services.append('github')

        # TODO we may one day want to allow pointing to private Github services.

        print """\nThis application will require a GitHub OAuth application to be created.
            \n\nIf one is not already created, please create one at:
            \n\thttps://github.com/settings/applications/new\n\n"""

        client_id = getpass.getpass('Please enter the GitHub application client ID: (hidden)')
        if not file_exists or client_id != '':
            private_config['github']['clientID'] = client_id

        client_secret = getpass.getpass('Please enter the GitHub application client secret: (hidden)')
        if not file_exists or client_secret != '':
            private_config['github']['clientSecret'] = client_secret

    try:
        if private_config['github']['clientID'] != '' and private_config['github']['clientSecret'] != '':
            at_least_one_service_configured = True
    except:
        # The github properties don't exist? Move on.

    use_gitlab = str(raw_input('Do you wish to set the application up for Gitlab authentication? [y/n]: '))
    if use_gitlab == 'y' or use_gitlab == 'Y':

        services.append('gitlab')

        gitlab_url = str(raw_input('Enter the URL of the Gitlab service [https://gitlab.com]: '))
        if file_exists and gitlab_url == '':
            gitlab_url = private_config['gitlab']['gitlabURL']
        if gitlab_url == '':
            gitlab_url = 'https://gitlab.com'
        private_config['gitlab']['gitlabURL'] = gitlab_url

        print """\nThis application will require a Gitlab OAuth application to be created.
            \n\nIf one is not already created, please create one at:
            \n\thttps://gitlab.com/profile/applications\n\n"""

        client_id = getpass.getpass('Please enter the GitHub application client ID: (hidden)')
        if not file_exists or client_id != '':
            private_config['gitlab']['clientID'] = client_id

        client_secret = getpass.getpass('Please enter the GitHub application client secret: (hidden)')
        if not file_exists or client_secret != '':
            private_config['gitlab']['clientSecret'] = client_secret

    try:
        if private_config['gitlab']['clientID'] != '' and private_config['gitlab']['clientSecret'] != '':
            at_least_one_service_configured = True
    except:
        # The gitlab properties don't exist? Move on.

    if not at_least_one_service_configured:
        print '\nYou need to define at least one authentication service.\n'
        raise SystemExit

    ui_domain = str(raw_input('Please enter the public domain that the Unfetter-UI is hosted on: '))
    if not file_exists or ui_domain != '':
        private_config['unfetterUiCallbackURL'] = template['unfetterUiCallbackURL'] % (ui_domain)

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
