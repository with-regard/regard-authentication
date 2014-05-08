var express = require('express');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;

module.exports = function (userController) {
  var app = express();

  var secret = process.env.COOKIE_SECRET;

  app.use(cookieParser(secret));
  app.use(cookieSession({
    name: 'regard-session',
    keys: [secret],
    domain: '.withregard.io'
  }));

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    userController.fetchUserById(id).then(function (user) {
      done(null, user);
    });
  });

  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_APP_ID,
      clientSecret: process.env.GITHUB_APP_SECRET,
      callbackURL: "/auth/github"
    },
    function (accessToken, refreshToken, profile, done) {
      userController.findOrCreateUser(profile).then(function (user) {
        done(null, user);
      });
    }
  ));

  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/auth/github',
    passport.authenticate('github', {
      failureRedirect: '/login'
    }),
    function (req, res) {
      res.redirect('/');
    });

  app.get('/login', function (req, res) {
    res.redirect('/auth/github');
  });

  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  app.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
  });

  return app;
}
