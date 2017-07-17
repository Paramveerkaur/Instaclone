const bcrypt=require('bcrypt-nodejs');

module.exports.createHash=function(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(10),null);
};

module.exports.isValid=function(user,password){
    return bcrypt.compareSync(password,user.password);
};
