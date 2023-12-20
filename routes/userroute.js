
const express=require("express")
const user_route =express.Router()
// const config=require('../config/config')
const auth=require("../miidleware/auth")
const User=require("../models/usermodel")
const usercontroller= require("../controllers/usercontroller")
const { token } = require("morgan")

user_route.get('/',usercontroller.loadindex)
user_route.get("/shopdetails", usercontroller.loaddetails); 
user_route.get('/shopdetails/:id', usercontroller.loaddetails);
user_route.get('/categories', usercontroller.getCategories);
user_route.get('/shoplist',usercontroller.loadsales)
 
user_route.get('/register',usercontroller.loadRegister)
user_route.post('/register',usercontroller.insertUser)
user_route.get('/verify',usercontroller.verifymail)
user_route.get('/login',usercontroller.loginLoad)
user_route.post('/login',usercontroller.verifylogin)
 
user_route.get('/logout',usercontroller.userLogout); 
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
// Logging in the addcart route to debug
user_route.get('/add=to-cart/:id', async (req, res, next) => {
    console.log('Received request to add product to cart:', req.params.id);
    try {
      await usercontroller.addcart(req, res, next);
    } catch (error) {
      console.error('Error handling addcart request:', error);
      next(error);
    }
  });
user_route.get('/shopcart',usercontroller.logincart)

user_route.get("/remove-from-cart/:id", async (req, res) => {
  try {
    console.log(req.session);
    if (!req.session.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const email = req.session.user_id;
    const  productId  = req.params.id;

    const user = await User.findOne({ _id: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const indexToRemove = user.cart.findIndex(item => item.product.toString() === productId);

    if (indexToRemove === -1) {
      return res.status(404).json({ message: "Item not found in the cart" });
    }

    user.cart.splice(indexToRemove, 1);
    await user.save();

    //  res.status(200).json({ message: "Item removed successfully" });
    res.redirect("/shopcart")
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
user_route.post('/update-cart', async (req, res) => {
  const { product_id, updateQuantity } = req.body;

  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    const foundProductIndex = user.cart.findIndex(item => item.product.toString() === product_id);

    if (foundProductIndex === -1) {
      return res.status(404).send('Product not found in user cart');
    }

    let newQuantity = user.cart[foundProductIndex].quantity;

    if (updateQuantity === 'increase') {
      newQuantity++;
    } else if (updateQuantity === 'decrease' && newQuantity > 1) {
      newQuantity--;
    }

    user.cart[foundProductIndex].quantity = newQuantity;
    await user.save();

    return res.redirect('/shopcart'); // Redirect to cart or wherever needed
  } catch (error) {
    console.error('Error updating quantity:', error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports=user_route
