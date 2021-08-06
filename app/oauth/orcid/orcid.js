var express = require('express');
var router = express.Router();
const request = require('request');
const jwt = require('njwt');
var utils = require('../../utils/oauthUtils.js');

var oauthUrls = {
    authorization: 'https://orcid.org/oauth/authorize',
    token: 'https://orcid.org/oauth/token',
    fetchingUrl: 'https://pub.orcid.org/v2.1'
}

var oauthAppCredentials = {
    clientId: 'APP-RXAOPPWL9UXCYNRM',
    clientSecret: '0ba62477-818d-4d60-bdfa-78c16921a95b',
    redirectUri: 'https://mpsone.herokuapp.com/oauth/orcid/loginDone'
};

var oauthView = {
    title: 'ORCID Integration - MPSLimited',
    application: 'ORCID',
    imageUrl: '/staticFiles/images/orcid-logo.png',
};

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

router.get('/loginPage', function(req, res){
    res.render('login', {oauthView: oauthView});
});

router.get('/etgLogin', function(req, res){
    res.redirect('etgapp://');
});

router.get('/login', function(req, res){
    oauthView.loginUrl =  oauthUrls.authorization + '?client_id=' + oauthAppCredentials.clientId + '&response_type=code&scope=/authenticate&redirect_uri=' + oauthAppCredentials.redirectUri;
    res.render('oauth', {oauthView: oauthView});
});

router.get('/loginDone', function(req, res){
    console.log(req.query.code);
    var access_code = req.query.code;
    var _res = res;

    request({
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: oauthUrls.token,
        body: 'client_id=' + oauthAppCredentials.clientId + '&client_secret=' + oauthAppCredentials.clientSecret + '&grant_type=authorization_code&redirect_uri=' + oauthAppCredentials.redirectUri + '&code=' + access_code,
        method: 'POST'
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        var jsonResult = JSON.parse(body);
        _res.redirect('./fetchData/' + jsonResult.access_token + '/' + jsonResult.orcid);
    });
});

router.get('/fetchData/:accessToken/:orcidId', (req, res) => {
    var _res = res;
    var access_token = req.params.accessToken;
    var orcidId = req.params.orcidId;
    console.log(access_token + " - " + orcidId);
    request({
        headers: {
            'Accept': 'application/vnd.orcid+json',
            'Authorization': 'Bearer ' + access_token
        },
        uri: oauthUrls.fetchingUrl + '/' + orcidId + '/record',
        method: 'GET'
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        var jsonBody = JSON.parse(body);
        oauthView.firstName = jsonBody.person.name['given-names'].value;
        var token = jwt.create(jsonBody, 'MPSLIMITED');
        token.setExpiration(new Date().getTime() + 60*1000);
        console.log('- ' + req.session.redirectUrl);
        oauthView.redirectUrl = req.session.redirectUrl;
        oauthView.tokenData = token.compact();
        _res.render('oauthcomplete',{oauthView: oauthView});
    });
});

module.exports = router;
