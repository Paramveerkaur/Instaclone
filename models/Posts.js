var mongoose =require('mongoose');

module.exports=mongoose.model('Post',{
   userId: String,
   image: String,
   comment: String,
   likeCount: Number,
   feedbackCount: Number
});