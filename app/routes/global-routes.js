var express = require('express');
var router = express.Router();

var oauth = require('../oauth/routes/routes.js');
router.use('/oauth', oauth);

module.exports = router;