const createError = require('http-errors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const logger = require('morgan');

require('dotenv').config();


// ROUTES
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');


// MAKE APP
var app = express();



// MIDDLEWAREZ
console.log("process.env", process.env);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// APP
app.listen(process.env.PORT || 1337, () => {
  mongoose.connect(process.env.DB_CONN_STRING, error => {
    if (error){
      console.error("error: " + error);
    }
    else {
      console.log('connected to db');
    }
  })

});

module.exports = app;
