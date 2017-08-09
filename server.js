const dbUrl = 'mongodb://admin:jojo12345@ds127842.mlab.com:27842/asgndb';

//require statement-adds external modules from node modules or own defined modules
const http = require('http');
const path = require('path');

//express
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const Guid = require('guid');

//session
const session = require('express-session');
const mongoSession = require('connect-mongodb-session')(session);
const passport = require("passport");
const userAuth = require('./UserAuth.js');
const hash = require('./utils/hash.js');

//database related
const mongoose = require('mongoose');
const Post = require('./models/Post.js');
const User = require('./models/User.js');
const Like = require('./models/Like.js');
const PasswordReset = require('./models/PasswordReset.js');

//sendMail
const email = require('./utils/sendmail.js');

var router = express();
var server = http.createServer(router);

//establish hconnection to our mongodb instance
mongoose.connect(dbUrl);
mongoose.Promise = require('bluebird');

//create a session connection
var mongoSessionStore = new mongoSession({
  uri: dbUrl,
  collection: 'sessions'
});

mongoose.set('debug', true);

//tell the router(express) where to find the static files
router.use(express.static(path.resolve(__dirname, 'client')));
//router.use(express.bodyParser());

//tell the router to parse JSON data and put it into req.body
router.use(bodyParser.urlencoded({
  extended: true
}));
router.use(bodyParser.json());
//add session support
router.use(session({
  secret: process.env.SESSION_SECRET || 'mysecretKey',
  store: mongoSessionStore,
  resave: true,
  saveUninitialized: false
}));
//add passport for athentication support
router.use(passport.initialize());
router.use(passport.session());
userAuth.init(passport);
//add file upload support
router.use(fileUpload());

//tell the router how to handle a get request to the root
router.get('/', function(req, res) {

  res.sendFile(path.join(__dirname, 'client/view', 'signin.html'));
});

//tell the router how to handle a post request from the signin page
router.post('/signin', function(req, res, next) {
  //tell passport to attempt to authenticate the login
  passport.authenticate('login', function(err, user, info) {
    //callback returns here
    if (err) {
      //if error,say error
      res.json({
        isValid: false,
        message: 'internal error'
      });
    }
    else if (!user) {
      //if no user,say invalid login
      res.json({
        isValid: false,
        message: 'try again'
      });
    }
    else {
      req.logIn(user, function(err) {
        if (!err)
        //send a message to the client to say so
          res.json({
          isValid: true,
          message: 'welcome ' + user.email
        });

      });
    }
  })(req, res, next);
});

//tell the router how to handle a get request to the join page 
router.get('/join', function(req, res) {
  console.log('client requests join');
  res.sendFile(path.join(__dirname, 'client/view', 'join.html'));
});

//tell the router how to handle a post request to the join page
router.post('/join', function(req, res, next) {
  passport.authenticate('signup', function(err, user, info) {
    if (err) {
      res.json({
        isValid: false,
        message: 'internal error'
      });
      console.log('internal error');
    }
    else if (!user) {
      res.json({
        isValid: false,
        message: 'try again'
      });
      console.log('try again');
    }
    else {
      //log this user in since they've just joined
      req.logIn(user, function(err) {
        if (!err)
        //send a message to the client to say so
          res.json({
          isValid: true,
          message: 'welcome ' + user.email
        });
        console.log('welcome');
      });
    }
  })(req, res, next);
});

router.get('/passwordreset', (req, res) => {
  console.log('client requests passwordreset');
  res.sendFile(path.join(__dirname, 'client/view', 'passwordreset.html'));
});


//post method of Password reset
router.post('/passwordreset', (req, res) => {
  Promise.resolve()
    .then(function() {
      //see if there's a user with this email
      return User.findOne({
        'email': req.body.email
      });
    })
    .then(function(user) {
      if (user) {
        var pr = new PasswordReset();
        pr.userId = user.id;
        pr.password = hash.createHash(req.body.password);
        pr.expires = new Date(new Date()).getTime(+(20 * 60 * 1000));
        pr.save()
          .then(function(pr) {
            if (pr) {
              console.log('pr.id ' + pr.id);
              email.send(req.body.email, 'password reset', 'https://clone-insta-paramveerjamhal.c9users.io/verifypassword?id=' + pr.id);
            }
          });
      }else{
        console.log("User");
      }
    });
});


router.get('/verifypassword', function(req, res) {
  var password;
  Promise.resolve()
    .then(function() {
      console.log(req.query.id);
      return PasswordReset.findOne({
        _id: req.query.id
      });
      //return PasswordReset.find();
    })
    .then(function(pr) {
      console.log('I sam pr ' + pr);
      if (pr) {
        console.log(pr.expires < new Date())
        if (pr.expires < new Date()) {
            console.log("e")
          password = pr.password;
          console.log('pr user Id ' + pr.userId);
          //see if there's a user with this email
          return User.findOne({
            _id : pr.userId
          });
        }
      }
    })
    .then(function(user) {
      console.log('userrrr verify password user ' + user);
      if (user) {
        user.password = password;

        user.save();
      //  res.redirect('https://www.google.com');
      res.sendFile(path.join(__dirname, 'client/view', 'signin.html'));
     // res.Write("<script>alert('sucessfull');</script>");
      }
    });
});


router.get('/posts', userAuth.isAuthenticated, function(req, res) {
  console.log('client request posts.html');
  res.sendFile(path.join(__dirname, 'client', 'home.html'));
});

router.post('/posts', function(req, res) {
  console.log('client request postslist');
  Post.find({})
    .then(function(paths) {
      res.json(paths);
    });
});


//tell the router how to handle a post request to upload a file
router.post('/upload', userAuth.isAuthenticated, function(req, res) {
  var response = {success: false, message: ''};
   if (req.files){
    // The name of the input field is used to retrieve the uploaded file 
    var userPhoto = req.files.userPhoto;
   /* var userComment=req.files.userComment;*/
    //invent a unique file name so no conflicts with any other files
    var guid = Guid.create();
    //figure out what extension to apply to the file
    var extension = '';
    switch(userPhoto.mimetype){
      case 'image/jpeg':
        extension = '.jpg';
        break;
      case 'image/png':
        extension = '.png';
        break;
      case 'image/bmp':
        extension = '.bmp';
        break;
      case 'image/gif':
        extension = '.gif';
        break;
    }
    
    
     //if we have an extension, it is a file type we will accept
    if (extension){
      //construct the file name
      var filename = guid + extension;
      // Use the mv() method to place the file somewhere on your server 
      userPhoto.mv('./client/img/' + filename, function(err) {
        //if no error
        if (!err){
          //create a post for this image
          var post = new Post();
          post.userId = req.user.id;
          post.image = './img/' + filename;
          post.likeCount = 0;
          post.comment = '';
          post.feedbackCount = 0;
          //save it
          post.save()
          .then(function(){
            res.json({success: true, message: 'all good'});            
          });
        } else {
          response.message = 'internal error';
          res.json(response);
        }
      });
    } else {
      response.message = 'unsupported file type';
      res.json(response);
    }
  } else {
    response.message = 'no files';
    res.json(response);
  }
});

//tell the router how to handle a post request to /posts
//only do this if this is an authenticated user
router.post('posts',userAuth.isAuthenticated, function(req,res){
  console.log('client requests posts list');
  var thesePosts;
  //go find all the posts in the database
  Post.find({})
  .then(function(posts)
  {
    thesePosts=posts;
    var promises=[];
    thesePosts.forEach(function(post){
      promises.push(
        Promise.resolve()
        .then(function(){
          return Like.findOne({userId:req.user.id,postId:post._id});
        })
        .then(function(like){
          post._doc.isLiked=like ? true:false;
        }));
      });
return Promise.all(promises);
})
.then(function(){
  //send them to the client in JSON format
  res.json(thesePosts);
});
});

//tell the router how to handle a post reuest to /incrLike
router.post('/incrLike',userAuth.isAuthenticated,function(req,res){
  console.log('increment like for '+req.body.id+' by user '+req.user.email);
  Like.findOne({userId:req.user.id,postId:req.body._id})
  .then(function(like){
    if(!like){
    //go get the post record
    Post.findById(req.body.id)
    .then(function(post){
      //increment the like count
      post.likeCount++;
      //save the record back to teh database
      return post.save(post);
  })
  .then(function(post){
    var like=new Like();
    like.userId=req.user.id;
    like.postId=req.body.id;
    like.save();
    //a successful save returns back the updated object
    res.json({id:req.body.id,count:post.likeCount});
     });
  }
  else
  {
    res.json({id:req.body.id,count:-1});
  }
})
.catch(function(err)
{
  console.log(err);
})
});

//set up the http server and start it running
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
