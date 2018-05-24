import os
import re
import sys
import json
import getpass
import fileinput

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
        print ("\nConfiguration file already exists: "
               "You may skip any entry to preserve the current setting by hitting [enter].\n")

    at_least_one_service_configured = False
    services = []

    use_github = str(raw_input(
        '\nDo you wish to set the application up for Github authentication? [y/n]: ')).strip().lower()
    if use_github == 'y':

        services.append('github')

        # TODO we may one day want to allow pointing to private Github services.

        print ("\nThis application will require a GitHub OAuth application to be created."
               "\n\nIf one is not already created, please create one at:"
               "\n\thttps://github.com/settings/applications/new\n")

        client_id = getpass.getpass('Please enter the GitHub application client ID: (hidden)').strip()
        if not file_exists or client_id != '':
            private_config['github']['clientID'] = client_id

        client_secret = getpass.getpass('Please enter the GitHub application client secret: (hidden)').strip()
        if not file_exists or client_secret != '':
            private_config['github']['clientSecret'] = client_secret

        try:
            if private_config['github']['clientID'] != '' and private_config['github']['clientSecret'] != '':
                at_least_one_service_configured = True
            else:
                raise ValueError
        except:
            # The github properties don't exist? Move on.
            print ("\nYou did not finish entering github information. "
                   "We'll continue, but you should probably CTRL-C and start over...?\n")

    use_gitlab = str(raw_input(
        '\nDo you wish to set the application up for Gitlab authentication? [y/n]: ')).strip().lower()
    if use_gitlab == 'y':

        services.append('gitlab')

        gitlab_url = str(raw_input('\nEnter the URL of the Gitlab service [https://gitlab.com]: ')).strip()
        if file_exists and gitlab_url == '':
            gitlab_url = private_config['gitlab']['gitlabURL']
        if gitlab_url == '':
            gitlab_url = 'https://gitlab.com'
        private_config['gitlab']['gitlabURL'] = gitlab_url

        print ("\nThis application will require a Gitlab OAuth application to be created."
               "\n\nIf one is not already created, please create one at:"
               "\n\thttps://gitlab.com/profile/applications\n\n")

        client_id = getpass.getpass('Please enter the GitHub application client ID: (hidden)').strip()
        if not file_exists or client_id != '':
            private_config['gitlab']['clientID'] = client_id

        client_secret = getpass.getpass('Please enter the GitHub application client secret: (hidden)').strip()
        if not file_exists or client_secret != '':
            private_config['gitlab']['clientSecret'] = client_secret

        try:
            if private_config['gitlab']['clientID'] != '' and private_config['gitlab']['clientSecret'] != '':
                at_least_one_service_configured = True
            else:
                raise ValueError
        except:
            # The gitlab properties don't exist? Move on.
            print ("\nYou did not finish entering gitlab information. "
                   "We'll continue, but you should probably CTRL-C and start over...?\n")

    if not at_least_one_service_configured:
        print '\nYou need to define at least one authentication service.\n'
        raise SystemExit
    print "services array is"
    print "|".join(services)

    ui_domain = str(raw_input('Please enter the public domain that the Unfetter-UI is hosted on: ')).strip()
    if not file_exists or ui_domain != '':
        private_config['unfetterUiCallbackURL'] = template['unfetterUiCallbackURL'] % (ui_domain)

    session_secret = getpass.getpass('Please enter a unique password that '
        'the Unfetter-Discover-API will use to encrypt session variables: (hidden)').strip()
    if not file_exists or session_secret != '':
        private_config['sessionSecret'] = session_secret

    jwt_secret = getpass.getpass('Please enter a unique password that '
        'the Unfetter-Discover-API and Unfetter-Socket-Server will use to encrypt JSON Web Tokens: (hidden)').strip()
    if not file_exists or jwt_secret != '':
        private_config['jwtSecret'] = jwt_secret

    print '\nAll fields successfully entered.'

    write_to_file = str(raw_input('\nDo you wish for the configuration to be saved to file? [y/n]: ')).strip().lower()

    if write_to_file == 'y':
        try:
            private_config["authServices"] = services

            out_file = open(inp_file, 'w')
            json.dump(private_config, out_file, indent=4)
            out_file.close()
            print '\nConfiguration successfully written to ' + inp_file
            socket_out_file = open (socket_server_config, 'w')
            json.dump(private_config, socket_out_file, indent=4)
            socket_out_file.close()
            print '\nConfiguration successfully written to ' + socket_server_config

            write_to_ui = str(raw_input('\nDo you wish to update the unfetter-ui environment file? [y/n]: '))
            if (write_to_ui == 'y'):
                ui_path = str(raw_input('\nPlease enter the path to the unfetter-ui directory'
                    '[../../unfetter-ui]: ')).strip()
                if ui_path == '':
                    ui_path = '../../unfetter-ui'
                env_uac_file = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                            ui_path + '/src/environments/environment.uac.ts')
                try:
                    if os.path.isfile(env_uac_file):
                        env_file = open(env_uac_file, 'r')
                        env_contents =  env_file.read().replace('\n', '')
                        env_file.close()
                        print "env file contents are ", env_contents
                        m = re.match(r'^\s*(.*)\s*=\s*(\{.*\}).*$', env_contents)
                        if m == None:
                            print """\nCould not parse the environment file! Be sure to create it with this line:
                                    authServices: '{}'\n""".format(json.dumps(services))
                        else:
                            env = m.group(2)
                            print "env object is", env
                            env = ''.join(env.split())
                            print "compressed is", env
                            env = re.sub(r'([a-zA-Z_0-9]+):', r'"\1":', env).replace("'", '"')
                            print "formatted is", env
                            env = json.loads(env)
                            print "parsed is ", env
                            env["authServices"] = services
                            socket_out_file = open (socket_server_config, 'w')
                            env_file = open(env_uac_file, 'w')
                            env_file.write(m.group(1) + " = " + json.dumps(env, indent=4) + ";\n")
                            env_file.close()
                            print '\nConfiguration successfully written to ' + env_uac_file
                    else:
                        print """\nCould not find the environment file! Be sure to update it with this line:
                                authServices: '{}'\n""".format(json.dumps(services))
                except:
                    print 'error working with env file', sys.exc_info()

        except:
            print 'Unable to write configuration to file'

    else:
        print 'Exiting program without writing configurations to file.'
