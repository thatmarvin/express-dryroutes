0.0.10 / 2013-05-23
==================
  * Add experimental feature to enforce HTTPS on all routes by default

0.0.9 / 2013-05-21
==================
  * Added tests
  * Fix thrown error when X-Forwarded-Proto is not set

0.0.8 / 2012-05-11
==================
  * Add undocumented configuration option to globally toggle generating absolute urls for `urlFor()`

0.0.7 / 2012-03-26
==================
  * Make enforceHttps on urlFor() work correctly for routes without handlers

0.0.6 / 2012-03-24
==================
  * Remove optional parameters that are not substituted out

0.0.5 / 2012-03-21
==================
  * Expose urlFor() to require()
  * When urlFor() is given an invalid route, simply output warning instead of throwing a show-stopping exception

0.0.4 / 2012-03-08
==================

  * Make `urlFor()` output https urls when `enforceHttps` is true

0.0.3 / 2012-03-08
==================

  * Make `enforceHttps` actually work
  * Improve README

0.0.2 / 2012-02-12
==================

  * Fix extraneous query params on urls

0.0.1 / 2012-02-01
==================

  * First release
