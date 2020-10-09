# Quakeworld Book of Records Backend
## Installation
### Development environment
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program.
- Install Docker
- Create a container for postgres volume:
`docker create -v /var/lib/postgresql/data --name quakeworld_records_data alpine`
- Run postgres in docker container with docker compose in docker folder:
`docker-compose.exe -f docker-compose.yml up -d`
- Connect to database and create a new database called quakeworld_records

## Running
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program.