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

// ============================= emoji resources ==============================
var emojiDict = [
    '😀', '😁', '😂', '🤣', '😅', '😆', '😍', '😘', '😎', '😙',
    '🤗', '🙄', '😪', '🤑', '😜', '😭', '😵', '😡', '😇', '🤡',
    '😈', '👹', '👻', '💩', '👾', '🤖', '😸', '😹', '😻', '😿',
    '🙈', '🖖', '👌', '👍', '👎', '🙏', '💅', '👀', '💋', '💘',
    '❤', '💓', '💔', '💕', '💚', '💢', '💣', '💥', '🐈', '🐴',
    '🦄', '🐷', '🐭', '🐣', '🐧', '🕊', '🐸', '🐢', '🦎', '🐳',
    '🐬', '🐙', '🌹', '🌻', '🌵', '🍁', '🍇', '🍈', '🍉', '🍊',
    '🍋', '🍌', '🍍', '🍎', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅',
    '🥑', '🍆', '🌽', '🍄', '🌰', '🥞', '🧀', '🍖', '🍔', '🍟',
    '🍕', '🌮', '🍲', '🍦', '🍩', '🍰', '🍵', '🍹', '🌍', '🛩',
    '🚀', '🌛', '🌞', '🌬', '🌈', '💧', '🎉', '🎃', '🎗', '🏀',
    '🏈', '🥋'
];



// ======================= Main logic==========================================
// get shortUrl from given longUrl
var getShortUrl = function(longUrl, urlType, callback) {
    // handle url without 'http://'
    if (longUrl.indexOf('http') === -1) {
        longUrl = 'http://' + longUrl;
    }

    // for longUrl, needs to store urlType as well, use 'redisClient.hgetall'
    redisClient.hgetall(longUrl, function(err, hash) {
        if (hash && hash.urlType === urlType) { // found shortUrl in redis
            // console.log('found shortUrl: ' + hash.shortUrl + '; type: ' + hash.urlType);
            callback({
                shortUrl: hash.shortUrl,
                longUrl: longUrl,
                urlType: hash.urlType
            });
        } else { // if not, check mongodb
            UrlModel.findOne({ longUrl: longUrl, urlType: urlType }, function(err, url) {
                if (url) { // found in mongodb, callback and save to redis
                    callback(url);
                    redisClient.set(url.shortUrl, url.longUrl);
                    redisClient.hmset(url.longUrl, 'shortUrl', url.shortUrl, 'urlType', url.urlType);
                } else { // not found, generate new shortUrl
                    generateShortUrl(urlType, function(shortUrl) {
                        url = new UrlModel({
                            shortUrl: shortUrl,
                            longUrl: longUrl,
                            urlType: urlType
                        });

                        // save to mongodb
                        url.save();

                        // callback
                        callback(url);

                        // save to redis
                        redisClient.set(url.shortUrl, url.longUrl);
                        redisClient.hmset(url.longUrl, 'shortUrl', url.shortUrl, 'urlType', url.urlType);
                    });
                }
            });
        }
    });

};

// get longUrl from given shortUrl
var getLongUrl = function(shortUrl, callback) {
    redisClient.get(shortUrl, function(err, longUrl) {
        if (longUrl) { // found in redis
            callback({
                shortUrl: shortUrl,
                longUrl: longUrl
            });
        } else { // not found, check mongodb
            UrlModel.findOne({ shortUrl: shortUrl }, function(err, url) {
                // callback even if url is null, so callback knows not found
                callback(url);

                // only save to redis when url is not null
                if (url) {
                    redisClient.set(url.shortUrl, url.longUrl);
                    redisClient.hmset(url.longUrl, 'shortUrl', url.shortUrl, 'urlType', url.urlType);
                }
            });
        }
    });

};



//================================== Helpers =================================

// generate a new shortUrl for given longUrl
var generateShortUrl = function(urlType, callback) {
    if (urlType === 'alphaNum') {
        UrlModel.count({}, function(err, num) {
            callback(convertTo62(num));
        });
    } else if (urlType === 'emoji') {
        var shortUrl = '';
        for (var i = 0; i < 6; i++) {
            var len = emojiDict.length;
            shortUrl += emojiDict[Math.floor(Math.random() * len)];
            //TODO: determine if having conflicts in mongoDB
        }
        callback(shortUrl);
    }

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
