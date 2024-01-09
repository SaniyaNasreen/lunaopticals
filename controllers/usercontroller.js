const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Order = require("../models/ordermodel");
const Coupon = require("../models/couponmodel");
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
        errorWith: "EMAIL",
        message: "User email is incorrect",
      });
      return;
    }

    if (userData.is_varified === 0) {
      res.render("users/emailOTP", { message: "Please verify your mail" });
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
    const user = await User.findOne({ email });
    if (!user) {
      res.render("users/login", { message: "User not found" });
      return;
    }
    const storedOTP = user.token;
    const expirationTime = user.tokenExpiration;

    if (otp !== storedOTP) {
      res.render("users/enter-otp", { message: "The OTP is incorrect" });
      return;
    }

    if (Date.now() > expirationTime) {
      res.render("users/enter-otp", { message: "The OTP has expired" });
      return;
    }

    // OTP is valid and not expired
    req.session.user_id = user._id;
    return res.redirect("/");
  } catch (error) {
    console.error("Error:", error.message);
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userData = await User.find({ email });

    if (!userData) {
      return res.status(400).json({ message: "User not found" });
    }

    if (userData.is_verified === 0) {
      return res.status(400).json({ message: "User email is not verified" });
    }

    const OTPData = generateOTP();
    const OTP = OTPData.otp;
    const expirationTime = OTPData.timestamp;

    await User.updateOne(
      { email },
      { $set: { token: OTP, tokenExpiration: expirationTime } }
    );

    // Send the OTP via email
    await emailOtp(email, OTP);
    res.render("users/enter-otp", {
      message: "Please check your mail for OTP",
      email,
    });
  } catch (error) {
    console.error("Error sending OTP:", error.message);
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
    res.render("users/shop-cart", {
      user,
      isUserLoggedIn: true,
      listed: true,
      insufficientStockItems: true,
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
    console.log("hello cart", user.cart);

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

    if (updateQuantity === "increase") {
      if (product.countInStock > newQuantity) {
        newQuantity++;
        productInCart.quantity = newQuantity;
        await user.save();
      } else {
        // SweetAlert for insufficient stock
        return res.status(400).send("Insufficient stock for this item");
      }
    } else if (updateQuantity === "decrease" && newQuantity > 1) {
      newQuantity--;
      productInCart.quantity = newQuantity;
      await user.save();
    } else {
      return res.status(400).send("Invalid quantity update");
    }

    {
      return res.redirect("/shop-cart");
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
    next(error);
  }
};

const loadCheckout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    const isUserLoggedIn = !!req.session?.user_id;

    if (!user) {
      console.error("User not found");
      return res.status(404).send("User not found");
    }

    const coupon = user.coupon;
    const subtotal = user.cart.reduce((sum, cartItem) => {
      return sum + cartItem.product.price * cartItem.quantity;
    }, 0);

    const categoryMatched = [];
    const couponAlreadyApplied = user.couponApplied;

    if (coupon && coupon.category) {
      categoryMatched = user.cart.filter(
        (cartItem) => cartItem.product.category === coupon.category
      );
    }

    const order = await Order.findOne({ _id: user._id }); // Fetch existing order or create a new one

    // Render the checkout page
    return res.render("users/checkout", {
      user,
      userCart: user.cart,
      isUserLoggedIn,
      coupon,
      subtotal,
      categoryMatched,
      couponAlreadyApplied,
      req,
    });
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
    console.log("Request Body:", req.body);

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
    await user.save();

    console.log("Address added successfully:", newAddress);
    res.redirect("/address"); // Redirect to the address page or wherever appropriate
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addAddress,
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
    console.log(user);
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

    let addressFound = false;

    for (let i = 0; i < user.address.length; i++) {
      if (user.address[i]._id == req.params.addressId) {
        // Update the found address directly
        Object.assign(user.address[i], updatedAddress);
        addressFound = true;
        break;
      }
    }

    if (!addressFound) {
      console.error("Address not found");
      return res.status(404).send("Address not found");
    }

    await user.save();
    console.log("Address updated successfully:", updatedAddress);
    res.redirect("/address");
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

    const orders = await Order.find({ user: userId }).populate(
      "purchasedItems.product"
    );

    if (!orders) {
      console.error("Order not found");
      return res.status(404).send("Order not found");
    }

    res.render("users/order", {
      isUserLoggedIn,
      user: req.user,
      orders,
    });
  } catch (error) {}
};
const generateOrderNumber = function () {
  return Math.floor(Math.random() * 1000000);
};
const saveOrder = async (req, res, next) => {
  console.log("hello");
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
      couponCode,
    } = req.body;
    const updatedUser = await User.findById(userId).populate("cart.product");
    let totalAmount = 0;
    let discountAmount = 0;
    const couponDetails = await Coupon.findOne({ code: couponCode });

    if (couponDetails) {
      const discountPercentage = couponDetails.discount
        ? parseFloat(couponDetails.discount) / 100
        : 0;
      discountAmount = updatedSubtotal * discountPercentage;
      totalAmount -= discountAmount;
    }
    if (!couponDetails) {
      console.error("Coupon not found");
    }
    for (const cartItem of cartItems) {
      totalAmount += cartItem.price * cartItem.quantity;
    }

    let updatedSubtotal = 0;
    for (const cartItem of updatedUser.cart) {
      updatedSubtotal += cartItem.product.price * cartItem.quantity;
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
      totalAmount: 0,
      payment: {
        type: paymentMethod,
        status: paymentStatus,
      },
      coupon: couponDetails,
      discountAmount,
    };

    for (const cartItem of cartItems) {
      const { product, quantity, images } = cartItem;
      const { _id, price } = product;
      newOrder.totalAmount += price * quantity;
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
    // couponDetails.couponApplied = true;
    // order.couponApplied = true;

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
    const user = await User.findOneAndUpdate(
      { _id: userId, "order._id": orderId },
      { $set: { "order.$.status": "cancelled" } },
      { new: true }
    );
    const cancelledOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status: "cancelled" } },
      { new: true }
    ).populate("purchasedItems.product");

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
    res.redirect("/order");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
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
  resendOtp,
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
};
