 require('dotenv').config();

module.exports={
    sessionsecret:process.env.secret,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS 
}