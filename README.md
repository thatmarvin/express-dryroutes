# express-dryroutes

[![Build Status](http://img.shields.io/travis/thatmarvin/express-dryroutes.svg)](http://travis-ci.org/thatmarvin/express-dryroutes)

Provides an `urlFor()` [Express](https://github.com/visionmedia/express) view helper (minor inspiration from Rails’ [`url_for`](http://api.rubyonrails.org/classes/ActionView/Helpers/UrlHelper.html#method-i-url_for)) to generate URLs based on named routes.

Since Express does not natively provide a mechanism to assign routes names, an alternative syntax is used to define routes that Express still understands. Do file an issue (or send a pull request) if it hinders any native flexibility!

express-dryroutes also provides an option to define and enforce HTTPS routes. By default, a request is considered HTTPS if `req.secure` is true. You might need to turn on [`trust proxy`](http://expressjs.com/api.html#app-settings) for this to work.

Express 3 is supported from 1.0.0.

## Install

`$ npm install express-dryroutes`



## Caveats

The `*` catch-all route behaves differently. If you need to use it, do it using the usual Express way (if you need named error page routes, you‘re probably doing it wrong). 

```js
app.all('*', function (req, res, next) {
  // 404 Not found
  controllers.error(req, res, 404);
});
```


## Usage

### Configuration

```js
var dryroutes = require('express-dryroutes');

app.configure('development', function () {
  dryroutes.configure({
    host: 'example.local:3000'
  });
});

app.configure('production', function () {
  dryroutes.configure({
    host: 'www.example.com'
  });
});
```

- `host`: _required_. This is used to generate absolute URLs. Corresponds to `host` in the [`url`](http://nodejs.org/docs/latest/api/url.html) module.


### Define Routes

#### Route Parameters:

```js
var routes = {
  'route name': {
    path: '/url-path/:param1/:param2' 
    regexp: /post\/(\d+)\/([a-zA-Z0-9\-]+)/,
    handlers: {
      get: function (req, res, next) {},
      post: [auth, controller.article.post]
    },
    enforceHttps: true
  },
  'another route name': {
    …
  },
  …
}
```

- `path`: _required_. This is used to generate all URLs.
- `regexp`: _optional_. The same regex object that gets passed into Express routes.
- `handlers`: _required_. Method names correspond to 'app.get/post/all/…()' as keys, and a middleware function or an array of middleware functions as values
- `https`: _optional_. Defaults to `false`. If truthy, the _generated_ url will be in https (use `enforceHttps` to set up automatic redirect).
- `enforceHttps`: _optional_. Defaults to `false`. Sets up an automatic 301 redirect from http to https; automatically assumes that `https` is true.


#### Example:

Given the following native Express routes:

```js
app.get('/', controllers.home);

app.get(/\/user\/([a-z0-9]+)/, req.user.isAuthorized, controllers.user.get);

app.get('/item/:id', {
  get: function (req, res, next) {
    if (/\d+/.test(req.param('id'))) {
      controllers.item.show(req, res);
    } else {
      next();
    }
  }
});

app.get('/login', controllers.logIn.get);
app.post('/login', controllers.logIn.post);
```

They now look like this:

```js
var routes = {
  'home': {
    path: '/',
    handlers: {
      get: controllers.home
    }
  },

  'user page': {
    path: '/user/:id',
    regexp: /\/user\/([a-z0-9]+)/,
    handlers: {
      get: [req.user.isAuthorized, controllers.user.get]
    },
  },

  'item details': {
    path: '/item/:id',
    handlers: {
      get: function (req, res, next) {
        if (/\d+/.test(req.param('id'))) {
          controllers.item.show(req, res);
        } else {
          next();
        }
      }
    }
  },

  'login': {
    path: '/login',
    handlers: {
      get: controllers.logIn.get,
      post: controllers.logIn.post
    },
    https: true
  }
};

// Pass in the Express app object and the routes object
dryroutes(app, routes);
```


### Generate URLs in Views

Passed-in `params` are matched against the named params in the route path. Any non-matching params key-value pairs will be appended to the url as query strings as parsed by [`url.format()`](http://nodejs.org/docs/latest/api/url.html#url.format).

If the path contains an optional named param (like `/path/:param?`) that wasn’t substituted, it will be removed along with the leading slash (becomes `/path`).

Like in the example above, regex routes require a path with named params for this to work.


```js
// /user/good-guy-greg?foo=bar
urlFor('user page', {
  params: {
    id: 'good-guy-greg',
    foo: 'bar'
  },
  absolute: false
})

// https://localhost:3000/login
urlFor('login')
```

- `params`: _required for paths with named params_. An object of key-value pairs.
- `absolute`: _optional_. Defaults to `false`. Generates an absolute URL (Note that HTTPS routes are always absolute).



[Jade](https://github.com/visionmedia/jade) example:

```jade
// <a href="/item/8">View Item Name</a>
a(href=urlFor('item details', {
  id: item.id
}) View #{item.name}
```

Pull requests for other templating engines are welcome!

## Test

`npm test` will invoke an Express server instance and run a few tests against it.
