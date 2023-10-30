FROM node:20-bullseye

# Switch to our app directory
WORKDIR /app

# Copy in our necessary files
COPY ./app/package.json package.json
COPY ./app/package-lock.json package-lock.json

# Install our dependencies
RUN npm install

# Install vue cli so it is available
COPY ./config/vuerc .vuerc
RUN npm install @vue/cli
# NOTE: this seems to come from a recent change in the uid for the running
#   process (using the host uid instead of root), only currently reported
#   on Linux systems. Not sure what changed, but we will need to look into
#   this more during the next cycle to see if we can avoid marking this cache
#   as World writable (a corresponding issue happens with the .npm logs as well...)
RUN mkdir node_modules/.cache && chmod 777 node_modules/.cache

# Make sure our newly installed npm binaries are on the path
ENV PATH=/app/node_modules/.bin:$PATH

CMD npm run serve
