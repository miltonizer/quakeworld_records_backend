#!/bin/bash
export QUAKEWORLD_RECORDS_POSTGRES_USER=postgres
export QUAKEWORLD_RECORDS_POSTGRES_PASSWORD=postgres
export POSTGRES_QUAKEWORLD_RECORDS_USER=quakeworld_records_user
export POSTGRES_QUAKEWORLD_RECORDS_USER_PASSWORD=password
export NODE_ENV=development

# Set the jwt private key only in production because otherwise config npm
# package will always read the key from this environment value instead of
# its own json configuration files and for example tests will break.
#export quakeworld_records_backend_jwtPrivateKey=12345678

# The same thing with node port environment variable. Not setting this in 
# development makes it easier to run test suites and development environment
# at the same time.
#export quakeworld_records_backend_node_port=3000