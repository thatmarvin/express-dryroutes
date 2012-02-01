var _ = require('underscore');
var url = require('url');

var app = null;
var routes = {};
var defaults = {
  host: '',
  isHttps: function (req) {
    return req.connection.encrypted ||
      (req.header('x-forwarded-protocol').toLowerCase() === 'https');
  }
};

function redirectToHttps(req, res, next) {
  if (!defaults.isHttps()) {
    var reqUrl = url.parse(req.uri);
    res.redirect(reqUrl.format({
      protocol: 'https'
    }));
  } else {
    next();
  }
}

function parse(route) {
  // "path" is required even with the presence of a regex. It is also used for
  // generating the route url through parameter token replacements.
  var path = route.regexp || route.path;
  if (!path) {
    throw new Error('"path" parameter is required');
  }

   _.each(route.handlers, function (handler, method) {
    var handlers = null;
    if (_.isArray(handler)) {
      handler.unshift(path);
      handlers = handler
    } else if (_.isFunction(handler)) {
      handlers = [path, handler];
    }
    
    // Inject redirect middleware to redirect HTTP to HTTPS
    if (route.enforceHttps) {
      handlers.unshift(redirectToHttps);
    }

    app[method].apply(app, handlers);
  });
}

function substitute(path, params) {
  _.each(params, function (value, key) {
    var token = ':' + key;
    if (path.indexOf(token) !== -1) {
      path = path.replace(token, value);

      // Get rid of used params, unused params are left as query params
      // @TODO: There should be a cleaner way to do this
      delete params.key;
    }
  });

  return path;
}

// Params that are not named the route will be appended as query strings
// 
// options: {
//   absolute: false,
//   params: {
//     key: value
//   }
// }
function urlFor(routeName, options) {
  var route = routes[routeName];
  if (!route) {
    throw new Error('Cannot find route named ' + routeName + '.');
  }

  options = options || {};

  var urlOptions = {
    pathname: substitute(route.path, options.params),
    query: options.params
  };

  // https needs to be absolute too
  if (options.absolute || route.https) {
    urlOptions.host = defaults.host;
    urlOptions.protocol = route.https ? 'https' : 'http';
  }

  return url.format(urlOptions);
};


module.exports = function (theApp, theRoutes) {
  if (!theApp) {
    throw new Error('"app" parameter is required.')
  }

  app = theApp;
  routes = theRoutes;

  // Initialize actual routes
  _.each(routes, function (route) {
    parse(route);
  }, this);

  // Provide view helper
  app.helpers({
    urlFor: urlFor
  });

};

module.exports.configure = function (newDefaults) {
  _.extend(defaults, newDefaults)
  return this;
};
