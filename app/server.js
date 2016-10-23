var express = require('express');
var app = express();
var socketio = require('socket.io');
var restRouter = require('./routes/rest');
var RedirectRouter = require('./routes/redirect');
var indexRouter = require('./routes/index');
var mongoose = require('mongoose');
var useragent = require('express-useragent');
// app.listen(3000) returns an http.Server object listening to port 3000
var io = socketio(app.listen(3000));

mongoose.connect('mongodb://user:user@ds051523.mlab.com:51523/xsurl');

app.use('/public', express.static(__dirname + '/public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

// pre-process all requests with express-useragent middleware, except for those
// requesting documents from '/public' path
app.use(useragent.express());

app.use("/api/v1", restRouter);

app.use("/", indexRouter);

app.use("/:shortUrl", (new RedirectRouter(io)).router);

io.on('connection', function(socket) {
    console.log('socket connected: ' + socket);
});
