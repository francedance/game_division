const express = require('express');
const hbs = require('express-handlebars'); //handlebars
const mongoose = require('mongoose'); //mongoose
const bodyParser = require('body-parser'); //bodyparser
const cookieParser = require('cookie-parser'); //cookieparser
const moment = require('moment'); //moment
const config = require('./config/config').get(process.env.NODE_ENV);
const app = express();


// HBS SETUP //
app.engine('hbs',hbs({
    extname:'hbs',
    defaultLayout: 'main',
    layoutDir: __dirname + './../views/layouts',
    partialsDir: __dirname + './../views/partials'
}));
app.set('view engine', 'hbs');

// MODELS
const {User} = require('./models/user');
const {Article} = require('./models/article');
const {UserReview} = require('./models/user_reviews');
// DB
mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE);

// Middlewares
app.use('/css', express.static(__dirname + './../public/css'));
app.use('/js', express.static(__dirname + './../public/js'));
app.use(bodyParser.json());
app.use(cookieParser());
const {auth} = require('./middleware/auth');
//GET 
app.get('/',(req,res)=>{

    Article.find().sort({_id:'asc'}).limit(10).exec((err,doc)=>{
        if(err) return res.status(400).send(err);
        res.render('home',{
            articles: doc
        });
    })

   
})

app.get('/register', auth, (req,res)=>{
    if(req.user) return res.redirect('/dashboard');
    res.render('register');
})

app.get('/login',auth, (req,res)=>{
    if(req.user) return res.redirect('/dashboard');
    res.render('login');
})

app.get('/games/:id',auth,(req,res)=>{
   
    let addReview = req.user ? true : false;

    Article.findById(req.params.id, (err, article)=>{
        if(err) res.status(400).send(err);

        UserReview.find({'postId':req.params.id}).exec((err,userReviews)=>{
            res.render('article',{
                date:moment(article.createdAt).format('MM/DD/YY'),
                article,
                review:addReview,
                userReviews
            });
        })
    })
})

app.get('/dashboard', auth, (req,res)=>{
    if(!req.user) return res.redirect('/login');
    res.render('dashboard',{
        dashboard: true,
        isAdmin: req.user.role === 1 ? true : false
    });
})

app.get('/dashboard/articles', auth, (req,res)=>{
    if(!req.user) return res.redirect('/login');
    res.render('admin_articles',{
        dashboard: true,
        isAdmin: req.user.role === 1 ? true : false
    });
})

app.get('/dashboard/reviews', auth, (req,res)=>{
    
    if(!req.user) return res.redirect('/login');
    UserReview.find({'ownerId':req.user._id}).exec((err, userReviews)=>{

        res.render('admin_reviews',{
            dashboard: true,
            isAdmin: req.user.role === 1 ? true : false,
            userReviews
        });
    })
})

app.get('/dashboard/logout',auth,(req,res)=>{

    req.user.deleteToken(req.token, (err, user)=>{
        if(err) return res.status(400).send(err);
        res.redirect('/');
    })
})
//POST

app.post('/api/register', (req,res)=>{
    
    const user = new User(req.body);

    user.save((err,doc)=>{
        if(err) return res.status(400).send(err)

        user.generateToken((err,user)=>{
            if(err) return res.status(400).send(err)
            res.cookie('auth',user.token).send('ok');
        })
    })

})

app.post('/api/login', (req,res)=>{
    
    User.findOne({'email': req.body.email}, (err,user)=>{
        if(!user) return res.status(400).json({message: 'Auth failed, wrong email!'});

        user.comparePassword(req.body.password, function(err, isMatch){
            if(err) throw err;
            if(!isMatch) return res.status(400).json({message: 'Auth failed, wrong password!'});

            user.generateToken((err,user)=>{
                if(err) return res.status(400).send(err)
                res.cookie('auth',user.token).send('ok');
            })
        })
    })
})


app.post('/api/add_articles', auth, (req,res)=>{

    const article = new Article({
        ownerUsername: req.user.username,
        ownerId: req.user._id,
        title: req.body.title,
        review: req.body.review,
        rating: req.body.rating
    });

    article.save((err,doc)=>{
        if(err) res.send(400).send(err);
        res.status(200).send();
    })

})

app.post('/api/user_review',auth,(req,res)=>{

    const userReview = new UserReview({
        postId: req.body.id,
        ownerUsername: req.user.username,
        ownerId: req.user._id,
        titlePost: req.body.titlePost,
        review: req.body.review,
        rating: req.body.rating
    });

    userReview.save((err,doc)=>{
        if(err) return res.status(400).send(err);
        res.status(200).send();
    })

})

app.listen(config.PORT , ()=>{
    console.log(`Started at port ${config.PORT}`);
})
