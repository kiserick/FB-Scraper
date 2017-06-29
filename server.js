var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic('html')).listen(8080);