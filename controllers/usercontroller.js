const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const config = require("../config/config");
// const client = require('twilio')(config.accountSID, config.authToken);
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { name } = require("ejs");
const crypto = require("crypto");
const { use } = require("../routes/userroute");

// otp=======================

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

// for send mail  //

const sendverifymail = async (name, email, user_id) => {
  try {
    const token = crypto.randomBytes(20).toString("hex");
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

// for reset password mail //

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

//...............load home........................//

const loadindex = async (req, res,next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
     
    // Fetch only two categories from the database (assuming you have a condition or some logic to limit the categories)
    const categories = await Category.find({ listed: true }).limit(2); // Adjust the condition or logic to limit the categories

    // Fetch other necessary data like products (assuming you need them)
    const products = await Product.find({ listed: true }); // Fetch products data as needed
    
    


    
    // Render the 'indexhome' view and pass 'categories' and 'products' to it
    res.render("users/indexhome", {
      categories,
      products,
      is_blocked: false,
      isUserLoggedIn,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res,next) => {
  try {
    const categories = await Category.find({ listed: true });
    res.status(200).json(categories); // Assuming you're sending JSON response
  } catch (error) {
    next(error);
  }
};

//.....................load sales.......................//

const loadsales = async (req, res,next) => {
  try {
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const products = await Product.find({ listed: true }); // Fetch products data as needed
    
    res.render("users/shoplist", { products,  isUserLoggedIn,is_blocked: false, }); // Pass 'products' to the view
  } catch (error) {
    next(error);
  }
};

//....................load unisex....................//

const loadunisex = async (req, res,next) => {
  try {
    const isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const unisexCategory = await Category.findOne({ name: 'Unisex' });

    if (unisexCategory) {
      // Find products that belong to the 'Men' category
      const unisexProducts = await Product.find({ category: unisexCategory._id });
     
      res.render('users/unisex', { products: unisexProducts ,  isUserLoggedIn,});
    } else {
      res.render('users/unisex', { products: [] }); // No category found, render empty array
    }
  } catch (error) {
    next(error);
  }
};

//....................load Men....................//

const loadmen = async (req, res,next) => {
  try {
    const menCategory = await Category.findOne({ name: 'Men' });

    if (menCategory) {
      // Find products that belong to the 'Men' category
      const menProducts = await Product.find({ category: menCategory._id });
      const isUserLoggedIn = false;
      if (req?.session?.user_id) {
        isUserLoggedIn = true;
      }
      res.render('users/men', { products: menProducts ,  isUserLoggedIn,});
    } else {
      res.render('users/men', { products: [] }); // No category found, render empty array
    }
  } catch (error) {
    next(error);
  }
};

//....................load unisex....................//

const loadwomen = async (req, res,next) => {
 
   try {
    const womenCategory = await Category.findOne({ name: 'Women' });

    if (womenCategory) {
      // Find products that belong to the 'Men' category
      const womenProducts = await Product.find({ category: womenCategory._id });
      const isUserLoggedIn = false;
      if (req?.session?.user_id) {
        isUserLoggedIn = true;
      }
      res.render('users/women', { products: womenProducts,  isUserLoggedIn, });
    } else {
      res.render('users/women', { products: [] }); // No category found, render empty array
    }
  } catch (error) {
    next(error);
  }
};

//...................load register page ................//

const loadRegister = async (req, res) => {
  try {
    return res.render("users/registration");
  } catch (error) {
    next(error);
  }
};

const insertUser = async (req, res,next) => {
  try {
    console.log(req.body);
    if (req.body.password !== req.body.confirm_password) {
      res.render("/registration", {
        message: "Password and Confirm Password do not match",
      });
      return;
    }
    const { email,mobile } = req.body;
     
    

     // Check if the category with the same name already exists
  const existingemail = await User.findOne({ email });
  if (existingemail) {
    res.render('users/registration', { errorMessage: "Email already exists" });
  }


  const existingmobile = await User.findOne({ mobile });
  if (existingmobile) {
    res.render('users/registration', { errorMessage: "Mobile already exists" });
  }
  const existingUser = await User.findOne({ $and: [{ email: email }, { mobile: mobile }] });

if (existingUser) {
  res.render('users/registration', { errorMessage: "Email and Mobile already exist together" });
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

    if (userData) {
      sendverifymail(req.body.name, req.body.email, userData._id);
      // res.redirect('/home')
      res.render("users/login", {
        message:
          "Your regestration has been susseccfull,please verify your mail.",
      });
    } else {
      res.render("/registration", {
        message: "Your registration has been failed",
      });
    }
  } catch (error) {
    next(error);
  }
};

//......................... user login......................... //

const loginLoad = async (req, res,next) => {
  try {
    if(!req.session.user_id){
    res.render("users/login");
    } 
    
  } catch (error) {
    next(error);
  }
};

const verifylogin = async (req, res,next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const categories = await Category.find().limit(2); // Adjust the condition or logic to limit the categories

    // Fetch other necessary data like products (assuming you need them)
    const products = await Product.find(); // Fetch products data as needed
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (!userData.is_blocked) {
        req.session.user_id = userData._id;
        const passwordmatch = await bcrypt.compare(password, userData.password);
        if (passwordmatch) {
          if (userData.is_admin === 0) {
            res.redirect("/");
          } else {
            req.session.admin_id = userData._id;
            res.redirect("admin/indexhome");
          }
        } else {
          res.render("users/login", { message: "Email or password incorrect" });
        }
      } else {
        res.render("users/login", {
          message: "Your account has been blocked due to some reasons",
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

const loaddetails = async (req, res,next) => {
  try {
    
    let isUserLoggedIn = false;
    if (req?.session?.user_id) {
      isUserLoggedIn = true;
    }
    const productId = req.params.id;

    const product = await Product.findById(productId);
    console.log(product);

    if (!product) {
      // Handle case where product with the given ID is not found
      const error = "Product not found";
      error.statusCode = 404;
      throw error;
    }

    // Render the 'users/shopdetails' view and pass the product data to it
    return res.render("users/shopdetails", { product,isUserLoggedIn });
  } catch (error) {
    next(error);
  }
};

const checkAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    // If user session exists, proceed to next middleware/route handler
    next();
  } else {
    // If user session doesn't exist, redirect to login
    res.redirect("/login");
  }
};

const userLogout = async (req, res,next) => {
  try {
     req.session.user_id=null;
     console.log("Hi");
    res.clearCookie("session_id");
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

// Route for rendering the index home or login based on user session
// const renderIndexOrLogin = (req, res) => {
//   if (req.session && req.session.user) {
//     res.render('indexhome'); // Render indexhome if user is logged in
//   } else {
//     res.render('login'); // Render login if user is not logged in
//   }
// };

// ================sending otp========================

const sendEmailOtp = async (req, res,next) => {
  try {
    res.render("users/emailOTP", { message: "" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const enterOtpForm = async (req, res,next) => {
  try {
    res.render("users/enterotp", { message: "" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
//   // =====================email logic=============================

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

// Controller for sending OTP and rendering the form to enter OTP
const loginotp = async (req, res,next) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email });

    // sendOTP(mobile, OTP);

    if (userData) {
      req.session.user_id = userData._id;

      if (userData.is_varified === 0) {
        res.render("users/emailOTP", { message: "Please verify your mail" });
      } else {
        const OTP = generateOTP();
        await User.updateOne({ email }, { $set: { token: OTP } });
        emailOtp(email, OTP);
        res.render("users/enterotp", {
          message: "Please check your mail for OTP",
          email,
        });
      }
    } else {
      res.render("users/emailOTP", { message: "User email is incorrect" });
    }
  } catch (error) {
    console.error(error.message);
    // Pass the caught error to the next middleware (error handling middleware)
    next(error);
  }
};

const verifyotp = async (req, res,next) => {
  try {
    const { email, otp } = req.body; // Destructure email and OTP from request body

    console.log("Email received:", email); // Add this line for debugging
    const user = await User.findOne({ email });

    if (!user) {
      console.log("No user found for email:", email); // Log the email to identify any mismatch
      return res.render("users/login", { message: "User not found" });
    }

    const generatedOTP = user.token; // Fetch the OTP associated with the user from the database

    if (otp === generatedOTP) {
      req.session.user_id = user._id; // Set user_id in session upon successful OTP verification
      req.session.user = true; // Set other necessary session data
      console.log("OTP Matched. Redirecting to home page.");
      return res.redirect("users/"); // Redirect to the home page or appropriate route
    } else {
      console.log("Rendering enterotp with error message");
      return res.render("users/enterotp", { message: "The OTP is incorrect" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    // Pass the caught error to the next middleware (error handling middleware)
    next(error);
    // Handle other errors gracefully
  }
};
// forget password code //

const forgetload = async (req, res) => {
  try {
    res.render("users/forget");
  } catch (error) {
    console.error("Error rendering forget password form:", error);
    next(error);
  }
};

// verify forget password on mail //

const forgetverify = async (req, res,next) => {
  try {
    email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_varified === 0) {
        res.render("users/forget", { message: "Please verify your mail" });
      } else {
        const randomString = randomstring.generate();
        const updateData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendresetpasswordmail(userData.name, userData.email, randomString);
        res.render("users/forget", {
          message: "please check your mail to reset your password.",
        });
      }
    } else {
      res.render("users/forget", { message: "User email is incorrect" });
    }
  } catch (error) {
    next(error);
  }
};

const verifymail = async (req, res,next) => {
  try {
    const updateinfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_varified: 1 } }
    );

    console.log(updateinfo);
    res.render("users/emailvarified");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const forgetpasswordload = async (req, res,next) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });

    if (tokenData) {
      res.render("users/forgetPassword", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token is invalid." });
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
const resetpassword = async (req, res,next) => {
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

const searchproduct = async (req, res,next) => {
  try {
    const searchquery = req.query.search || ""; // Set a default value when searchquery is not provided

    const productData = await Product.find({
      $or: [
        { name: { $regex: searchquery, $options: "i" } },
        { brand: { $regex: searchquery, $options: "i" } },
        { description: { $regex: searchquery, $options: "i" } },
        { category: { $regex: searchquery, $options: "i" } },
      ],
    });

    res.render("users/shoplist", { products: productData, searchquery }); // Pass searchquery to the template
  } catch (error) {
    next(error);
  }
};
const addcart = async (req, res, next) => {
  const productId = req.params.id;
console.log(productId)
  try {
    const product = await Product.findById(productId);

    if (!product) {
      console.error('Product not found');
      return res.status(404).send('Product not found');
    }

    const userId = req.session.user_id;

    const user = await User.findById(userId);

    if (!user) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }

    const productToAdd = {
      product: productId,
      quantity: 1
    }
    console.log(productToAdd);
    const updatedUser = await User.updateOne({_id: userId},{
      $addToSet: {cart: productToAdd}
      
    },{upsert: true})
    const existingCartItem = user.cart.find((item) => item.product.toString() === productId);

     
    

   // await user.save();
    console.log('Product added to cart successfully',updatedUser);
    return res.status(200).send('Product added to cart successfully');
  } catch (error) {
  next(error);
  }
};

const logincart = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    if (!userId) {
      console.error('User not logged in');
      return res.redirect('/login'); // Redirect to login page or handle accordingly
    }

    const user = await User.findById(userId).populate('cart.product');

    if (!user) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }

    if (user.cart && user.cart.length > 0) {
      console.log('User Cart:', user.cart);
      return res.render('users/shopcart', { user, isUserLoggedIn: true });
    } else {
      return res.render('users/shopcart', {
        user,
        isUserLoggedIn: true,
        emptyCart: true
      });
    }
  } catch (error) {
    console.error('Error fetching user cart:', error);
    return res.status(500).send('Internal Server Error');
  }
};


module.exports = {
  loadindex,
  loadsales,
  loadunisex,
  loadmen,
  loadwomen,
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
  checkAuth,
  forgetload,
  forgetverify,
  forgetpasswordload,
  resetpassword,
  getCategories,
  searchproduct,
  logincart,
  addcart
};
