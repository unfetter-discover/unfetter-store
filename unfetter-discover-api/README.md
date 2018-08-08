# Unfetter Discover API

## UAC Configuration

See: https://github.com/unfetter-discover/unfetter/wiki/GitHub-&-Gitlab-UAC-Configuration

## Configuration Hierarchy

Environment variables > configuration file (UAC only) > defaults

Please note that there is only a small overlap between environmental variables and the configuration file, most enviromental variables are not considered in the configuration file.

## Environment Variables

| Name      | Purpose                                         |
|-----------|-------------------------------------------------|
| `API_ROOT`   | The base root of the API, default: https://localhost/api |
| `CTF_PARSE_HOST`| default: http://localhost |
| `CTF_PARSE_PORT` | default: 10010 |
| `CTF_PARSE_PATH` | default: /upload |
| `PATTERN_HANDLER_DOMAIN` | default: unfetter-pattern-handler |
| `PATTERN_HANDLER_PORT` | default: 5000 |
| `RUN_MODE` | The run mode of Unfetter, no default value.  See: https://github.com/unfetter-discover/unfetter/wiki/Unfetter-Build-Types-&-Run-Modes#run-modes-1 |
| `SOCKET_SERVER_URL` | default: unfetter-socket-server |
| `SOCKET_SERVER_PORT` | default: 3333 |
