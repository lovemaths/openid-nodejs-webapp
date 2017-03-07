/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

/******************************************************************************
 * Module dependencies.
 *****************************************************************************/

var express = require('express');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var passport = require('passport');
var util = require('util');
var bunyan = require('bunyan');
var base64url = require('base64url');
var config = require('./config');
var flash = require('connect-flash');

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

var log = bunyan.createLogger({
    name: 'Microsoft OIDC Example Web Application'
});

passport.serializeUser(function(user, done) {
  done(null, user.sub);
});

passport.deserializeUser(function(sub, done) {
  findBySub(sub, function (err, user) {
    done(err, user);
  });
});

var users = [];

var findBySub = function(sub, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
   log.info('we are using user: ', user);
    if (user.sub === sub) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: config.creds.redirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    thumbprint: config.creds.thumbprint,
    privatePEMKey: config.creds.privatePEMKey,
    loggingLevel: config.creds.loggingLevel,
    nonceLifetime: config.creds.nonceLifetime,
    jweKeyStore: config.creds.jweKeyStore
  },
  function(iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.sub) {
      return done(new Error("No sub found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findBySub(profile.sub, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    });
  }
));

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(methodOverride());
app.use(cookieParser());
app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
app.use(bodyParser.urlencoded({ extended : true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname + '/../../public'));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};

app.get('/', function(req, res) {
  res.render('index', { user: req.user, message: req.flash('error') });
});

app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', { user: req.user });
});

app.get('/login',
  passport.authenticate('azuread-openidconnect', {failureRedirect: '/', failureFlash: true}),
  function(req, res) {
    log.info('Login was called in the Sample');
    res.redirect('/');
});

app.post('/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/', failureFlash: true }),
  function(req, res) {
    log.info('We received a return from AzureAD.');
    res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

var testCases = {
  1: "{ 'id_token_invalid_nonce': true }",
  2: "{ 'id_token_invalid_signature': true }",

  3: "{ 'auth_response_invalid_state': true }",
  4: "{ 'auth_response_access_denied': true }",

  5: "{ 'token_response_missing_access_token': true }",
  6: "{ 'token_response_expired_access_token': true }",

  7: "{ 'JWE_alg': 'RSA1_5', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A128CBC-HS256', 'id_token_JWE_invalid_authTag': true }",
  8: "{ 'JWE_alg': 'RSA1_5', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A128CBC-HS256' }",
};

app.get('/:id',
  function(req, res, next) {
    req.logout();

    var tParams = base64url.encode(testCases[req.params['id']]);

    passport.authenticate('azuread-openidconnect', { extraReqQueryParams: { 'tParams': tParams }, failureRedirect: '/', failureFlash: true })(req, res, next);
  },
  function(req, res) {
    res.redirect('/');
  }
);

app.listen(3000);

