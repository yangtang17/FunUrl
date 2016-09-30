var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlService = require('../services/urlService');

router.post("/urls", jsonParser, function(req, res) {
    console.log("before parsing longUrl: " + longUrl);
    var longUrl = req.body.longUrl;
    console.log("finishing parsing longUrl: " + longUrl);
    var shortUrl = urlService.getShortUrl(longUrl);
    res.json({
        shortUrl: shortUrl,
        longUrl: longUrl
    });
});

module.exports = router;