//we have to mongoose module because  we will create a mongoose model for our post
var mongoose =require('mongoose');

//we are building a post object model in mongoose that we will use elsewhere
module.exports=mongoose.model('User',{
    email:String,
    password:String //this will be the hashed value of the password
});