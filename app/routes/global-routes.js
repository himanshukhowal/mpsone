var express = require('express');
var router = express.Router();

var oauth = require('../oauth/routes/routes.js');
router.use('/oauth', oauth);

var pivot = require('../pivot/routes/routes.js');
router.use('/pivot', pivot);

module.exports = router;