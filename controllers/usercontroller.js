const User = require("../models/usermodel");

const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const config = require("../config/config");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const securePassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerifyMail = async (name, email, user_id) => {
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

const loadRegister = async (req, res) => {
  try {
    return res.render("users/registration");
  } catch (error) {
    next(error);
  }
};

const insertUser = async (req, res, next) => {
  try {
    if (req.body.password !== req.body.confirm_password) {
      res.render("users/registration", {
        errorWith: "PASSWORD",
        message: "Password and Confirm Password do not match",
      });
      return;
    }

    const { email, mobile } = req.body;
    const existingemail = await User.findOne({ email });
    if (existingemail) {
      res.render("users/registration", {
        errorWith: "EMAIL",
        message: "Email already exists",
      });
    }

    const existingmobile = await User.findOne({ mobile });
    if (existingmobile) {
      res.render("users/registration", {
        errorWith: "MOBILE",
        message: "Mobile already exists",
      });
    }

    const existingUser = await User.findOne({
      $and: [{ email: email }, { mobile: mobile }],
    });
    if (existingUser) {
      res.render("users/registration", {
        errorWith: "EMAIL",
        errorMessage: "Email and Mobile already exist together",
      });
    }

    const spassword = await securePassword(req.body.password);
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
        errorWith: "USER",
        message: "Your registration has been failed",
      });
    }

    sendVerifyMail(req.body.name, req.body.email, userData._id);
    res.redirect(
      "/login?message=Your%20registration%20has%20been%20successful.%20Please%20verify%20your%20email."
    );
  } catch (error) {
    next(error);
  }
};

const verifyMail = async (req, res, next) => {
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

const loginLoad = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/");
    } else {
      res.render("users/login");
    }
  } catch (error) {
    next(error);
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (!userData) {
      res.render("users/login", {
        errorWith: "USER",
        message: "No User Found",
      });
      return;
    }
    if (userData.is_blocked) {
      res.render("users/login", {
        errorWith: "USER",
        message: "Your account has been blocked due to some reasons",
      });
      return;
    }
    if (userData.is_admin === 1) {
      res.render("users/login", {
        errorWith: "USER",
        message: "This is not user account",
      });
      return;
    }
    const plainTextPassword = password;
    const hashedPasswordFromDatabase = userData.password;

    bcrypt.compare(
      plainTextPassword,
      hashedPasswordFromDatabase,
      function (err, result) {
        if (err) {
          console.error(err);
          return next(err);
        }

        if (result) {
          req.session.user_id = userData._id;
          res.redirect("/");
        } else {
          res.render("users/login", {
            errorWith: "PASSWORD",
            message: "Password incorrect",
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

const sendResetPasswordMail = async (name, email, token) => {
  try {
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

//....Loading Page for Sending Mail To Reset Password....//
const loadForget = async (req, res) => {
  try {
    res.render("users/forget");
  } catch (error) {
    console.error("Error rendering forget password form:", error);
    next(error);
  }
};

//....Sending Email for resetpassword....//
const verifyForgetPassword = async (req, res, next) => {
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
    sendResetPasswordMail(userData.name, userData.email, randomString);
    res.render("users/forget", {
      message: "please check your mail to reset your password.",
    });
  } catch (error) {
    next(error);
  }
};

//....Loading page for Reset Password....//
const loadForgetPassword = async (req, res, next) => {
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

//....Reseting Password....//
const resetPassword = async (req, res, next) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securePassword(password);
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

//....OTP Verification....//
const sendEmailOtp = async (req, res, next) => {
  try {
    res.render("users/emailOTP", { message: "" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const enterOtpForm = async (req, res, next) => {
  try {
    res.render("users/enter-otp", { message: "" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

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
        resolve(info);
      })
      .catch((error) => {
        console.error("Error sending OTP: " + error.message);
        reject(error);
      });
  });
};

const loginOtp = async (req, res, next) => {
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
    res.render("users/enter-otp", {
      message: "Please check your mail for OTP",
      email,
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.render("users/login", { message: "User not found" });
      return;
    }
    const generatedOTP = user.token;
    if (otp !== generatedOTP) {
      res.render("users/enter-otp", { message: "The OTP is incorrect" });
      return;
    }
    return res.redirect("/");
  } catch (error) {
    console.error("Error:", error.message);
    next(error);
  }
};

const userLogout = async (req, res, next) => {
  try {
    req.session.user_id = null;
    res.clearCookie("session_id");
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

const loadIndex = async (req, res, next) => {
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

const loadProductList = async (req, res, next) => {
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
    let categoryFilter = {};
    if (req.query.category) {
      const category = await Category.findOne({
        name: req.query.category,
      });

      if (category) {
        filter.category = category._id;
        categoryFilter = { category: category._id };
      } else {
        filter = { listed: true };
      }
    }

    const totalProducts = await Product.countDocuments(filter);
    const sortedProducts = await Product.find(filter)
      .populate("category")
      .sort(sortOption)
      .lean()
      .exec();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalProducts / limit);
    const currentPage = page;
    const selectedSort = sortQuery;
    res.render("users/shop-list", {
      isUserLoggedIn,
      is_blocked: false,
      selectedSort,
      currentPage,
      totalPages,
      totalItems: totalProducts,
      products: paginatedProducts,
      limit,
      category: req.query.category || "",
      categoryFilter,
    });
  } catch (error) {
    next(error);
  }
};

const loadSingleProduct = async (req, res, next) => {
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

    return res.render("users/shop-details", { product, isUserLoggedIn });
  } catch (error) {
    next(error);
  }
};

const searchProduct = async (req, res, next) => {
  console.log("hey");
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const searchquery = req.query.search || "";
    console.log(searchquery);
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

    const filterConditions = [
      {
        $or: [
          { name: { $regex: searchquery, $options: "i" } },
          { brand: { $regex: searchquery, $options: "i" } },
          { description: { $regex: searchquery, $options: "i" } },
        ],
      },
    ];

    if (filterByCategory) {
      filterConditions.push({ category: filterByCategory });
    }

    filterConditions.push({ listed: true });
    const totalProducts = await Product.countDocuments({
      $and: filterConditions,
    });
    const products = await Product.find({ $and: filterConditions })
      .populate("category")
      .sort(sortOption)
      .lean()
      .exec();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalProducts / limit);
    const currentPage = page;
    const selectedSort = sortQuery;
    res.render("users/shop-list", {
      products,
      isUserLoggedIn,
      searchquery,
      selectedSort,
      currentPage,
      totalPages,
      limit,
      category: filterByCategory,
      sort: sortQuery,
    });
  } catch (error) {
    next(error);
  }
};
//....Cart Managment....//
const addCart = async (req, res, next) => {
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

    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      // If the product already exists in the cart, increment its quantity
      existingCartItem.quantity += 1;
    } else {
      // If the product doesn't exist, add it to the cart
      const productToAdd = {
        product: productId,
        quantity: 1,
      };
      user.cart.push(productToAdd);
    }

    await user.save();
    console.log("Product added to cart successfully");
    return res.status(200).send("Product added to cart successfully");
  } catch (error) {
    next(error);
  }
};

const loginCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("cart.product");
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    if (user?.cart?.length <= 0) {
      res.render("users/shop-cart", {
        user,
        isUserLoggedIn: true,
        emptyCart: true,
        listed: true,
      });
      return;
    }
    res.render("users/shop-cart", { user, isUserLoggedIn: true, listed: true });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return res.status(500).send("Internal Server Error");
  }
};

const removeCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { cart: { product: productId } } },
      { new: true }
    );
    res.redirect("/shop-cart");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateCart = async (req, res, next) => {
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

    return res.redirect("/shop-cart");
  } catch (error) {
    console.error("Error updating quantity:", error);
    next(error);
  }
};

module.exports = {
  loadIndex,
  loadProductList,
  loadRegister,
  insertUser,
  verifyMail,
  loginLoad,
  loadSingleProduct,
  verifyLogin,
  enterOtpForm,
  verifyOtp,
  loginOtp,
  sendEmailOtp,
  emailOtp,
  userLogout,
  loadForget,
  verifyForgetPassword,
  loadForgetPassword,
  resetPassword,
  searchProduct,
  loginCart,
  addCart,
  removeCart,
  updateCart,
};
