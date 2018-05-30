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

def update_ui_env(env_file_path):
    if os.path.isfile(env_file_path):
        env_file = open(env_file_path, 'r')
        env_contents = env_file.read().replace('\n', '').replace("'", '"')
        env_file.close()
        m = re.match(
            r'^\s*(.*)\s*=\s*(\{.*\}).*$', env_contents)
        if m == None:
            print """\n\033[31mCould not parse the environment file! Be sure to create it with this line:
                    authServices: '{}'\033[0m\n""".format(json.dumps(services))
        else:
            env = m.group(2)
            env = ''.join(env.split())
            env = re.sub(r'([a-zA-Z_0-9]+):',
                            r'"\1":', env).replace("'", '"')
            env = json.loads(env)
            env["authServices"] = services
            dump = json.dumps(env, indent=4).replace('"', "'")
            env_file = open(env_file_path, 'w')
            env_file.write(m.group(1).strip() +
                            " = " + dump + ";\n")
            env_file.close()
            print '\n\033[32mConfiguration successfully written to ' + os.path.abspath(env_file_path)
    else:
        print """\n\033[31mCould not find the environment file! Be sure to update it with this line:
                authServices: '{}'\033[0m\n""".format(json.dumps(services))


if __name__ == '__main__':

    inp_file = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                            '../unfetter-discover-api/api/config/private-config.json')
    
    socket_server_config = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                            '../unfetter-socket-server/config/private-config.json')

    file_exists = False

    private_config = template.copy()
    if os.path.isfile(inp_file):
        file_contents = open(inp_file, 'r')
        file_json = json.loads(file_contents.read())
        private_config.update(file_json)
        file_contents.close()
        file_exists = True

    if file_exists:
        print ("\n\033[32mConfiguration file already exists: "
               "You may skip any entry to preserve the current setting by hitting [enter].\033[0m\n")

    at_least_one_service_configured = False
    services = []

    use_github = str(raw_input(
        '\nDo you wish to set the application up for Github authentication? [y/n]: ')).strip().lower()
    if use_github == 'y':

        services.append('github')

        # TODO we may one day want to allow pointing to private Github services.

        print ("\n\t\033[33mThis application will require a GitHub OAuth application to be created."
               "\n\n\tIf one is not already created, please create one at:"
               "\n\t\thttps://github.com/settings/applications/new\033[0m\n")

        client_id = getpass.getpass('\tPlease enter the GitHub application client ID: (hidden) ').strip()
        if not file_exists or client_id != '':
            private_config['github']['clientID'] = client_id

        client_secret = getpass.getpass('\n\tPlease enter the GitHub application client secret: (hidden) ').strip()
        if not file_exists or client_secret != '':
            private_config['github']['clientSecret'] = client_secret

        try:
            if private_config['github']['clientID'] != '' and private_config['github']['clientSecret'] != '':
                at_least_one_service_configured = True
            else:
                raise ValueError
        except:
            # The github properties don't exist? Move on.
            print ("\n\033[31mYou did not finish entering github information. "
                   "We'll continue, but you should probably CTRL-C and start over...?\n\033[0m")

    else:
        private_config.pop('github', None)

    use_gitlab = str(raw_input(
        '\nDo you wish to set the application up for Gitlab authentication? [y/n]: ')).strip().lower()
    if use_gitlab == 'y':

        services.append('gitlab')

        gitlab_url = str(raw_input(
            '\n\tEnter the URL of the Gitlab service [https://gitlab.com]: ')).strip()
        if file_exists and gitlab_url == '':
            gitlab_url = private_config['gitlab']['gitlabURL']
        if gitlab_url == '':
            gitlab_url = 'https://gitlab.com'
        private_config['gitlab']['gitlabURL'] = gitlab_url

        print ("\n\t\033[33mThis application will require a Gitlab OAuth application to be created."
               "\n\n\tIf one is not already created, please create one at:"
               "\n\t\t{}/profile/applications\033[0m\n".format(gitlab_url))

        client_id = getpass.getpass('\tPlease enter the Gitlab application client ID: (hidden) ').strip()
        if not file_exists or client_id != '':
            private_config['gitlab']['clientID'] = client_id

        client_secret = getpass.getpass('\n\tPlease enter the Gitlab application client secret: (hidden) ').strip()
        if not file_exists or client_secret != '':
            private_config['gitlab']['clientSecret'] = client_secret

        try:
            if private_config['gitlab']['clientID'] != '' and private_config['gitlab']['clientSecret'] != '':
                at_least_one_service_configured = True
            else:
                raise ValueError
        except:
            # The gitlab properties don't exist? Move on.
            print ("\n\033[31mYou did not finish entering gitlab information. "
                   "We'll continue, but you should probably CTRL-C and start over...?\033[0m\n")

    else:
        private_config.pop('gitlab', None)

    if not at_least_one_service_configured:
        print '\n\033[31mYou need to define at least one authentication service.\033[0m\n'
        raise SystemExit

    ui_domain = str(raw_input('\nPlease enter the public domain that the Unfetter-UI is hosted on: ')).strip()
    if not file_exists or ui_domain != '':
        private_config['unfetterUiCallbackURL'] = template['unfetterUiCallbackURL'] % (ui_domain)

    session_secret = getpass.getpass('\nPlease enter a unique password that '
        'the Unfetter-Discover-API will use to encrypt session variables: (hidden) ').strip()
    if not file_exists or session_secret != '':
        private_config['sessionSecret'] = session_secret

    jwt_secret = getpass.getpass('\nPlease enter a unique password that '
        'the Unfetter-Discover-API and Unfetter-Socket-Server will use to encrypt JSON Web Tokens: (hidden) ').strip()
    if not file_exists or jwt_secret != '':
        private_config['jwtSecret'] = jwt_secret

    print '\n\033[32mAll fields successfully entered.\033[0m\n'

    write_to_file = str(raw_input('\nDo you wish for the configuration to be saved to file? [y/n]: ')).strip().lower()
    if write_to_file == 'y':
        try:
            private_config["authServices"] = services

            out_file = open(inp_file, 'w')
            json.dump(private_config, out_file, indent=4)
            out_file.write('\n')
            out_file.close()
            print '\n\033[32mConfiguration successfully written to ' + os.path.abspath(inp_file) + '\033[0m'
            socket_out_file = open (socket_server_config, 'w')
            json.dump(private_config, socket_out_file, indent=4)
            socket_out_file.write('\n')
            socket_out_file.close()
            print '\n\033[32mConfiguration successfully written to ' + os.path.abspath(socket_server_config) + '\033[0m'

            write_to_ui = str(raw_input(
                '\nDo you wish to update the unfetter-ui environment file? [y/n]: ')).strip().lower()
            if (write_to_ui == 'y'):
                ui_path = str(raw_input(
                    '\nPlease enter the path to the unfetter-ui directory [../../unfetter-ui]: ')).strip()
                if ui_path == '':
                    ui_path = '../../unfetter-ui'
                env_uac_file = os.path.join(ui_path + '/src/environments/environment.uac.ts')
                env_prod_file = os.path.join(ui_path + '/src/environments/environment.prod.ts')
                try:
                    update_ui_env(env_uac_file)
                    update_ui_env(env_prod_file)
                    print '\nBye!\033[0m\n\n'                    
                except:
                    print '\033[31mError working with env file ', sys.exc_info(), '\033[0m'

        except:
            print '\033[31mUnable to write configuration to file\033[0m'

    else:
        print '\033[31mExiting program without writing configurations to file.\033[0m'
