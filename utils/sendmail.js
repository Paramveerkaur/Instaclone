const nodemailer =require('nodemailer');

module.exports.send=function(to,subject,text){
    //create reusable  transporter object using the default SMTP transport
    let transporter =nodemailer.createTransport({
        host:'smtp.gmail.com',
        post:465,
        secure:true,//secure:true for port 465 , secure :false for port587
        auth:{
            user:'prog8165@gmail.com',
            pass:'Prog8165!'
        }
    });
    
    //setup emil data with unicode symbols
    let mailOptions={
        from:'"Instagram Clone"<prog8165@gmail.com>',//sender address
        to: to,//list of receivers
        subject: subject,//subject line
        text:text//plain text body
    };
    
    //send mail with the defined transport object
    transporter.sendMail(mailOptions,(error,info) => {
        if(error){
            return console.log(error);
        }
        console.log('Message %s send :%s',info.messageId,info.response);
    });
    }