This module produces a microservice that constantly polls multiple, configurable feeds for new threat data; matches that data against criteria on user-created, custom threat boards; and, ingests that data into a Mongo collection. Notifications are then sent to the user accounts monitoring those threat boards that new data is available.

## Environmental Variables
