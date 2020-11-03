[Environment]::SetEnvironmentVariable('QUAKEWORLD_RECORDS_POSTGRES_USER','postgres',[EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable('QUAKEWORLD_RECORDS_POSTGRES_PASSWORD','postgres',[EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable('POSTGRES_QUAKEWORLD_RECORDS_USER','quakeworld_records_user',[EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable('POSTGRES_QUAKEWORLD_RECORDS_USER_PASSWORD','password',[EnvironmentVariableTarget]::User)
[Environment]::SetEnvironmentVariable('NODE_ENV','development',[EnvironmentVariableTarget]::User)

# Set the jwt private key only in production because otherwise config npm
# package will always read the key from this environment value instead of
# its own json configuration files and for example tests will break.
#[Environment]::SetEnvironmentVariable('quakeworld_records_backend_jwtPrivateKey','12345678',[EnvironmentVariableTarget]::User)

# The same thing with node port environment variable. Not setting this in 
# development makes it easier to run test suites and development environment
# at the same time.
#[Environment]::SetEnvironmentVariable('quakeworld_records_backend_node_port','3000',[EnvironmentVariableTarget]::User)

# The same thing with demo base folder environment variable. Not setting this in 
# development makes it easier to run test suites and development environment
# at the same time.
#[Environment]::SetEnvironmentVariable('quakeworld_records_backend_demo_base_folder','C:\temp\',[EnvironmentVariableTarget]::User)