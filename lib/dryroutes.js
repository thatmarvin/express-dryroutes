var _ = require('underscore');
var url = require('url');

var app = null;
var routes = {};
var defaults = {
  host: '',
  // @TODO: this is undocumented, not sure if it's a good idea or not
  absolute: false,
  enforceHttps: false
};

function redirectToHttps(req, res, next) {
  if (!req.secure) {
    // Convert url to absolute https
    var reqObj = url.parse(req.url);
    reqObj.protocol = 'https';
    reqObj.host = defaults.host;

    res.redirect(301, url.format(reqObj));
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

  if (defaults.enforceHttps) {
    route.enforceHttps = true;
  }

  // https is implicitly true if enforced
  if (route.enforceHttps) {
    route.https = true;
  }

  _.each(route.handlers, (handler, method) => {
    // Normalize into an array
    var handlers = null;
    if (_.isArray(handler)) {
      handlers = handler;
    } else if (_.isFunction(handler)) {
      handlers = [handler];
    }
    
    // Inject redirect middleware to redirect HTTP to HTTPS if enforced
    if (route.enforceHttps) {
      handlers.unshift(redirectToHttps);
    }

    // Insert first /path argument
    handlers.unshift(path);

    app[method](...handlers);
  });
}

function substitute(path, params) {
  _.each(params, (value, key) => {
    var token = ':' + key;
    if (path.indexOf(token) !== -1) {
      path = path.replace(token, value);

      // Get rid of used params, unused params are left as query params
      // @TODO: There should be a cleaner way to do this
      delete params[key];
    }
  });

  // Path may contain an optional param that wasn't subtituted, so we get rid
  // of it
  path = path.replace(/\/:\w+?\?/g, '')

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
    console.warn('urlFor() cannot find a route named "' + routeName + '"');
    return '';
  }

  options = options || {};

  var routeParts = url.parse(route.path);

  var urlOptions = {
    pathname: substitute(routeParts.pathname, options.params),
    query: options.params,
    hash: routeParts.hash
  };

  // https needs to be absolute too
  var isAbsolute = (options.absolute !== undefined)
    ? options.absolute
    : defaults.absolute;

  if (isAbsolute || route.https) {
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
  _.each(routes, route => {
    parse(route);
  }, this);

  // Provide view helper
  app.locals.urlFor = urlFor;

};

module.exports.configure = function (newDefaults) {
  _.extend(defaults, newDefaults)
  return this;
};

module.exports.urlFor = urlFor;
