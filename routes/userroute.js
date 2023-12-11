
const express=require("express")
const user_route =express.Router()
// const config=require('../config/config')
const auth=require("../miidleware/auth")
const User=require("../models/usermodel")
const usercontroller= require("../controllers/usercontroller")
const { token } = require("morgan")

user_route.get('/indexhome',usercontroller.loadindex)
user_route.get("/shopdetails", usercontroller.loaddetails); 
user_route.get('/shopdetails/:id', usercontroller.loaddetails);
user_route.get('/categories', usercontroller.getCategories);
user_route.get('/shoplist',usercontroller.loadsales)
user_route.get('/unisex',usercontroller.loadunisex)
user_route.get('/men',usercontroller.loadmen)
user_route.get('/women',usercontroller.loadwomen)
user_route.get('/register',usercontroller.loadRegister)
user_route.post('/register',usercontroller.insertUser)
user_route.get('/verify',usercontroller.verifymail)
user_route.get('/',auth.isLogout,usercontroller.loginLoad)
user_route.get('/login',auth.isLogin,usercontroller.loginLoad)
user_route.post('/login',usercontroller.verifylogin)
user_route.get('/home',auth.isLogin,usercontroller.loadHome)
  
user_route.get('/logout', auth.isLogout,usercontroller.userLogout); 
user_route.get('/forgotPassword', usercontroller.sendEmailOtp);
// user_route.post('/forgotPassword', usercontroller.emailOtp);
user_route.post('/forgotPassword', usercontroller.loginotp);
// Route for sending OTP via email
user_route.get('/sendEmailOtp', usercontroller.sendEmailOtp);

// Route for rendering the OTP entry form
user_route.get('/enterotp', usercontroller.enterOtpForm);

user_route.post('/verifyotp', usercontroller.verifyotp);
 
user_route.get('/forget',auth.isLogout,usercontroller.forgetload)
user_route.post('/forget',usercontroller.forgetverify)
user_route.get('/forgetPassword',auth.isLogout,usercontroller.forgetpasswordload)
user_route.post('/forgetPassword',auth.isLogout,usercontroller.resetpassword)

user_route.get('/api/users', async (req, res) => {
    try {
        // Fetch only listed users from the database
        const listedUsers = await User.find({ listed: true });

        // Send the listed users to the frontend
        res.json(listedUsers);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

user_route.get("/search-product",  usercontroller.searchproduct);

module.exports=user_route
