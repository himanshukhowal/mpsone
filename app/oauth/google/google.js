var express = require('express');
var router = express.Router();
const jwt = require('njwt');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;

var utils = require('../../utils/oauthUtils.js');

var oauthAppCredentials = {
  clientID: '108354687358-ve866bhms13ise8gqldj8k9iua4ihvpq.apps.googleusercontent.com',
  clientSecret: '6XnOepNTZAxYGfwALsFvG0W-',
  callbackURL: 'http://localhost:3000/oauth/google/loginDone',
  passReqToCallback: true
}

var oauthView = {
  title: 'Google Integration - MPSLimited',
  application: 'Google',
  imageUrl: '/staticFiles/images/g-logo.png',
};

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy(oauthAppCredentials,
  function(request, accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

router.use('/login', (req, res) => {
  console.log('Request Intercepted');
  var responses = utils.isValidRequest(req);
  console.log(responses);
  if(responses.status == 200)
  {
      req.session.redirectUrl = req.query.redirectUrl;
      req.next();
  }
  else
  {
      oauthView.message = responses.message;
      res.render('oauthError', {oauthView: oauthView});
  }
});

router.get('/login', (req, res) => {
  oauthView.loginUrl = 'auth/google';
  res.render('oauth',{oauthView: oauthView});
});

router.get('/auth/google', 
  passport.authenticate('google', { scope: ['email', 'profile']})
);

router.get( '/loginDone', 
  passport.authenticate( 'google', { 
  	successRedirect: 'fetchData',
  	failureRedirect: 'errorPage'
}));

router.get('/fetchData', (req, res) =>{
  console.log(req.user._json);
  var token = jwt.create(req.user, 'MPSLIMITED');
  token.setExpiration(new Date().getTime() + 60*1000);
  console.log(req.session.mode + ' - ' + req.session.redirectUrl);
  oauthView.redirectUrl = req.session.redirectUrl;
  oauthView.tokenData = token.compact();
  res.render('oauthcomplete',{oauthView: oauthView});
});

module.exports = router;