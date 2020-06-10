var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require( 'passport' );
var app = express();

//configurations
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "mpslimited",
    proxy:  true,
    resave: true,
    saveUninitialized: true
}));

app.set('view engine', 'pug');
app.set('views','./views');
app.use('/staticFiles', express.static('public'));

app.use( passport.initialize());
app.use( passport.session());

app.use(function(req, res){
    console.log("Request received at " + Date.now());
    req.next();
});

//Request Handler
var requestHandler = require('./app/routes/global-routes.js');
app.use('/', requestHandler);

app.listen(8080);