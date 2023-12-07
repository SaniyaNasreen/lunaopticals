

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
user_route.get('/login',auth.isLogout,usercontroller.loginLoad)
user_route.post('/login',usercontroller.verifylogin)
user_route.get('/home',auth.isLogin,usercontroller.loadHome)
user_route.get('/logout',auth.isLogin,usercontroller.userLogout)
user_route.get('/forgotPassword', usercontroller.sendEmailOtp);
// user_route.post('/forgotPassword', usercontroller.emailOtp);
user_route.post('/forgotPassword', usercontroller.loginotp);
// Route for sending OTP via email
user_route.get('/sendEmailOtp', usercontroller.sendEmailOtp);

// Route for rendering the OTP entry form
user_route.get('/enterotp', usercontroller.enterOtpForm);

user_route.post('/verifyotp', usercontroller.verifyotp);
// Route for setting the EnterOTP session
// user_route.get('/setEnterOtp', (req, res) => {
//   req.session.enterotp = true;
//   console.log('Session EnterOTP set:', req.session.enterotp); // Add log for debugging
//   res.redirect('/verifyotp');
// });

// Route for rendering the OTP verification form
// user_route.get('/verifyotp', (req, res) => {
//   if (req.session.enterotp) {
//     res.render('enterotp'); // Render your OTP verification form here
//   } else {
//     res.redirect('/emailOTP'); // Redirect to the OTP entry form if session is not set
//   }
// });

// user_route.post('/verifyotp', async (req, res) => {
//     console.log('Reached the verifyotp route');
//     try {
//         const { email,otp} = req.body;
//         const user = await User.findOne({ email });
//         if (!user) {
//           // Handle case where user is not found
//           return res.redirect('/enterotp');
//       }
//       console.log(generatedOTP);
//       console.log(enteredOTP);
//       if ( generatedOTP !== enteredOTP) {
//         // Handle case where user is not found or OTP doesn't match
//         return res.redirect('/enterotp');
//       } // Redirect to the appropriate route after successful OTP verification
//       return res.redirect('/indexhome');
 
//     } catch (error) {
//       // Handle other potential errors
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//     }
//   });
// Route for handling login OTP submission
// user_route.post('/loginotp', async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.body.email });

//     if (!user || user.token !== req.body.otp) {
//       // Handle invalid OTP scenario, maybe redirect back to the OTP verification form
//       return res.redirect('/enterotp');
//     }

//     // Redirect to the indexhome page after successful OTP verification
//     return res.redirect('/indexhome');
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });
 

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

 

module.exports=user_route
