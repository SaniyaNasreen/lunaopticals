const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Order = require("../models/ordermodel");
const Wallet = require("../models/walletmodel");
const Coupon = require("../models/couponmodel");
const Offer = require("../models/offermodel");
const config = require("../config/config");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const securePassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerifyMail = async (name, email, user_id, next) => {
  try {
    const token = crypto.randomBytes(20).toString("hex");
    console.log(token);
    const user = await User.findById(user_id);
    if (!user) {
      return;
    }
    user.token = token;
    await user.save();
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

function generateReferralCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const codeLength = 6;

  let referralCode = "";
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
}

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
    const userReferral = req.body.userReferral;
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      cpassword: spassword,
      country: req.body.country,
      referralCode: generateReferralCode(),
      is_admin: 0,
    });
    const referredByUser = await User.findOne({ referralCode: userReferral });

    if (referredByUser) {
      const walletAmount = 100;

      const walletDate = Date.now();
      const walletEntry = new Wallet({
        user: referredByUser,
        amount: walletAmount,
        date: walletDate,
        method: "Referral",
      });
      await walletEntry.save();
      referredByUser.wallets.push(walletEntry._id);
      await referredByUser.save();
    }
    const userData = await user.save();
    if (!userData) {
      res.render("/registration", {
        errorWith: "USER",
        message: "Your registration has been failed",
      });
    }
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const newOffer = new Offer({
      name: "New User Offer",
      description: "Get 20% off on your first purchase!",
      status: "Active",
      discount: 20,
      validity: oneDayFromNow,
      category: req.body.category,
      product: req.body.product,
      referral: userData._id,
    });
    await newOffer.save();
    sendVerifyMail(req.body.name, req.body.email, userData._id);
    res.render("users/login", {
      message:
        "Registration successful.Please check your mail for verification",
    });
  } catch (error) {
    next(error);
  }
};

const verifyMail = async (req, res, next) => {
  try {
    const token = req.query.token;
    console.log(token);
    const updateinfo = await User.updateOne(
      { token: token },
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
    if (userData.is_varified === 0) {
      res.render("users/login", {
        errorWith: "USER",
        message: "Please verify your mail for login.",
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
      res.render("users/forget", {
        errorWith: "USER",
        message: "No User Found",
      });
      return;
    }
    if (userData.is_blocked) {
      res.render("users/forget", {
        errorWith: "USER",
        message: "Your account has been blocked due to some reasons",
      });
      return;
    }
    if (userData.is_varified === 0) {
      res.render("users/forget", {
        errorWith: "USER",
        message: "Please verify your mail for login.",
      });
      return;
    }
    if (userData.is_admin === 1) {
      res.render("users/forget", {
        errorWith: "USER",
        message: "This is not user account",
      });
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
    res.redirect("/login");
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
  const OTP = Math.floor(100000 + Math.random() * 900000);
  const timestamp = Date.now();
  const expirationTime = timestamp + 5 * 60 * 1000;

  return {
    otp: OTP,
    timestamp: expirationTime,
  };
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
      res.render("users/emailOTP", {
        errorWith: "USER",
        message: "No User Found",
      });
      return;
    }
    if (userData.is_blocked) {
      res.render("users/emailOTP", {
        errorWith: "USER",
        message: "Your account has been blocked due to some reasons",
      });
      return;
    }
    if (userData.is_varified === 0) {
      res.render("users/emailOTP", {
        errorWith: "USER",
        message: "Please verify your mail for login.",
      });
      return;
    }
    if (userData.is_admin === 1) {
      res.render("users/emailOTP", {
        errorWith: "USER",
        message: "This is not user account",
      });
      return;
    }

    const OTPData = generateOTP();
    const OTP = OTPData.otp;
    const expirationTime = OTPData.timestamp;

    await User.updateOne(
      { email },
      { $set: { token: OTP, tokenExpiration: expirationTime } }
    );
    await emailOtp(email, OTP);
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
    const userData = await User.findOne({ email });

    if (!userData) {
      res.render("users/enter-otp", {
        errorWith: "USER",
        message: "No User Found",
      });
      return;
    }
    if (userData.is_blocked) {
      res.render("users/enter-otp", {
        errorWith: "USER",
        message: "Your account has been blocked due to some reasons",
      });
      return;
    }
    if (userData.is_varified === 0) {
      res.render("users/enter-otp", {
        errorWith: "USER",
        message: "Please verify your mail for login.",
      });
      return;
    }
    if (userData.is_admin === 1) {
      res.render("users/enter-otp", {
        errorWith: "USER",
        message: "This is not user account",
      });
      return;
    }

    const storedOTP = userData.token;

    const expirationTime = userData.tokenExpiration;

    if (otp !== storedOTP) {
      res.render("users/enter-otp", {
        errorWith: "OTP",
        message: "Incorrect otp",
      });
      return;
    }

    if (Date.now() > expirationTime) {
      res.render("users/enter-otp", {
        errorWith: "OTP",
        message: "Otp has been expired",
      });
      return;
    }

    // OTP is valid and not expired
    req.session.user_id = userData._id;
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
      const userId = req.session.user_id;
      const categories = await Category.find({ listed: true }).limit(2);
      const products = await Product.find({ listed: true });
      const currentDate = new Date();
      const offers = await Offer.find({
        $and: [
          { $or: [{ referral: null }, { referral: userId }] },
          { validity: { $gte: currentDate } },
        ],
      })
        .populate("category")
        .populate("product")
        .populate("referral")
        .exec();
      console.log(offers);
      let isUserLoggedIn = false;
      if (req?.session?.user_id) {
        isUserLoggedIn = true;
      }

      res.render("users/indexhome", {
        categories,
        products,
        offers,
        is_blocked: false,
        isUserLoggedIn,
      });
    } else if (req.session.user_id) {
      const userId = req.session.user_id;
      const categories = await Category.find({ listed: true }).limit(2);
      const products = await Product.find({ listed: true });
      const currentDate = new Date();
      const offers = await Offer.find({
        $and: [
          { $or: [{ referral: null }, { referral: userId }] },
          { validity: { $gte: currentDate } },
        ],
      })
        .populate("category")
        .populate("product")
        .populate("referral")
        .exec();
      let isUserLoggedIn = false;
      if (req?.session?.user_id) {
        isUserLoggedIn = true;
      }
      const email = req.session.user_id;
      const userData = await User.findOne({ _id: email });
      if (userData) {
        if (userData.is_blocked === false) {
          const userId = req.session.user_id;
          const currentDate = new Date();
          const offers = await Offer.find({
            $and: [
              { $or: [{ referral: null }, { referral: userId }] },
              { validity: { $gte: currentDate } },
            ],
          })
            .populate("category")
            .populate("product")
            .populate("referral")
            .exec();
          res.render("users/indexhome", {
            categories,
            products,
            offers,
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
    const product = await Product.findById({ _id: productId });
    if (!product) {
      const error = "Product not found";
      error.statusCode = 404;
      throw error;
    }
    const userId = req?.session?.user_id;
    const currentDate = new Date();
    const offer = await Offer.findOne({
      $and: [
        {
          $or: [
            {
              category: product.category,
              status: "Active",
              validity: { $gte: new Date() },
            },
            {
              product: productId,
              status: "Active",
              validity: { $gte: new Date() },
            },
            {
              referral: userId,
              status: "Active",
              validity: { $gte: new Date() },
            },
          ],
        },
        { validity: { $gte: currentDate } },
      ],
    }).populate("category", "referral");
    console.log("Product Category:", product.category);
    console.log("Found Offer:", offer);

    let discountAmount = 0;
    if (offer) {
      if (offer.referral && req?.session?.userId == offer.referral.toString()) {
        discountAmount = (product.price * (offer.discount / 100)).toFixed(2);
      } else {
        discountAmount = (product.price * (offer.discount / 100)).toFixed(2);
      }
    }

    return res.render("users/shop-details", {
      product,
      isUserLoggedIn,
      hasOffer: discountAmount > 0,
      offer,
      discountAmount,
    });
  } catch (error) {
    next(error);
  }
};

const searchProduct = async (req, res, next) => {
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

    // Removed the 'listed' condition from combinedConditions
    const combinedConditions = { $or: filterConditions };

    const products = await Product.find(combinedConditions)
      .populate("category")
      .lean()
      .exec();

    // Sorting the searched products after fetching them
    products.sort((a, b) => {
      if (sortOption.price) {
        return (a.price - b.price) * sortOption.price;
      } else {
        return b.createdAt - a.createdAt;
      }
    });

    const totalProducts = products.length;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalProducts);

    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalProducts / limit);
    const currentPage = page;
    const selectedSort = sortQuery;
    res.render("users/shop-list", {
      products: paginatedProducts, // Send paginated products instead of all products
      isUserLoggedIn,
      searchquery,
      selectedSort,
      paginatedProducts,
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
    const cart = user.cart;
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.quantity += 1;
    } else {
      const productToAdd = {
        product: productId,
        quantity: 1,
        stock: product.countInStock,
        total: product.price,
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

    let cart = user.cart;
    let productDiscountAmount = 0;
    let offer;
    for (const cartItem of cart) {
      const product = cartItem.product;
      const currentDate = new Date();
      const offer = await Offer.findOne({
        $and: [
          {
            $or: [
              {
                category: product.category,
                status: "Active",
                validity: { $gte: new Date() },
              },
              {
                product: product,
                status: "Active",
                validity: { $gte: new Date() },
              },
              {
                referral: userId,
                status: "Active",
                validity: { $gte: new Date() },
              },
            ],
          },
          { validity: { $gte: currentDate } },
        ],
      }).populate("category", "referral");
      console.log("Product Category:", product.category);
      console.log("Found Offer:", offer);

      if (offer) {
        if (
          offer.referral &&
          req?.session?.userId == offer.referral.toString()
        ) {
          productDiscountAmount = (
            product.price *
            (offer.discount / 100)
          ).toFixed(2);
        } else {
          console.log("heyy", product.price);
          productDiscountAmount = (
            product.price *
            (offer.discount / 100)
          ).toFixed(2);
          console.log("discountAmount", productDiscountAmount);
        }
        cartItem.productDiscountAmount = productDiscountAmount;
        console.log(
          "purchasedItem.productDiscountAmount",
          cartItem.productDiscountAmount
        );
      }
    }

    res.render("users/shop-cart", {
      user,
      isUserLoggedIn: true,
      listed: true,
      insufficientStockItems: true,
      productDiscountAmount,
      cart: cart,
      offer,
    });
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

    const product = await Product.findById(productInCart.product);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    let newQuantity = productInCart.quantity;
    const cart = user.cart;
    if (updateQuantity === "increase") {
      if (product.countInStock > newQuantity) {
        newQuantity++;
        productInCart.quantity = newQuantity;
        await user.save();
      } else {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock for this item",
          insufficientStock: true,
        });
      }
    } else if (updateQuantity === "decrease" && newQuantity > 1) {
      newQuantity--;
      productInCart.quantity = newQuantity;

      await user.save();
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid quantity update" });
    }
    const currentDate = new Date();
    const offer = await Offer.findOne({
      $and: [
        {
          $or: [
            {
              category: product.category,
              status: "Active",
              validity: { $gte: new Date() },
            },
            {
              product: product_id,
              status: "Active",
              validity: { $gte: new Date() },
            },
            {
              referral: userId,
              status: "Active",
              validity: { $gte: new Date() },
            },
          ],
        },
        { validity: { $gte: currentDate } },
      ],
    }).populate("category", "referral");
    console.log("Product Category:", product.category);
    console.log("Found Offer:", offer);

    let discountAmount = 0;
    if (offer) {
      if (offer.referral && req?.session?.userId == offer.referral.toString()) {
        discountAmount = (product.price * (offer.discount / 100)).toFixed(2);
      } else {
        discountAmount = (product.price * (offer.discount / 100)).toFixed(2);
      }
    }
    console.log("discountAmountis", discountAmount);
    {
      productInCart.total = newQuantity * product.price;

      await user.save();
      return res.redirect("/shop-cart");
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
    next(error);
  }
};

const loadCheckout = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId).populate("cart.product");

    const isUserLoggedIn = !!req.session?.user_id;
    let couponCode;
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    const coupon = await Coupon.find();
    console.log("coupon", coupon);
    let subtotal = user.cart.reduce((sum, cartItem) => {
      return sum + cartItem.total;
    }, 0);
    console.log("subtotal", subtotal);
    const categoryMatched = [];
    const couponAlreadyApplied = user.couponApplied;

    if (coupon && coupon.category) {
      categoryMatched = user.cart.filter(
        (cartItem) => cartItem.product.category === coupon.category
      );
    }

    const cart = user.cart || [];
    const order = await Order.findById(userId);
    let discountAmount = 0;

    let hasOffer = false;
    for (const cartItem of user.cart) {
      const product = cartItem.product;
      const quantity = cartItem.quantity;
      const currentDate = new Date();
      const offer = await Offer.findOne({
        $and: [
          {
            $or: [
              {
                category: product.category,
                status: "Active",
                validity: { $gte: new Date() },
              },
              {
                product: product,
                status: "Active",
                validity: { $gte: new Date() },
              },
              {
                referral: userId,
                status: "Active",
                validity: { $gte: new Date() },
              },
            ],
          },
          { validity: { $gte: currentDate } },
        ],
      }).populate("category", "referral");
      console.log("Product Category:", product.category);
      console.log("Found Offer:", offer);

      if (offer) {
        if (
          offer.referral &&
          req?.session?.userId == offer.referral.toString()
        ) {
          discountAmount =
            (product.price * (offer.discount / 100)).toFixed(2) * quantity;
          subtotal -= discountAmount;
          console.log("subu", subtotal);
        } else {
          console.log("heyy", product.price);
          discountAmount =
            (product.price * (offer.discount / 100)).toFixed(2) * quantity;
          console.log("discountAmount", discountAmount);
          subtotal -= discountAmount;
          console.log("subu", subtotal);
        }
        hasOffer = true;
        cartItem.discountAmount = discountAmount;
      }
    }
    let Shipping = 0;
    if (subtotal < 2000) {
      Shipping = 100;
    } else {
      Shipping = 0;
    }
    let totalPrice = 0;
    if (req.body.code && coupon.status === "Active") {
      totalPrice = subtotal - discountAmount;
      user.totalAmount = totalPrice + Shipping;
    } else {
      totalPrice = hasOffer ? subtotal : subtotal;
      user.totalAmount = totalPrice + Shipping;
    }

    await user.save();

    return res.render("users/checkout", {
      user,
      userCart: user.cart,
      isUserLoggedIn,
      coupon,
      subtotal,
      categoryMatched,
      couponAlreadyApplied,
      req,
      userAddresses: user.address,
      selectedAddress: req.body.selectedAddress || user.address[0],
      discountAmount,
      Shipping,
      order,
      totalPrice,
      hasOffer,
      couponCode,
    });
  } catch (error) {
    next(error);
  }
};

const fetchAddress = async (req, res, next) => {
  console.log("fetched");
  try {
    const addressId = req.params.id;
    console.log(addressId);
    const user = await User.findById(req.session.user_id);
    console.log(user);
    const userAddress = user.address;

    // Convert addressId to Mongoose ObjectId
    const mongooseAddressId = new mongoose.Types.ObjectId(addressId);

    const selectedAddress = userAddress.find((address) =>
      address._id.equals(mongooseAddressId)
    );
    console.log("selectedAddress", selectedAddress);
    if (!selectedAddress) {
      return res.status(404).send("Address not found");
    }

    res.json(selectedAddress);
  } catch (error) {
    next(error);
  }
};
const checkoutCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");

    const isUserLoggedIn = !!req.session?.user_id;

    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    if (user.cart?.length <= 0) {
      return res.render("users/shop-cart", {
        user,
        isUserLoggedIn,
        emptyCart: true,
        listed: true,
      });
    }

    const insufficientStockItems = user.cart.filter(
      (cartItem) => cartItem.product.countInStock < cartItem.quantity
    );

    if (insufficientStockItems.length > 0) {
      return res.status(400).json({ insufficientStockItems: true });
    }

    return res.redirect("/checkout");
  } catch (error) {
    next(error);
  }
};

const userProfile = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.user._id;
    const user = await User.findById(userId).populate("cart.product");
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    res.render("users/edituser", { isUserLoggedIn, user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    if (req.body.changePassword && req.body.changePassword.trim() !== "") {
      user.password = req.body.changePassword;
    }

    // Validate if user input meets required criteria
    const validationResult = user.validateSync();
    if (validationResult) {
      console.error("Validation error:", validationResult.errors);
      return res.status(400).send("Validation error");
    }

    await user.save();
    res.redirect("/edituser");
  } catch (error) {}
};

const userAddress = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    const userAddress = user.address || [];
    res.render("users/address", { isUserLoggedIn, userAddress, user });
  } catch (error) {
    next(error);
  }
};

const loadAddAddress = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.user._id;
    const user = await User.findById(userId);
    const users = req.params.id;
    console.log("users", users);
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    const userAddress = user.address || [];
    res.render("users/addaddress", { isUserLoggedIn, userAddress, user });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      firstname,
      lastname,
      address,
      email,
      city,
      country,
      pincode,
      mobile,
    } = req.body;

    const newAddress = {
      firstname,
      lastname,
      address,
      email,
      city,
      country,
      pincode,
      mobile,
    };
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    user.address.push(newAddress);
    console.log("hey", req.query.source);
    await user.save();
    if (req.query.source === "checkout") {
      console.log("hey", req.query.source);
      res.redirect("/checkout");
    } else {
      res.redirect("/address");
    }
  } catch (error) {
    next(error);
  }
};

const loadEditAddress = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    if (!req?.user?._id) {
      console.error("User ID not found");
      return res.status(404).send("User ID not found");
    }
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    const userAddress = user.address || [];
    res.render("users/editaddress", { isUserLoggedIn, userAddress, user, req });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const addressIndex = req.query.index; // Index of the address to be edited
    const {
      firstname,
      lastname,
      address,
      email,
      city,
      country,
      pincode,
      mobile,
    } = req.body;

    const updatedAddress = {
      firstname,
      lastname,
      address,
      email,
      city,
      country,
      pincode,
      mobile,
    };

    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    if (!user.address || !user.address[addressIndex]) {
      console.error("Address not found");
      return res.status(404).send("Address not found");
    }

    // Update the existing address at the specified index
    user.address[addressIndex] = updatedAddress;

    await user.save();

    res.redirect("/address"); // Redirect to the address page after successful edit
  } catch (error) {
    next(error);
  }
};

const orderInfo = async (req, res, next) => {
  try {
    let isUserLoggedIn = !!req?.session?.user_id;
    const userId = req.user?._id;
    if (!userId) {
      console.error("User ID not found in the request");
      return res.status(404).send("User ID not found");
    }

    const user = await User.findById(userId).populate("cart.product");

    const orders = await Order.find({ user: userId })
      .populate("purchasedItems.product")
      .sort({ date: -1 });

    let offer;
    let productDiscountAmount = 0;
    for (const order of orders) {
      for (const purchasedItem of order.purchasedItems) {
        const product = purchasedItem.product;
        const currentDate = new Date();
        offer = await Offer.findOne({
          $and: [
            {
              $or: [
                {
                  category: product.category,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  product: product._id,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
                {
                  referral: userId,
                  status: "Active",
                  validity: { $gte: new Date() },
                },
              ],
            },
            { validity: { $gte: currentDate } },
          ],
        }).populate("category", "referral");

        console.log("Product Category:", product.category);
        console.log("Found Offer:", offer);

        const coupon = await Coupon.findOne({
          category: product.category,
          validity: { $gte: currentDate },
          minAmount: { $lte: purchasedItem.price },
          maxAmount: { $gte: purchasedItem.price },
        });

        if (offer) {
          if (
            offer.referral &&
            req?.session?.userId == offer.referral.toString()
          ) {
            productDiscountAmount = (
              product.price *
              (offer.discount / 100)
            ).toFixed(2);
          } else {
            console.log("heyy", product.price);
            productDiscountAmount = (
              product.price *
              (offer.discount / 100)
            ).toFixed(2);
            console.log("discountAmount", productDiscountAmount);
          }
        }
        purchasedItem.productDiscountAmount = productDiscountAmount;
        console.log(
          "purchasedItem.productDiscountAmount",
          purchasedItem.productDiscountAmount
        );
        if (order.couponApplied === true && coupon) {
          console.log("hoihoi");
          if (productDiscountAmount) {
            const couponDiscount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = (
              parseFloat(purchasedItem.productDiscountAmount) +
              parseFloat(couponDiscount)
            ).toFixed(2);
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          } else {
            const discount = (
              (product.price - purchasedItem.productDiscountAmount) *
              (coupon.discount / 100)
            ).toFixed(2);
            purchasedItem.productDiscountAmount = couponDiscount;
            console.log(
              "purchasedItem.productDiscountAmount",
              purchasedItem.productDiscountAmount
            );
          }
        }
      }
    }
    console.log("discountAmountcat", productDiscountAmount);
    res.render("users/order", {
      isUserLoggedIn,
      user: req.user,
      orders,
      productDiscountAmount,
      offer,
    });
  } catch (error) {}
};
const generateOrderNumber = function () {
  return Math.floor(Math.random() * 1000000);
};
const saveOrder = async (req, res, next) => {
  console.log("heelosaveOrder");
  try {
    let isUserLoggedIn = !!req.session.user_id;
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: "cart.product",
      model: "Product",
    });
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    const cartItems = user.cart;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).send("Cart is empty");
    }
    const insufficientStockItems = cartItems.filter(
      (cartItem) => cartItem.product.countInStock < cartItem.quantity
    );
    if (insufficientStockItems.length > 0) {
      console.log("out of stock");
      return res.status(400).send("Insufficient stock for some items");
    }
    const ordersToSave = [];
    const {
      firstname,
      lastname,
      address,
      email,
      city,
      country,
      pincode,
      mobile,
      paymentMethod,
      paymentStatus,
    } = req.body;
    console.log("req.body", req.body);
    const updatedUser = await User.findById(userId).populate(
      "cart.product",
      "cart.total"
    );

    let updatedSubtotal = 0;
    for (const cartItem of updatedUser.cart) {
      updatedSubtotal += cartItem.product.price * cartItem.quantity;
    }
    const couponCode = req.session.couponCode || req.body.couponCode;
    let couponApplied = false;
    let couponDetails;
    if (couponCode) {
      console.log("hyhui");
      couponDetails = await Coupon.findOne({ code: couponCode });
      if (couponDetails) {
        couponApplied = true;
      } else {
        console.error("Coupon not found");
      }
    }
    let discountAmount = 0;
    if (couponApplied) {
      couponDetails = await Coupon.findOne({ code: couponCode });
      if (couponDetails) {
        const discountPercentage = couponDetails.discount
          ? parseFloat(couponDetails.discount) / 100
          : 0;
        discountAmount = updatedSubtotal * discountPercentage;
      }
    }

    let newOrder = {
      user: userId,
      address: {
        firstname,
        lastname,
        address,
        email,
        city,
        country,
        pincode,
        mobile,
      },
      orderNumber: generateOrderNumber(),
      date: new Date(),
      purchasedItems: [],
      totalAmount: user.totalAmount,
      payment: {
        type: paymentMethod,
        status: paymentStatus,
      },
      coupon: couponDetails,
      discountAmount,
      couponApplied,
    };

    for (const cartItem of cartItems) {
      const { product, quantity, images } = cartItem;
      const { _id, price } = product;
      const updatedProduct = await Product.findById(_id);
      if (updatedProduct) {
        updatedProduct.countInStock -= quantity;
        await updatedProduct.save();
      } else {
        console.error(`Product with ID ${_id} not found`);
        return res.status(404).send(`Product with ID ${_id} not found`);
      }
      newOrder.purchasedItems.push({
        product: _id,
        price,
        quantity,
        images,
      });
    }
    const orderInstance = new Order(newOrder);
    await orderInstance.save();
    if (couponDetails) {
      couponDetails.couponApplied = true;
      await couponDetails.save();
    }
    user.cart = [];
    await user.save();
    res.status(200).send("Order saved successfully");
  } catch (error) {
    next(error);
  }
};
const removeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const cancelledOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { "purchasedItems.$[item].status": "cancelled" } },
      { new: true, arrayFilters: [{ "item._id": req.params.itemId }] }
    ).populate("purchasedItems.product");
    console.log("cancelled");

    if (Array.isArray(cancelledOrder.purchasedItems)) {
      for (const purchasedItem of cancelledOrder.purchasedItems) {
        const productId = purchasedItem.product._id;
        const quantity = purchasedItem.quantity;

        const updatedProduct = await Product.findById(productId);

        if (updatedProduct) {
          updatedProduct.countInStock += quantity;
          await updatedProduct.save();
        }
      }
    }
    const user = await User.findById(userId);

    if (user) {
      const cancelledItem = cancelledOrder.purchasedItems.find(
        (item) => item._id.toString() === req.params.itemId
      );
      const currentDate = Date.now();
      const offer = await Offer.findOne({
        $and: [
          {
            $or: [
              {
                category: cancelledItem.category,
                status: "Active",
                validity: { $gte: new Date() },
              },
              {
                product: cancelledItem._id,
                status: "Active",
                validity: { $gte: new Date() },
              },
              {
                referral: userId,
                status: "Active",
                validity: { $gte: new Date() },
              },
            ],
          },
          { validity: { $gte: currentDate } },
        ],
      }).populate("category", "referral");
      console.log("off", offer);
      if (offer) {
        const discountAmount = cancelledItem.price * (offer.discount / 100);
        console.log(discountAmount);
        cancelledItem.price -= discountAmount;
      }
      if (cancelledItem) {
        const walletAmount = cancelledOrder.totalAmount;
        const walletDate = Date.now();
        const walletProduct = cancelledItem.product;

        const walletEntry = new Wallet({
          user: user,
          amount: walletAmount,
          date: walletDate,
          method: "Refund",
        });
        await walletEntry.save();
        user.wallets.push(walletEntry._id);
        await user.save();
      }
    }
    res.redirect("/order");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const userWallet = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }

    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: "wallets",
      model: "Wallet",
    });
    const order = await Order.find({ "payment.type": "Wallet" });
    console.log("orderwalet", order);
    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }
    const wallets = user.wallets;
    console.log("walleting", wallets);
    let walletsToPush = [];
    if (order) {
      walletsToPush.push(order);
    }
    console.log(" walet", walletsToPush);
    const totalWalletAmount = wallets.reduce(
      (total, wallet) => total + wallet.amount,
      0
    );
    const totalOrderAmount = walletsToPush
      .flat()
      .reduce((total, order) => total + order.totalAmount, 0);
    const totalAmount = totalWalletAmount - totalOrderAmount;

    res.render("users/wallet", {
      wallets,
      isUserLoggedIn,
      user,
      order,
      walletsToPush,
      totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

const loadReferral = async (req, res, next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const userId = req.user._id;
    const users = await User.findById(userId);
    const totalReferralWallets = await Wallet.aggregate([
      {
        $match: {
          method: "Referral",
          user: userId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.render("users/referral", {
      users,
      isUserLoggedIn,
      totalReferralWallets: totalReferralWallets,
    });
  } catch (error) {
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
  checkoutCart,
  loadCheckout,
  fetchAddress,
  userProfile,
  updateUser,
  userAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  updateAddress,
  orderInfo,
  saveOrder,
  removeOrder,
  userWallet,
  loadReferral,
};
