//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var express = require('express');
var mongoose = require('mongoose');
var Post = require('./models/Posts.js');
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);

mongoose.connect('mongodb://admin:jojo12345@ds127842.mlab.com:27842/asgndb');

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

router.use(express.static(path.resolve(__dirname, 'client')));
router.use(express.bodyParser());

router.get('/', function(req, res) {
  console.log('client request posts.html');
  res.sendfile(path.join(__dirname, 'client', 'index.html'));
});

router.post('/posts', function(req, res) {
  console.log('client request postslist');

  Post.find({})
    .then(function(paths) {
      res.json(paths);
    });
});

router.post('/incrLike', function(req, res) {
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


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
