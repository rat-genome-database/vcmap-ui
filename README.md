# vcmap-ui

VCmap Web UI

## Project Design Guide

Be sure to familiarize yourself with the [Project Design Guide](docs/DESIGN_GUIDE.md) if you will be
contributing to the source code for this project.

## Development Environment

### Configuration

An example configuration file can be found at `<project_root>/app/config/app.config.ts.example`. All
of the required config properties can be found inside of that file. To set up your configuration: 
1. Copy and paste the example config file (`app.config.ts.example`) into the config directory within
   the `app` folder and rename it to `app.config.ts`
2. Set the values of the properties within the object exported from that file

_Note_: The app will reload any time you change a config property within the dev environment  

### Setup

To setup the docker image to support your development environment use:

```
$> docker-compose build
```

During development you don't have to typically re-build this image, but if any upstream changes to
the docker environment are made, or you want to grab a newer version of the official Vue3 codebase,
you will need to first destroy your containers and other docker assets, and then rebuild:

```
$> docker-compose down -v
$> docker-compose build
```

_NOTE:_ Our `docker/Dockerfile` references a specific release of Node. When you wish to upgrade that
release you should modify that file and follow the process to rebuild your image.

### Startup

To startup a development environment using the Docker setup, start with

```
$> docker-compose up
```

This will build the correct container to run the Vue3 app and then start it.

### Teardown

To tear down your dev environment, run the command

```
$> docker-compose down -v
```
  
The `-v` is important for removing the volume that is mounted for your `node_modules`. 
If this doesn't get removed, any new modules you install may be hidden by your existing volume the
next time you start up your containers.

### Supporting Operations

Although it isn't frequently necessary, you might want to execute additional supporting operations
defined in the `app/package.json` file. The best way to do this is to execute these commands inside
of the running container. Before executing any of these commands, make sure the container is up and
running correctly.

* Run the linter:
  `$> docker exec vcmap-ui-container npm run lint`
* Run the unit tests:
  `$> docker exec vcmap-ui-container npm run test:unit`

_NOTE:_ These commands can be executed from any path on your workstation because they run within the
docker container.
_NOTE2:_ Some of the graphical styling of these commands might be improved when run locally, but in
order to execute these commands you will need a local copy of Node installed, and you will need to
run `npm install` from within the `app/` directory first to install all dependencies.

### Note on Vulnerabilities

There are currently a number of vulnerabilities identified by `npm audit` of various severity.
However, given that this codebase is compiled down to static assets, not of the vulnerabilities have
been identified as viable in a production environment as of the v0.6.0 release. That said, it is 
important that you monitor this list of vulnerabilities and determine if they need action,
especially as new items are added to the list. 

### Recommended extensions for development

If you are developing with VSCode, it is recommended that you installing the `Vue Language Features 
(Volar)` extension. It is built specifically for Vue3.

## Production Environment

The codebase is organized to give flexibility on how / where this system is ultimately hosted. The
intention is that the code will be built by the Vue CLI tool to a production ready static codebase
and hosted by any web system capable of serving static code.

We have not created a docker environment suitable for a production deployment of this code, although
this is certainly possible if desired in the future.

### Configuring

* API configuration
  Ensure you have a valid API Base URL configured in `app/config/app.config.ts` first
* Subdirectory hosting:
  The default hosting environment assumes the app will exist at the root of the web server. If you
  need to host the app in a subdirectory, define the path as the `publicPath` property in the
  `app/vue.config.js` file.

### Building

When building for production, using `docker` run the following:
```
$> docker exec vcmap-ui-container npm run build:prod
```

When building for production on your host workstation, run the following:

```
$> cd app
app $> npm install
app $> npm run build:prod
```

The build files will be output to the `app/dist/` directory with either method.
