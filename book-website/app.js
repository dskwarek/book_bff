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

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.get('/book/:isbn?', function(req, res, next) {

  if (req.params.isbn) {
    
    goodGuyLib('https://book-catalog-proxy-1.herokuapp.com/book?isbn=' + req.params.isbn)
        .then(function (result) {
      var book = JSON.parse(result.body);
      if (book.items) {
        res.render('cover', {
          title: jp.query(book.items,'$..title'),
          cover: jp.query(book.items,'$..thumbnail'),
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
