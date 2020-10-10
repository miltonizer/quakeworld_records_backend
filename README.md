# Quakeworld Book of Records Backend
## Installation
### Development environment
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program. For some reason the powershell script runs slowly.
- Install Docker
- Run create_docker_images.ps1 powershell script to create a docker image for the postgres database.
- Run the postgres docker image in the docker folder. This will create a database and a user that can connect to the given database based on the environment variables set earlier. Notice that the init_db.sh script won't be executed if the data volume is not empty.
`docker-compose -f docker-compose.yml up -d`

## Running
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program.
- Start the postgres docker container by running:
`docker-compose -f docker-compose.yml up -d`
- Run the node backend in the root folder of the project:
`node index.js`