var express = require('express'),
    app = express(),
    config = require('./config'),
    bodyParser = require('body-parser'),
    proxy = require('./proxy');

app.use(bodyParser.raw());

app.get('*', proxy.get);
app.post('*', proxy.post);
app.put('*', proxy.put);
app.patch('*', proxy.patch);
app.delete('*', proxy.delete);

var server = app.listen(config.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('spored listening at http://%s:%s', host, port);
});
