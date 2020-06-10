var express = require('express');
var router = express.Router();

var orcid = require('../orcid/orcid.js');
router.use('/orcid', orcid);

var google = require('../google/google.js');
router.use('/google', google);

var linkedin = require('../linkedin/linkedin.js');
router.use('/linkedin', linkedin);

module.exports = router;