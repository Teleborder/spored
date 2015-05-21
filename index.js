var express = require('express'),
    app = express(),
    config = require('./config'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    retry = require('./retry');

app.use(bodyParser.raw());

app.use(function (req, res, next) {
  console.log(req.method + " " + req.originalUrl);
  next();
});

app.get('*', routes.get);
app.post('*', routes.post);
app.put('*', routes.put);
app.patch('*', routes.patch);
app.delete('*', routes.delete);

app.use(function (req, res, next) {
  res.sendStatus(404);
});

var server = app.listen(config.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('spored listening at http://%s:%s', host, port);
});

retry.start();
