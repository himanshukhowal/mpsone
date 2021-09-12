var express = require('express');
var router = express.Router();

var table = require('../table/pivot.js');
router.use('/table', table);

module.exports = router;