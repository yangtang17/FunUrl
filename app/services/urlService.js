var UrlModel = require('../models/urlModel');
var redis = require('redis');

var port = process.env.REDIS_PORT_6379_TCP_PORT;
var host = process.env.REDIS_PORT_6379_TCP_ADDR;

var redisClient = redis.createClient(port, host);


// ================== Redis monitoring code for debugging ==================

redisClient.monitor(function(err, res) {
    console.log("Entering monitoring mode.");
});

redisClient.on("monitor", function(time, args, raw_reply) {
    console.log(time + ": " + args);
});

// output all keys to check if old memory exists
redisClient.keys('*', function(err, replies) {
    replies.forEach(function(reply) {
        redisClient.get(reply, function(err, val) {
            console.log('key: ' + reply + ', value: ' + val + 'of type ' + typeof(val));
        });
    });
});

// flush all memory in case old records cause mistakes
redisClient.flushall();
// ======================= Main logic==========================================
// get shortUrl from given longUrl
var getShortUrl = function(longUrl, callback) {
    // handle url without 'http://'
    if (longUrl.indexOf('http') === -1) {
        longUrl = 'http://' + longUrl;
    }

    redisClient.get(longUrl, function(err, shortUrl) {
        if (shortUrl) {
            console.log('redisClient: return getShortUrl from redis!');
            callback({
                shortUrl: shortUrl,
                longUrl: longUrl
            });
        } else {
            UrlModel.findOne({ longUrl: longUrl }, function(err, url) {
                if (url) {
                    callback(url);
                    redisClient.set(url.shortUrl, url.longUrl);
                    redisClient.set(url.longUrl, url.shortUrl);
                } else {
                    generateShortUrl(function(shortUrl) {
                        url = new UrlModel({
                            shortUrl: shortUrl,
                            longUrl: longUrl
                        });
                        url.save();
                        callback(url);
                        redisClient.set(url.shortUrl, url.longUrl);
                        redisClient.set(url.longUrl, url.shortUrl);
                    });
                }
            });
        }
    });

};

// get longUrl from given shortUrl
var getLongUrl = function(shortUrl, callback) {
    redisClient.get(shortUrl, function(err, longUrl) {
        if (longUrl) {
            callback({
                shortUrl: shortUrl,
                longUrl: longUrl
            });
        } else {
            UrlModel.findOne({ shortUrl: shortUrl }, function(err, url) {
                callback(url);
                if (url) {
                    redisClient.set(url.shortUrl, url.longUrl);
                    redisClient.set(url.longUrl, url.shortUrl);
                }
            });
        }
    });

};



//================================== Helpers =================================

// generate a new shortUrl for given longUrl
var generateShortUrl = function(callback) {
    UrlModel.count({}, function(err, num) {
        callback(convertTo62(num));
    });
};

// convert number from 10-base to 62-base (inverted order) string
function convertTo62(number) {
    // encode =['a',...,'z','A',...,'Z','0',...,'9'
    var encode = getSeq('a', 'z').concat(getSeq('A', 'Z'), getSeq('0', '9'));
    res = "";
    do { // need 2nd condition to ensure not to skip 0 input
        res += encode[number % 62];
        number = Math.floor(number / 62);
    } while (number);
    return res;
}

// generate a string sequence from a to b, e.g. getSeq('a','d') => 'abcd'
function getSeq(a, b) {
    var len = b.charCodeAt(0) - a.charCodeAt(0) + 1;
    return Array.apply(null, Array(len)).map(function(value, index) {
        return String.fromCharCode(index + a.charCodeAt(0));
    }).join("");
}

// ========================== Output ==========================================
module.exports = {
    getShortUrl: getShortUrl,
    getLongUrl: getLongUrl
};
