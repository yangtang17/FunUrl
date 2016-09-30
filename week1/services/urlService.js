var longToShortHash = {};
var shortToLongHash = {};

// get shortUrl from given longUrl
var getShortUrl = function(longUrl) {
    // handle url without 'http://'
    if (longUrl.indexOf('http') === -1) {
        longUrl = 'http://' + longUrl;
    }

    if(longToShortHash[longUrl] != null) {
        return longToShortHash[longUrl];
    } else {
        var shortUrl = generateShortUrl();
        longToShortHash[longUrl] = shortUrl;
        shortToLongHash[shortUrl] = longUrl;
        return shortUrl;
    }
};

// get longUrl from given shortUrl
var getLongUrl = function(shortUrl) {
    return shortToLongHash[shortUrl];
};

// generate a new shortUrl
var generateShortUrl = function () {
    return convertTo62(Object.keys(longToShortHash).length);
};

// convert number from 10-base to 62-base (inverted order) string
function convertTo62(number) {
    // encode =['a',...,'z','A',...,'Z','0',...,'9'
    var encode = getSeq('a','z').concat(getSeq('A','Z'), getSeq('0','9'));
    res = "";
    do { // need 2nd condition to ensure not to skip 0 input
        res += encode[number % 62];
        number = Math.floor(number / 62);
    } while (number)
    return res;
}

// generate a string sequence from a to b, e.g. getSeq('a','d') => 'abcd'
function getSeq(a, b) {
    var len = b.charCodeAt(0) - a.charCodeAt(0) + 1;
    return Array.apply(null, Array(len)).map(function(value, index) {
        return String.fromCharCode(index + a.charCodeAt(0));
    }).join("");
}


module.exports = {
    getShortUrl: getShortUrl,
    getLongUrl: getLongUrl
};

