var express         = require('express');
var router          = express.Router();
var path            = require('path');
var favicon         = require('serve-favicon');
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var expressValidator = require('express-validator');
var flash           = require('connect-flash');
var session         = require('express-session');
var dbConfig        = require('./config/db.js');
var constants       = require('./config/constants.js');

var http            = require('http');
var cors            = require('cors');

//app port
const port = 5000;

var app = express();
// app.use(compression())

var mysql           = require('mysql');
var connection      = require('express-myconnection');

// Express Messages Middleware
app.use(flash());

// view engine setup
//app.engine('ejs', engine);
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));
app.use(logger('dev'));
app.use(cors());
app.options('*',cors());
// Body Parser Middleware
app.use(cookieParser()); // read cookies (needed for auth)

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    limit: "100mb", 
    extended: true,
    parameterLimit:50000
}));
// app.use(bodyParser.urlencoded({
//     extended: true
// }));

// Express Session Middleware
app.use(session({
    secret: 'Dr~jdprTsdf44',
    resave: true,
    saveUninitialized: true
}));
 
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;    
    res.locals.error = req.app.get('env') === 'devlopment' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//flash error and success mssages
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);    
    res.locals.notnull = constants.NOT_NULL_ARRAY;
    res.locals.error_messages = req.flash('errorMessage');
    res.locals.success_messages = req.flash('successMessages');
    // console.log(req.session.user)
    res.locals.user_role_id = req.session.user;
    next();
});

// Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));


 
//sql connection
app.use(connection(mysql, dbConfig));
//app.use(access.userAccess);

var fs = require('fs');

// Cron files
// app.use('/routes/cron', require('./routes/cron'));



fs.readdirSync('./routes/api').forEach(function (file) {
    if(file.substr(-3) == '.js') {
        var route_name = path.parse(file).name;
        app.use('/api/'+route_name, require('./routes/api/'+route_name));
    }
  });
 
//create server
var server = http.createServer(app);

// Start Server
server.listen(port, function () {
    console.log('HTTP server listening on port ' + port);
});

console.error = function(msg) {
    // send email
    // ...
    //console.log("common function",msg);
    // additionaly log
    process.stderr.write(msg);
};

module.exports = app;
