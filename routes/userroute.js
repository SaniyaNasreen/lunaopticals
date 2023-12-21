
const express=require("express")
const user_route =express.Router()
const auth=require("../miidleware/auth")
const User=require("../models/usermodel")
const usercontroller= require("../controllers/usercontroller")
const { token } = require("morgan")

user_route.get('/',usercontroller.loadindex)
user_route.get('/shopdetails/:id', usercontroller.loaddetails);
user_route.get('/shoplist',usercontroller.loadsales)

// user management
user_route.get('/register',usercontroller.loadRegister)
user_route.post('/register',auth.isUser,usercontroller.insertUser)
user_route.get('/verify',usercontroller.verifymail)
user_route.get('/login',usercontroller.loginLoad)
user_route.post('/login',usercontroller.verifylogin)
user_route.get('/logout',usercontroller.userLogout); 

// Route for sending OTP via email
user_route.get('/forgotpassword', usercontroller.sendEmailOtp);
user_route.post('/forgotPassword',auth.isUser, usercontroller.loginotp);
user_route.get('/sendEmailOtp', usercontroller.sendEmailOtp);
user_route.get('/enterotp', usercontroller.enterOtpForm);
user_route.post('/verifyotp',auth.isUser, usercontroller.verifyotp);

//get forgetpassword page
user_route.get('/forget',usercontroller.forgetload)
user_route.post('/forget',usercontroller.forgetverify)
user_route.get('/forgetPassword',usercontroller.forgetpasswordload)
user_route.post('/forgetPassword',usercontroller.resetpassword)

//Product Related 
user_route.get("/search-product",  usercontroller.searchproduct);

// Cart Related
user_route.get('/add=to-cart/:id',usercontroller.Addcart);
user_route.get('/shopcart',auth.isUser, usercontroller.logincart)
user_route.get("/remove-from-cart/:id",auth.isUser,usercontroller.Removecart);
user_route.post('/update-cart',auth.isUser,usercontroller.Updatecart);

module.exports=user_route
