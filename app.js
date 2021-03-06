var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var goodGuyLib = require('good-guy-http')({maxRetiries: 3});

var jp = require('jsonpath');
var esi = require('nodesi');
var middleware = esi.middleware;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(function (req,res,next) {
  var startAt = process.hrtime();
  res.on('finish', function () {
    var diff = process.hrtime(startAt);
    var time = diff[0] * 1e3 + diff[1] * 1e-6;
    console.log('Request time: ' + time + 'ms');
  });
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(middleware({
    onError: function(src, error) {
        return '<!-- GET ' + src + ' error ' + error + '-->';
    }
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.get('/book/:isbn?', function(req, res, next) {

  var requestId = req.headers['x-request-id'] || Math.random();
  req.esiOptions = {
    headers: {
      'x-request-id': requestId
    }
  };

  if (req.params.isbn) {
    
    goodGuyLib('https://book-catalog-proxy-1.herokuapp.com/book?isbn=' + req.params.isbn)
        .then(function (result) {
      var book = JSON.parse(result.body);
      if (book.items) {
        res.render('book', {
          title: jp.value(book.items,'$..title'),
          cover: jp.value(book.items,'$..thumbnail'),
          isbn: req.params.isbn,
          requestId: requestId, 
          partials: {
            layout: 'master'
          }
        });
      } else {
        res.render('error', {message: "Not found: " + req.params.isbn});
      }
    }).catch(next);
  } else {
    res.render('error', {message: "Id required!"});
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
