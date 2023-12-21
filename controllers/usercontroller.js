const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const config = require("../config/config");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { name } = require("ejs");
const crypto = require("crypto");

//..................bcrypt.......................   //
const securepassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//............................for send mail............................//
const sendverifymail = async (name, email, user_id) => {
  try {
    const token = crypto.randomBytes(20).toString("hex");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOption = {
      from: "saniyanasreen262@gmail.com",
      to: email,
      subject: "For varification mail",
      html:
        '<p>Please click here to <a href="http://localhost:4000/verify?token=' +
        token +
        '">Verify</a> your email.</p>',
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        next(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    });
  } catch (error) {
    next(error);
  }
};

//...................Sending Mail for Reset Password....................//
const sendresetpasswordmail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "saniyanasreen262@gmail.com", // Use environment variables
        pass: "bbksxhldfudkmbkd", // Use environment variables
      },
    });
    const mailOption = {
      from: "saniyanasreen262@gmail.com",
      to: email,
      subject: "For Reset Password",
      html:
        "<p>Hy " +
        name +
        ',please click here to <a href="http://localhost:4000/forgetPassword?token=' +
        token +
        ' "> Reset </a> your password.</p> ',
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        next(error);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    });
  } catch (error) {
    next(error);
  }
};

//.........................Load Login Page.......................... //
const loginLoad = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      res.render("users/login");
    }else{
      res.redirect('/')
    }
  } catch (error) {
    next(error);
  }
};

//............................Veryfying Login.......................//
const verifylogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (!userData) {
      res.render("users/login", { message: "No User Found" });
      return;
    }
    if (userData.is_blocked) {
      res.render("users/login", {
        message: "Your account has been blocked due to some reasons",
      });
      return;
    }
    if (userData.is_admin === 1) {
      res.render("users/login", { message: "This is not user account" });
      // res.render("admin/indexhome");
      return;
    }
    const passwordmatch = await bcrypt.compare(password, userData.password);
    if (!passwordmatch) {
      res.render("users/login", { message: "Password incorrect" });
      return;
    }
    req.session.user_id = userData._id;
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

//......................Load Home Page..............................//
const loadindex = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      const categories = await Category.find({ listed: true }).limit(2);
      const products = await Product.find({ listed: true });
      let isUserLoggedIn = false;
      if (req?.session?.user_id) {
        isUserLoggedIn = true;
      }

      res.render("users/indexhome", {
        categories,
        products,
        is_blocked: false,
        isUserLoggedIn,
      });
    } else if (req.session.user_id) {
      const categories = await Category.find({ listed: true }).limit(2);
      const products = await Product.find({ listed: true });
      let isUserLoggedIn = false;
      if (req?.session?.user_id) {
        isUserLoggedIn = true;
      }
      const email = req.session.user_id;
      const userData = await User.findOne({ _id: email });
      if (userData) {
        if (userData.is_blocked === false) {
          res.render("users/indexhome", {
            categories,
            products,
            is_blocked: false,
            isUserLoggedIn,
          });
        } else {
          res.render("users/login", {
            message: "Your account has been blocked due to some reasons",
          });
        }
      }
    }
  } catch (error) {
    next(error);
  }
};

//.....................load shoplist................................//
const loadsales = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }

    let sortOption = {};
    const sortQuery = req.query.sort;
    if (sortQuery === "price_asc") {
      sortOption = { price: 1 };
    } else if (sortQuery === "price_desc") {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    let filter = { listed: true };
    if (req.query.category) {
      const category = await Category.findOne({
        name: req.query.category,
      }).sort(sortOption);

      if (category) {
        filter.category = category._id;
      } else {
        const allProducts = await Product.find({ listed: true }).sort(
          sortOption
        );
        return res.render("users/shoplist", {
          products: allProducts,
          isUserLoggedIn,
          is_blocked: false,
        });
      }
    }

    const products = await Product.find(filter)
      .populate("category")
      .sort(sortOption);
    res.render("users/shoplist", {
      products,
      isUserLoggedIn,
      is_blocked: false,
      selectedSort: sortQuery,
    });
  } catch (error) {
    next(error);
  }
};

//.......................load register page ...........................//
const loadRegister = async (req, res) => {
  try {
    return res.render("users/registration");
  } catch (error) {
    next(error);
  }
};

//..........................Registering User............................//
const insertUser = async (req, res, next) => {
  try {
    if (req.body.password !== req.body.confirm_password) {
      res.render("/registration", {
        message: "Password and Confirm Password do not match",
      });
      return;
    }

    const { email, mobile } = req.body;
    const existingemail = await User.findOne({ email });
    if (existingemail) {
      res.render("users/registration", {
        errorMessage: "Email already exists",
      });
    }

    const existingmobile = await User.findOne({ mobile });
    if (existingmobile) {
      res.render("users/registration", {
        errorMessage: "Mobile already exists",
      });
    }

    const existingUser = await User.findOne({
      $and: [{ email: email }, { mobile: mobile }],
    });
    if (existingUser) {
      res.render("users/registration", {
        errorMessage: "Email and Mobile already exist together",
      });
    }

    const spassword = await securepassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      cpassword: spassword,
      country: req.body.country,
      is_admin: 0,
    });

    const userData = await user.save();
    if (!userData) {
      res.render("/registration", {
        message: "Your registration has been failed",
      });
    }

    sendverifymail(req.body.name, req.body.email, userData._id);
    res.render("users/login", {
      message:
        "Your regestration has been susseccfull,please verify your mail.",
    });
  } catch (error) {
    next(error);
  }
};

//....................Loading Single Product Page........................//
const loaddetails = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }

    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      const error = "Product not found";
      error.statusCode = 404;
      throw error;
    }

    return res.render("users/shopdetails", { product, isUserLoggedIn });
  } catch (error) {
    next(error);
  }
};

//.................................User Logout............................//
const userLogout = async (req, res, next) => {
  try {
    req.session.user_id = null;
    console.log("Hi");
    res.clearCookie("session_id");
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

//...................Loading Page to Sent OTP..............................//
const sendEmailOtp = async (req, res, next) => {
  try {
    res.render("users/emailOTP", { message: "" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//.....................Loading Page for Entering OTP.......................//
const enterOtpForm = async (req, res, next) => {
  try {
    res.render("users/enterotp", { message: "" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//..........................Sending OTP to Email.............................//
const generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000);
};
const emailOtp = (email, OTP) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
      },
    });
    const mailOptions = {
      from: "jafferkuwait0916@gmail.com",
      to: email,
      subject: "OTP Verification",
      text: `DO NOT SHARE: Your OTP is ${OTP}`,
    };
    transporter
      .sendMail(mailOptions)
      .then((info) => {
        console.log("Email sent: " + info.response);
        resolve(info);
      })
      .catch((error) => {
        console.error("Error sending OTP: " + error.message);
        reject(error);
      });
  });
};

//..............Sending OTP and rendering the form to enter OTP...............//
const loginotp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      res.render("users/emailOTP", { message: "User email is incorrect" });
      return;
    }

    if (userData.is_varified !== 0) {
      res.render("users/emailOTP", { message: "Please verify your mail" });
    }

    const OTP = generateOTP();
    await User.updateOne({ email }, { $set: { token: OTP } });
    emailOtp(email, OTP);
    res.render("users/enterotp", {
      message: "Please check your mail for OTP",
      email,
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

//...............................Checking OTP..................................//
const verifyotp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.render("users/login", { message: "User not found" });
      return;
    }
    const generatedOTP = user.token;
    if (otp !== generatedOTP) {
      res.render("users/enterotp", { message: "The OTP is incorrect" });
      return;
    }
    return res.redirect("/");
  } catch (error) {
    console.error("Error:", error.message);
    next(error);
  }
};

//................Loading Page for Sending Mail To Reset Password................//
const forgetload = async (req, res) => {
  try {
    res.render("users/forget");
  } catch (error) {
    console.error("Error rendering forget password form:", error);
    next(error);
  }
};

//......................Sending Email for resetpassword..........................//
const forgetverify = async (req, res, next) => {
  try {
    email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (!userData) {
      res.render("users/forget", { message: "User email is incorrect" });
      return;
    }

    if (userData.is_varified === 0) {
      res.render("users/forget", { message: "Please verify your mail" });
      return;
    }

    const randomString = randomstring.generate();
    const updateData = await User.updateOne(
      { email: email },
      { $set: { token: randomString } }
    );
    sendresetpasswordmail(userData.name, userData.email, randomString);
    res.render("users/forget", {
      message: "please check your mail to reset your password.",
    });
  } catch (error) {
    next(error);
  }
};

//......................... Verifying Mail after register.........................//
const verifymail = async (req, res, next) => {
  try {
    const updateinfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_varified: 1 } }
    );
    res.render("users/emailvarified");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//......................Loading page for Reset Password.............................//
const forgetpasswordload = async (req, res, next) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });

    if (!tokenData) {
      res.render("404", { message: "Token is invalid." });
      return;
    }
    res.render("users/forgetPassword", { user_id: tokenData._id });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

//................................Reseting Password...................................//
const resetpassword = async (req, res, next) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securepassword(password);
    const updateData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } }
    );
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

//................................Search Product.........................................//
const searchproduct = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const searchquery = req.query.search || "";
    const filterByCategory = req.query.category || "";
    let sortOption = {};
    const sortQuery = req.query.sort;

    if (sortQuery === "price-low-to-high") {
      sortOption = { price: 1 };
    } else if (sortQuery === "price-high-to-low") {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    let productData;
    if (filterByCategory) {
      productData = await Product.find({
        $and: [
          {
            $or: [
              { name: { $regex: searchquery, $options: "i" } },
              { brand: { $regex: searchquery, $options: "i" } },
              { description: { $regex: searchquery, $options: "i" } },
            ],
          },
          { category: filterByCategory },
        ],
      }).sort(sortOption);
    } else {
      productData = await Product.find({
        $or: [
          { name: { $regex: searchquery, $options: "i" } },
          { brand: { $regex: searchquery, $options: "i" } },
          { description: { $regex: searchquery, $options: "i" } },
        ],
      }).sort(sortOption);
    }

    res.render("users/shoplist", {
      products: productData,
      isUserLoggedIn,
      searchquery,
      category: filterByCategory,
      sort: sortQuery,
    });
  } catch (error) {
    next(error);
  }
};

//.............................Adding cart from Home......................................//
const Addcart = async (req, res, next) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      console.error("Product not found");
      return res.status(404).send("Product not found");
    }

    const userId = req.session.user_id;
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    const productToAdd = {
      product: productId,
      quantity: 1,
    };
    const updatedUser = await User.updateOne(
      { _id: userId },
      {
        $addToSet: { cart: productToAdd },
      },
      { upsert: true }
    );
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    await user.save();
    console.log("Product added to cart successfully", updatedUser);
    return res.status(200).send("Product added to cart successfully");
  } catch (error) {
    next(error);
  }
};

//.................................Loading Cart Page.....................................//
const logincart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("cart.product");
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    if (user?.cart?.length <= 0) {
      res.render("users/shopcart", {
        user,
        isUserLoggedIn: true,
        emptyCart: true,
      });
      return;
    }
    res.render("users/shopcart", { user, isUserLoggedIn: true });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return res.status(500).send("Internal Server Error");
  }
};

//..................................Removing Item from Cart................................//
const Removecart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { cart: { product: productId } } },
      { new: true }
    );
    res.redirect("/shopcart");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//...........................Updating Cart Quantity......................................//
const Updatecart = async (req, res, next) => {
  const { product_id, updateQuantity } = req.body;
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const productInCart = user.cart.find(
      (item) => item.product.toString() === product_id
    );
    if (!productInCart) {
      return res.status(404).send("Product not found in user cart");
    }

    let newQuantity = productInCart.quantity;
    if (updateQuantity === "increase") {
      newQuantity++;
    } else if (updateQuantity === "decrease" && newQuantity > 1) {
      newQuantity--;
    }
    productInCart.quantity = newQuantity;
    await user.save();

    return res.redirect("/shopcart"); 
  } catch (error) {
    console.error("Error updating quantity:", error);
    next(error);
  }
};

//.......................................Exports...........................................//
module.exports = {
  loadindex,
  loadsales,
  loadRegister,
  insertUser,
  verifymail,
  loginLoad,
  loaddetails,
  verifylogin,
  enterOtpForm,
  verifyotp,
  loginotp,
  loginLoad,
  sendEmailOtp,
  emailOtp,
  userLogout,
  forgetload,
  forgetverify,
  forgetpasswordload,
  resetpassword,
  searchproduct,
  logincart,
  Addcart,
  Removecart,
  Updatecart,
};
