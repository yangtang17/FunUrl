var geoip = require('geoip-lite');
var RequestModel = require('../models/requestModel');

var logRequest = function(shortUrl, req) {
    var reqInfo = {};
    reqInfo.shortUrl = shortUrl;

    // referer is undefined if directly entering url in browser
    reqInfo.referer = req.headers.referer || 'Unknown';

    // use express-useragent middleware to extract user-agaent info
    reqInfo.platform = req.useragent.platform || 'Unknown';
    reqInfo.browser = req.useragent.browser || 'Unknown';

    // user geoip-lite package to extract user country
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    var geo = geoip.lookup(ip);
    if (geo) { // in case geo === null
        reqInfo.country = geo.country;
    } else {
        reqInfo.country = 'Unknown';
    }

    // generate a timestamp in Date type
    reqInfo.timestamp = new Date();

    // save to Mongodb using mongoose
    var request = new RequestModel(reqInfo);
    request.save();

};

var getUrlInfo = function(shortUrl, info, callback) {
    if (info === 'totalClicks') {
        RequestModel.count({ shortUrl: shortUrl }, function(err, data) {
            callback(data);
        });
        return;
    }

    var groupId = '';
    var timeLimit = new Date().getTime(); // only show data after this time
    if (info === 'hour') {
        groupId = {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
            hour: { $hour: "$timestamp" },
            minutes: { $minute: "$timestamp" }
        };
        timeLimit -= 60 * 60 * 1000; // past hour
    } else if (info === 'day') {
        groupId = {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
            hour: { $hour: "$timestamp" }
        };
        timeLimit -= 24 * 60 * 60 * 1000; // past day
    } else if (info === 'month') {
        groupId = {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" }
        };
        timeLimit -= 30 * 24 * 60 * 60 * 1000; // past month
    } else {
        groupId = '$' + info;
        timeLimit = 0; // after 1970...
    }

    RequestModel.aggregate([{
        $match: {
            shortUrl: shortUrl,
            timestamp: { $gt: new Date(timeLimit) }
        }
    }, {
        $sort: {
            timestamp: -1
        }
    }, {
        $group: {
            _id: groupId,
            count: {
                $sum: 1
            }
        }
    }], function(err, data) {


        callback(data);
    });



};

module.exports = {
    logRequest: logRequest,
    getUrlInfo: getUrlInfo
};
