var express = require('express'),
    app = express(),
    config = require('./config'),
    bodyParser = require('body-parser'),
    routes = require('./routes');

app.use(bodyParser.raw());

app.get('*', routes.get);
app.post('*', routes.post);
app.put('*', routes.put);
app.patch('*', routes.patch);
app.delete('*', routes.delete);

var server = app.listen(config.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('spored listening at http://%s:%s', host, port);
});

routes.retry.start();
