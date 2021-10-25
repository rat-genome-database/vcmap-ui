# vcmap-ui
Web based VCmap

# Running dev setup
To setup a development environment using the Docker setup, start with
1. `$> docker-compose build`
2. `$> docker-compose up`

This will build the correct container to run the Vue3 app and then start it

# Teardown
To tear down your dev environment, run the command
  `$> docker-compose down -v`
  
The `-v` is important for removing the volume that is mounted for your `node_modules`. 
If this doesn't get removed, any new modules you install may be hidden by your existing volume the next
time you start up your containers.
