var mongoose = require('mongoose');

var UrlSchema = mongoose.Schema({
    shortUrl: String,
    longUrl: String,
    urlType: String
});

var urlModel = mongoose.model('UrlModel', UrlSchema);

module.exports = urlModel;
