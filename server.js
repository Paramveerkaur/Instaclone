
const dbUrl='mongodb://admin:jojo12345@ds127842.mlab.com:27842/asgndb';

//require statement-adds external modules from node modules or own defined modules
const http = require('http');
const path = require('path');

//express
const express = require('express');
const bodyParser=require('body-parser');

//session
const session=require('express-session');
const mongoSession=require('connect-mongodb-session')(session);
const passport=require("passport");
const userAuth=require('./UserAuth.js');
const hash=require('./utils/hash.js');

//database related
const mongoose = require('mongoose');
const Post = require('./models/Posts.js');
const User=require('./models/User.js');
const Like=require('./models/Like.js');
const PasswordReset=require('./models/PasswordReset.js');

//sendMail
const email=require('./utils/sendmail.js');


var router = express();
var server = http.createServer(router);

//establish hconnection to our mongodb instance
mongoose.connect(dbUrl);
mongoose.Promise = require('bluebird');

//create a session connection
var mongoSessionStore=new mongoSession({
  uri:dbUrl,
  collection:'sessions'
});

mongoose.set('debug', true);


/*var post=new Post({
  image:'./img/priyanka-baywatch.jpg',
  comment:'cool baywatch wallpaper',
  likeCount: 0,
  feedbackCount: 0
});

post.save(function(err)
{
  if(err){
    console.log(err);
  }
  else
  console.log('posted');
});
*/

//tell the router(express) where to find the static files
router.use(express.static(path.resolve(__dirname, 'client')));
//router.use(express.bodyParser());

//tell the router to parse JSON data and put it into req.body
router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json());
//add session support
router.use(session({
  secret:process.env.SESSION_SECRET||'mysecretKey',
  store:mongoSessionStore,
  resave:true,
  saveUninitialized:false
}));
//add passport for athentication support
router.use(passport.initialize());
router.use(passport.session());
userAuth.init(passport);

/*router.get('/', function(req, res) {
  console.log('client request posts.html');
  res.sendfile(path.join(__dirname, 'client', 'index.html'));
});*/

/*router.post('/posts', function(req, res) {
  console.log('client request postslist');

  Post.find({})
    .then(function(paths) {
      res.json(paths);
    });
});*/

//tell the router how to handle a get request to the root
router.get('/', function(req, res) {
  console.log('client request root');
  res.sendFile(path.join(__dirname, 'client/view', 'signin.html'));
});

//tell the router how to handle a post request from the signin page
router.post('/signin', function(req,res,next) {
  //tell passport to attempt to authenticate the login
  passport.authenticate('login',function(err,user,info){
    //callback returns here
    if(err){
      //if error,say error
      res.json({isValid:false,message:'internal error'});
    }
    else if(!user)
    {
      //if no user,say invalid login
      res.json({isValid:false,message:'try again'});
    }
    else
    {
     req.logIn(user,function(err){
      if(!err)
        //send a message to the client to say so
        res.json({isValid:true,message:'welcome '+user.email});
      
    });
  }
  })(req,res,next);    
});

//tell the router how to handle a get request to the join page 
   router.get('/join',function(req,res){
     console.log('client requests join');
     res.sendFile(path.join(__dirname,'client/view','join.html'));
   });
   
   //tell the router how to handle a post request to the join page
   router.post('/join',function(req,res,next)
   {
     passport.authenticate('signup',function(err,user,info)
     {
       if(err){
         res.json({isValid:false,message:'internal error'});
           console.log('internal error');
       }
       else if(!user)
       {
         res.json({isValid:false,message:'try again'});
           console.log('try again');
       }
       else
       {
         //log this user in since they've just joined
         req.logIn(user,function(err)
         {
           if(!err)
           //send a message to the client to say so
            res.json({isValid:true,message:'welcome '+user.email});
              console.log('welcome');
         });
       }
        })(req,res,next);
   });
   
   router.get('/passwordreset',(req,res) =>{
     console.log('client requests passwordreset');
     res.sendFile(path.join(__dirname,'client/view','passwordreset.html'));
   });
   
   
   router.post('/passwordreset',(req,res) =>
   Promise.reslove()
   .then(function(){
     //see if there's a user with this email
     console.log("hiiiiiiiiiiiiiiiiiiiiiiii");
     return User.findOne({'email':req.body.email});
    
   })
   .then(function(user)
   {
     if(user){
       var pr=new PasswordReset();
       pr.userid=user.id;
       pr.password=hash.createHash(req.body.password);
       console.log("Password Reset");
       pr.expires=new Date(new Date()).getTime(+(20*60*1000));
       pr.save()
       .then(function(pr)
       {
         email.send(req.body.email,'password reset','https://clone-insta-paramveerjamhal.c9users.io/verifypassword?id=' +pr.id);
       
       });
     }
   })
   );
   
   
   
   router.get('/verifypassword',function(req, res) {
       var password;
       Promise.resolve()
       .then(function(){
         return PasswordReset.findOne({id:req.body.id});
       })
       .then(function(pr){
         if(pr){
           if(pr.expires > new Date()){
             password=pr.password;
             //see if there's a user with this email
             return User.findOne({id:pr.userId});
           }
         }
       })
       .then(function(user)
       {
         if(user){
           user.password=password;
           return user.save();
         }
       });
   });


router.get('/posts',userAuth.isAuthenticated,function(req, res) {
  console.log('client request posts.html');
  res.sendFile(path.join(__dirname,'client', 'home.html'));
});

router.post('/posts', function(req, res) {
  console.log('client request postslist');

  Post.find({})
    .then(function(paths) {
      res.json(paths);
    });
});


//tell the router how to handle a get request to the posts page
//only in case of authenticated user
/*router.get('/posts',userAuth.isAthenticated,function(req,res){
  console.log('client requests posts.html');
  //use sendfile to send our posts.html file
  res.sendFile(path.join(__dirname,'client','index.html'));
});*/





//tell the router how to handle a post request to /posts
//only do this if this is an authenticated user
/*router.post('posts',userAuth.isAuthenticated, function(req,res){
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
          return Like.findOne({userId:req.user.id,postId:post.id})
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
})
});*/

/*//tell the router how to handle a post reuest to /incrLike
router.post('/incrLike',userAuth.isAuthenticated,function(req,res){
  console.log('increment like for '+req.body.id+' by user '+req.user.email);
  
  Like.findOne({userId:req.user.id,postId:req.body.id})
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
     })
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
});*/

/*router.post('/incrLike', function(req, res) {
  console.log('increment like posts' + req.body.id);
  Post.findById(req.body.id)
    .then(function(post) {
      post.likeCount++;
      return post.save(post);
    })
    .then(function(post) {
      res.json({
        id: req.body.id,
        count: post.likeCount
      });
    })
    .catch(function(err) {
      console.log(err);
    })
});
*/

//set up the http server and start it running
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
