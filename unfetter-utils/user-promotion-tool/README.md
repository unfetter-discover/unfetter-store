# User Promotion Tool

__Description__: Unfetter requires administrators to approve users to the application after registering, and this tool is designed to make the first administrator of a deployment of Unfetter.  This tool may be run as many times against as many users as desired, however, the functionality can be completed in the administrative dashboard once the first administrator is created.

## Docker Usage (Recommended)

1. Bring up Unfetter
2. `./run-user-promotion-tool.sh`

## Local Usage

Note: This is __not__ the preferred way of running the script outside of development environments

1. Bring up and Unfetter and ensure there is a port mapping between `cti-stix-store-repository` and the host machine - This will usually be 27018.  Please note that this port being open is __not__ recommend
2. (sudo) `pip install -r requirements.txt`
3. `python user_promotion_tool.py`
4. If that doesn't work, run `python user_promotion_tool.py --help` to see additional options
   