var mongoose=require('mongoose');

//we are building a LIKE object model in mongoose that we will use elsewhere
module.exports=mongoose.model('Like',{
    userId:String,
    postId:String});
