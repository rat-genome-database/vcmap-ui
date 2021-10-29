FROM node:14.17.6-alpine

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

# Make sure our newly installed npm binaries are on the path
ENV PATH=/app/node_modules/.bin:$PATH

CMD npm run serve
