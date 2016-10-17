var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlService = require('../services/urlService');
var statsService = require('../services/statsService');

// post a new longUrl
router.post('/urls', jsonParser, function(req, res) {
    var longUrl = req.body.longUrl;
    var urlType = req.body.urlType;
    urlService.getShortUrl(longUrl, urlType, function(url) {
        res.json(url);
    });
});

// lookup a shortUrl without redirecting
router.get('/urls/:shortUrl', function(req, res) {
    var shortUrl = req.params.shortUrl;
    // console.log('getting shortUrl: ' + shortUrl);
    urlService.getLongUrl(shortUrl, function(url) {
        res.json(url);
    });
});

// lookup shortUrl statistics
router.get('/urls/:shortUrl/:info', function(req, res) {
    var shortUrl = req.params.shortUrl;
    var info = req.params.info;

    statsService.getUrlInfo(shortUrl, info, function(data) {
        res.json(data);
    });
});

module.exports = router;
