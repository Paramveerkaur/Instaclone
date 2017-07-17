var mongoose=require('mongoose');

//we are building a POST object model in mongoose that we will use elsewhere
module.exports=mongoose.model('PasswordReset',{
    userId:String,
    password:String,//this will be the hashed value of the password
    expires:Date
});