var express = require('express');
var router = express.Router();
const request = require('request');
const jwt = require('njwt');

var utils = require('../../utils/oauthUtils.js');

var oauthAppCredentials = {
  clientID: '86frn9w5ow90lm',
  clientSecret: '4qJwMDsA8hc2oMKp',
  callbackURL: 'http://localhost:3000/oauth/linkedin/loginDone',
  state: 'MPSLimited'
}

var oauthView = {
  title: 'LinkedIn Integration - MPSLimited',
  application: 'LinkedIn',
  imageUrl: '/staticFiles/images/linkedin-logo.png',
};

var oauthUrls = {
    authorization: 'https://www.linkedin.com/oauth/v2/authorization',
    token: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
    emailUrl: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))'
}

router.use('/login', (req, res) => {
  var responses = utils.isValidRequest(req);
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
  oauthView.loginUrl = oauthUrls.authorization + '?response_type=code&client_id=' + oauthAppCredentials.clientID + '&redirect_uri=' + oauthAppCredentials.callbackURL + '&state=' + oauthAppCredentials.state + '&scope=r_liteprofile%20r_emailaddress';
  res.render('oauth',{oauthView: oauthView});
});

router.get('/loginDone', (req, res) => {
    var _res = res;
    var code = req.query.code
    request({
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: oauthUrls.token,
        body: 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + oauthAppCredentials.callbackURL + '&client_id=' + oauthAppCredentials.clientID + '&client_secret=' + oauthAppCredentials.clientSecret,
        method: 'POST'
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        var jsonBody = JSON.parse(body);
        _res.redirect('./fetchData/' + jsonBody.access_token);
    });
});

router.get('/fetchData/:accessToken', (req, res) =>{
    var _res = res;
    var accessToken = req.params.accessToken;

    var payload = {
        profile: null,
        email: null
    }

    getProfile(accessToken, (profileData) => {
        payload.profile = profileData;
        
        getEmail(accessToken, (emailData) => {
            payload.email = emailData;
            oauthView.firstName = payload.profile.firstName.localized.en_US;
            var token = jwt.create(payload, 'MPSLIMITED');
            token.setExpiration(new Date().getTime() + 60*1000);
            oauthView.redirectUrl = req.session.redirectUrl;
            oauthView.tokenData = token.compact();
            _res.render('oauthcomplete',{oauthView: oauthView});
        })
    });
});

function getEmail(accessToken, callback)
{
    request({
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        uri: oauthUrls.emailUrl,
        method: 'GET'
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        callback(JSON.parse(body));
    });
}

function getProfile(accessToken, callback){
    request({
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        uri: oauthUrls.profileUrl,
        method: 'GET'
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        var jsonBody = JSON.parse(body);
        callback(JSON.parse(body));
    });
}

module.exports = router;