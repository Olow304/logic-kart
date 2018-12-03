// Third party libraries
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const path = require('path')
const session = require('express-session')
const expressValidator = require('express-validator')
const fileUpload = require('express-fileupload')
const passport = require('passport')

// My modules
const config = require('./config/secret')
const routePage = require('./routes/pages')
const products = require('./routes/products')
const routeAdmin = require('./routes/admin_pages')
const routeAdminCate = require('./routes/admin_category')
const routeAdminProduct = require('./routes/admin_product')
const routeCart = require('./routes/carts')
const routeUser = require('./routes/user')

// Connect to the database using mongo
mongoose.connect(config.DB)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
db.once('open', function(){
    console.log('connected to Mongo Database')
})

// Setup port number from environment, if not exists then use port number 3000
const PORT = process.env.PORT || 3000

// 
const app = express()

/*
 * Middlewaries used
 */
app.use(fileUpload())
app.use(morgan("dev"))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
// use views, public on ejs
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

// Set up 
app.locals.errors = null;

/* 
 * Find all pages and set up 
 */
const Page = require('./models/page')
Page.find({}).sort({sorting: 1}).exec(function(err, pages){
    if(err){
        console.log(err)
    }else{
        app.locals.pages = pages
    }
})

// get all categories
const Category = require('./models/categories')
Category.find(function(err, categories){
    if(err){
        console.log(err)
    }else{
        app.locals.categories = categories
    }
})

app.use(session({
    secret: 'keyboard cat',
    resave: 'true',
    saveUninitialized: true
    //cookie: {secure: true}
}))
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}))


app.use(require('connect-flash')())
app.use(function(req, res, next){
    res.locals.messages = require('express-messages')(req, res)
    next()
})

require('./config/passport')(passport)
// passport middleware
app.use(passport.initialize())
app.use(passport.session())

app.get('*', function(req, res, next){
    res.locals.cart = req.session.cart
    res.locals.user = req.user || null
    next()
})

// Root router
app.use('/admin/pages', routeAdmin)
app.use('/admin/categories', routeAdminCate)
app.use('/admin/products', routeAdminProduct)
app.use('/products', products)
app.use('/cart', routeCart)
app.use('/users', routeUser)
app.use(routePage)

app.listen(PORT, (err) => {
    if(err) console.log("Unable to start up server")
    console.log(`Listening on port ${PORT}`)
})
