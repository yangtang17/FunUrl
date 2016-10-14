var mongoose = require('mongoose');

var RequestSchema = mongoose.Schema({
    shortUrl: String,
    referer: String,
    platform: String,
    browser: String,
    country: String,
    timestamp: Date
});

module.exports = mongoose.model('RequestModel', RequestSchema);
