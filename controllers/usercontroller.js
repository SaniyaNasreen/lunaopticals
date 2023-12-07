const User=require("../models/usermodel")
const bcrypt= require("bcrypt")
const Product=require("../models/productmodel")
const Category = require('../models/categorymodel');
const config= require("../config/config")
// const client = require('twilio')(config.accountSID, config.authToken);
const nodemailer=require("nodemailer")
const randomstring=require("randomstring")
const { name } = require("ejs")



// otp=======================



//..................bcrypt.......................   //

const securepassword= async(password)=>{
 try {
    const saltRounds=10;
    const passwordHash= await bcrypt.hash(password,saltRounds)
    return passwordHash
 } catch (error) {
   console.log(error.message);   
 }
}

// for send mail  //

const sendverifymail=async(name,email,user_id)=>{
     try {
        
const transporter = nodemailer.createTransport({
    service:'gmail',
  auth: {
    user:"saniyanasreen262@gmail.com",     // Use environment variables
    pass: "bbksxhldfudkmbkd"// Use environment variables
  }
});


        const mailOption={
            from:"saniyanasreen262@gmail.com",
            to: email,
            subject:'For varification mail',
            html:'<p>Hy '+name+',please click here to <a href="http://localhost:4000/verify?id='+user_id+' ">Verify </a> your mail.</p> '
        }
        transporter.sendMail(mailOption,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent:-",info.response);
            }
        })
     } catch (error) {
       console.log(error.message); 
     }
}


// for reset password mail //


const sendresetpasswordmail=async(name,email,token)=>{
    try {

const transporter = nodemailer.createTransport({
   service:'gmail',
 auth: {
   user:"saniyanasreen262@gmail.com",     // Use environment variables
   pass:"bbksxhldfudkmbkd" // Use environment variables
 }
});

       const mailOption={
           from:"saniyanasreen262@gmail.com",
           to: email,
           subject:'For Reset Password',
           html:'<p>Hy '+name+',please click here to <a href="http://localhost:4000/forgetPassword?token='+token+' "> Reset </a> your password.</p> '
       }
       transporter.sendMail(mailOption,function(error,info){
           if(error){
               console.log(error);
           }else{
               console.log("Email has been sent:-",info.response);
           }
       })
    } catch (error) {
      console.log(error.message); 
    }
}



//...............load home........................//


const loadindex = async (req, res) => {
  try {
    // Fetch only two categories from the database (assuming you have a condition or some logic to limit the categories)
    const categories = await Category.find().limit(2); // Adjust the condition or logic to limit the categories

    // Fetch other necessary data like products (assuming you need them)
    const products = await Product.find() // Fetch products data as needed

    // Render the 'indexhome' view and pass 'categories' and 'products' to it
    res.render('users/indexhome', { categories, products });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error loading indexhome');
  }
};


const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories); // Assuming you're sending JSON response
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
};





//.....................load sales.......................//

const loadsales = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch products data as needed

    res.render('users/shoplist', { products }); // Pass 'products' to the view
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error loading shoplist');
  }
}
 




//....................load unisex....................//

const loadunisex = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch products data as needed

    res.render('users/unisex', { products }); // Pass 'products' to the view
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error loading unisex category');
  }
}



//....................load Men....................//

const loadmen = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch products data as needed

    res.render('users/men', { products }); // Pass 'products' to the view
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error loading mens category');
  }
}


//....................load unisex....................//

const loadwomen = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch products data as needed

    res.render('users/women', { products }); // Pass 'products' to the view
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error loading womens category');
  }
}



 //...................load register page ................//

const loadRegister= async(req,res)=>{
    try {
      return  res.render('users/registration');

    } catch (error) {
        console.log(error.message); 
    }
}

const insertUser= async(req,res)=>{
    try {
        console.log(req.body)
        if (req.body.password !== req.body.confirm_password) {
            res.render('/registration', {  message: "Password and Confirm Password do not match" });
            return;
          }
          
        const spassword=await securepassword(req.body.password)
        const user= new User({
            name:req.body.name,
            email:req.body.email, 
            mobile:req.body.mobile,
            password:spassword, 
            cpassword:spassword,

            country:req.body.country, 
            is_admin:0
          
        })
       const userData= await user.save()

       if(userData){
        req.session.user_id = userData._id; 
        sendverifymail(req.body.name,req.body.email,userData._id)
        // res.redirect('/home')
        res.render('users/login',{message:"Your regestration has been susseccfull,please verify your mail."})
       }else{
        res.render('/registration',{message:"Your registration has been failed"})
       }
    } catch (error) {
     res.send(error.message)        
    }
}

//......................... user login......................... //

const loginLoad= async(req,res)=>{
   try {
    res.render('users/login')
   } catch (error) {
    console.log(error.message);
   }
}

const verifylogin= async(req,res)=>{
        try {
           const email=req.body.email
           const password=req.body.password
           const categories = await Category.find().limit(2); // Adjust the condition or logic to limit the categories

           // Fetch other necessary data like products (assuming you need them)
           const products = await Product.find() // Fetch products data as needed
         const userData= await User.findOne({email:email}) 
         if(userData){
          
             const passwordmatch= await bcrypt.compare(password,userData.password)
             if(passwordmatch){
                if(userData.is_admin===0){
                  req.session.user_id = userData._id;
                  res.render('users/indexhome', { categories, products });
                }else{
                    req.session.user_id=userData._id
                    res.redirect("admin/indexhome")
    
                } 
            }else{
                res.render('users/login',{message:"Email or password incorrect"})
            }
         }else{
          res.render('users/login',{message:"Email or password incorrect"})
         }
        } catch (error) {
            console.log(error.message);
        }
}
const loadHome=async(req,res)=>{
    try {
      const categories = await Category.find().limit(2); // Adjust the condition or logic to limit the categories

      // Fetch other necessary data like products (assuming you need them)
      const products = await Product.find() // Fetch products data as needed
  
      // Render the 'indexhome' view and pass 'categories' and 'products' to it
      res.render('users/indexhome', { categories, products });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Error loading indexhome');
    }
  };
``
const loaddetails = async (req, res) => {
  try {
      const productId = req.params.id; 

      const product = await Product.findById(productId);
      console.log(product);

      if (!product) {
          // Handle case where product with the given ID is not found
          return res.status(404).send('Product not found');
      }

      // Render the 'users/shopdetails' view and pass the product data to it
      return res.render('users/shopdetails', { product });
  } catch (error) {
      console.error(error.message);
      return res.status(500).send('Error loading details');
  }
};

const userLogout=async(req,res)=>{
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

// ================sending otp========================

const sendEmailOtp = async (req, res) => {
  try {
    res.render('users/emailOTP', { message: '' });
  } catch (error) {
    console.log(error.message);
  }
};


const enterOtpForm = async (req, res) => {
  try {
    res.render('users/enterotp', { message: '' });
  } catch (error) {
    console.log(error.message);
  }
};
//   // =====================email logic=============================

const generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000);
};

const emailOtp = (email, OTP) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
      },
    });

    const mailOptions = {
      from: 'jafferkuwait0916@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `DO NOT SHARE: Your OTP is ${OTP}`,
    };

    transporter.sendMail(mailOptions)
      .then((info) => {
        console.log('Email sent: ' + info.response);
        resolve(info);
      })
      .catch((error) => {
        console.error('Error sending OTP: ' + error.message);
        reject(error);
      });
  });
};





// Controller for sending OTP and rendering the form to enter OTP
const loginotp = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email });
    

        // sendOTP(mobile, OTP);
         
  
    if (userData) {
      req.session.user_id = userData._id;

      if (userData.is_varified === 0) {

        res.render('users/emailOTP', { message: "Please verify your mail" });
      } else {
        const OTP = generateOTP();
        await User.updateOne({ email }, { $set: { token: OTP } });
        emailOtp(email, OTP);
        res.render('users/enterotp', { message: "Please check your mail for OTP", email });
      }
    } else {
      res.render('users/emailOTP', { message: "User email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    res.render('users/emailOTP', { message: "An error occurred. Please try again later." });
  }
};

const verifyotp = async (req, res) => {
  try {
    console.log( req.session.enterotp);
    if (req.session.enterotp) {
      req.session.user_id = userData._id;

      const user=await User.findOne({email})
      const enteredOTP = req.body.otp; // Assuming OTP is sent via query params (e.g., /verifyotp?otp=123456)
      console.log('Entered OTP:', enteredOTP);

      // Retrieve the previously generated OTP from the session
      const generatedOTP = user.token; // Assuming the generated OTP is stored in req.session.enterotp

      if (enteredOTP === generatedOTP) {
        // OTPs match, proceed to home page
        console.log('OTP Matched. Redirecting to home page.');
        req.session.user = true; // Set a user session flag or any necessary session data
        res.redirect('users/indexhome'); // Redirect to the home page or any other appropriate route
      } else {
        // OTPs don't match, render enterotp page with an error message
        console.log('Rendering enterotp with error message');
        res.render('users/enterotp', { message: 'The OTP is incorrect' });
      }
    } else {
      console.log('Session EnterOTP is false or undefined');
      res.render('users/enterotp', { message: 'Session Expired or OTP not generated' });
      // Or handle session expiration/error as needed
    }
  } catch (error) {
    console.log('Error:', error.message);
    res.render('users/enterotp', { message: 'An error occurred. Please try again later.' });
    // Handle other errors gracefully
  }
};
// forget password code //

const forgetload=async(req,res)=>{
    try {
        res.render('users/forget');
    } catch (error) {
        console.log(error.message);
    }
    }


// verify forget password on mail //

const forgetverify=async(req,res)=>{
    try {
        email=req.body.email;
        const userData = await User.findOne({email:email})
        if(userData){

          if(userData.is_varified=== 0){
            res.render('users/forget',{message:"Please verify your mail"})
          }else{
            const randomString= randomstring.generate();
            const updateData=await User.updateOne({email:email},{$set:{token:randomString}})
            sendresetpasswordmail(userData.name,userData.email,randomString);
            res.render('users/forget',{message:"please check your mail to reset your password."})
          }
        }else{
            res.render('users/forget',{message:"User email is incorrect"})
        }
    } catch (error) {
       console.log(error.message); 
    }
}

const verifymail=async(req,res)=>{
    try {
      const updateinfo= await User.updateOne({_id:req.query.id},{$set:{ is_varified:1 }}) 

      console.log(updateinfo);
      res.render('users/emailvarified')
    } catch (error) {
        console.log(error.message);
    }
}

const forgetpasswordload=async(req,res)=>{
    try {
       const token=req.query.token 
     const tokenData= await User.findOne({token:token})

     if(tokenData){
        res.render('users/forgetPassword',{user_id:tokenData._id})
     }else{
        res.render('404',{message:"Token is invalid."})
     }
      } catch (error) {
        console.log(error.message);
    }
}
const resetpassword=async(req,res)=>{
    try {
        const password= req.body.password;
        const user_id= req.body.user_id;

        const secure_password=await securepassword(password);

       const updateData=await User.findByIdAndUpdate({_id:user_id},{ $set:{ password:secure_password , token:''}})
    res.redirect('/')
    } catch (error) {
        console.log(error.message);
    } 
}
module.exports={
    loadindex,
    loadsales,
    loadunisex,
    loadmen,
    loadwomen,
    loadRegister,
    insertUser,
    // sendOTP,
    // mobileOtp,
    // verifyOTP,
    verifymail,
    // signupUser,
    loginLoad,
    loaddetails,
    verifylogin,
    // sendOtp,
   enterOtpForm,
    verifyotp,
    loginotp,
    loginLoad,
    sendEmailOtp,
    emailOtp, 
    loadHome,
    userLogout,
    forgetload,
    forgetverify,
    forgetpasswordload,
    resetpassword,
    getCategories
}


