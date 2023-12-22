const express = require("express");
const user_route = express.Router();
const auth = require("../miidleware/auth");
const User = require("../models/usermodel");
const usercontroller = require("../controllers/usercontroller");
const { token } = require("morgan");

user_route.get("/", usercontroller.loadIndex);
user_route.get("/shop-details/:id", usercontroller.loadSingleProduct);
user_route.get("/shop-list", usercontroller.loadProductList);

// user management
user_route.get("/register", usercontroller.loadRegister);
user_route.post("/register", auth.isUser, usercontroller.insertUser);
user_route.get("/verify", usercontroller.verifyMail);
user_route.get("/login", usercontroller.loginLoad);
user_route.post("/login", usercontroller.verifyLogin);
user_route.get("/logout", usercontroller.userLogout);

// Route for sending OTP via email
user_route.get("/forgotpassword", usercontroller.sendEmailOtp);
user_route.post("/forgotPassword", auth.isUser, usercontroller.loginOtp);
user_route.get("/send-email-otp", usercontroller.sendEmailOtp);
user_route.get("/enter-otp", usercontroller.enterOtpForm);
user_route.post("/verify-otp", auth.isUser, usercontroller.verifyOtp);

//get forgetpassword page
user_route.get("/forget-password", usercontroller.loadForget);
user_route.post("/forget-password", usercontroller.verifyForgetPassword);
user_route.get("/reset-password", usercontroller.loadForgetPassword);
user_route.post("/reset-password", usercontroller.resetPassword);

//Product Related
user_route.get("/search-product", usercontroller.searchProduct);
// user_route.get("/product-pagination", usercontroller.productPagination);

// Cart Related
user_route.get("/add-to-cart/:id", usercontroller.addCart);
user_route.get("/shop-cart", auth.isUser, usercontroller.loginCart);
user_route.get("/remove-from-cart/:id", auth.isUser, usercontroller.removeCart);
user_route.post("/update-cart", auth.isUser, usercontroller.updateCart);

module.exports = user_route;
