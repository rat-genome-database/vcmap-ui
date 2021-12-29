# vcmap-ui
Web based VCmap

# App configuration

An example configuration file can be found at `<project_root>/app/config/app.config.ts.example`. All of the required config properties
can be found inside of that file. To set up your configuration: 
1. Copy and paste the example config file (`app.config.ts.example`) into the config directory within the `app` folder and rename it to `app.config.ts`
2. Set the values of the properties within the object exported from that file

Note: The app will reload any time you change a config property within the dev environment  

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


# Recommended extensions for development

If you are developing with VSCode, I recommend installing the `Vue Language Features (Volar)` extension. It is built specifically for Vue3.