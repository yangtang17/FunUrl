var express = require('express');
var router = express.Router();
var urlService = require('../services/urlService');
var statsService = require('../services/statsService');
var path = require('path');


// lookup a shortUrl, redirect to it if non-null; otherwise redirect to root
router.get('*', function(req, res) {
    // remove '/' at the beginning
    var shortUrl = req.originalUrl.slice(1);

    urlService.getLongUrl(shortUrl, function(url) {
        if (url && url.longUrl) { // can't directly call url.longUrl
            res.redirect(url.longUrl);
            statsService.logRequest(shortUrl, req);
        } else {
            //res.sendFile("404.html", {root: path.join(__dirname, '../public/views/')});

            // redirect to home page, to handle directl visit random url under
            // server domain from browser
            res.redirect('../');
        }
    });
});


module.exports = router;
