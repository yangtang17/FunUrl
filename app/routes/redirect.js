var express = require('express');
var router = express.Router();
var urlService = require('../services/urlService');
var statsService = require('../services/statsService');
var path = require('path');


// lookup a shortUrl, redirect to it if non-null; otherwise redirect to root
router.get('*', function(req, res) {
    // remove '/' at the beginning
    var shortUrl = req.originalUrl.slice(1);

    // decode shortUrl since originalUrl didn't go through utf-8 decoding
    shortUrl = decodeURIComponent(shortUrl);
    // console.log('getting shortUrl for redirecting: ' + shortUrl);

    urlService.getLongUrl(shortUrl, function(url) {
        if (url && url.longUrl) { // can't directly call url.longUrl
            res.redirect(url.longUrl);
            statsService.logRequest(shortUrl, req);
        } else {
            // if not found, return index page, let client side handle further // routing
            res.sendFile("index.html", { root: path.join(__dirname, '../public/views/') });
        }
    });
});


module.exports = router;
