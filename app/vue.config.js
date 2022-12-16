module.exports = {
  // NOTE: Use the following parameter to instruct Vue to target a subdirectory
  //   for hosting the resources. This is mostly used for production builds as
  //   the dev environment is hosted by the Vue CLI internal web server.
  //publicPath: '/vcmap/',
  devServer: {
    allowedHosts: 'all',
    headers: {
      "Access-Control-Allow-Origin" : "*"
    }
  }
};
