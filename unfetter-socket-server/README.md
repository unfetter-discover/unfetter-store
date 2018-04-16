## Debugging the Socket Server

To run the debugger in docker and/or locally in VSCode, the following configurations can be placed into `launch.json`.  Depending on how you opened the project, you may need to change the `${workspaceRoot}/` for the `localRoot` and `outFiles` properties. 

Alternatively, you may also debug port `6555` in Chrome using the Node Inspector Manager, however source maps won't be availible.

```{
    // Use IntelliSense to learn about possible Node.js debug attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "attach",
            "name": "Attach to Docker",
            "address": "localhost",
            "protocol": "auto",
            "port": 6555,
            "restart": true,
            "timeout": 60000,
            "localRoot": "${workspaceRoot}/unfetter-store/unfetter-socket-server",
            "remoteRoot": "/usr/share/unfetter-socket-server",
            "outFiles": [
                "${workspaceRoot}/unfetter-store/unfetter-socket-server/dist/**/*.js"
            ]
        },
        {
            "type": "node",
            "request": "attach",
            "name": "Local Nodemon",
            "address": "localhost",
            "protocol": "auto",
            "port": 6555,
            "internalConsoleOptions": "neverOpen",
            "outFiles": [
                "${workspaceRoot}/unfetter-store/unfetter-socket-server/dist/**/*.js"
            ]
        }
    ]
}
```