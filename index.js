const mongoose = require("mongoose");
const express = require("express");
const app = express();
const session = require("express-session");

const logger = require("morgan");
const path = require("path");

require("dotenv").config()


//Middleware //

app.use(logger("dev")); // Morgan should come before the routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "process.env.secret",
    resave: false,
    saveUninitialized: true,
  })
); 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use('/public',express.static("public"));

const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  next();
};

app.use(noCache);


// Regular middleware
// app.get('/', (req, res, next) => {
//   // Some processing that might throw an error
//   try {
//     // ...
//     throw new Error('Oops! Something went wrong.');
//   } catch (error) {
//     next(error); // Pass the error to the next middleware
//   }
// });

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(500).json({ error: error.message }); // Respond with an error message
});


// Error handling middleware function
const errorHandler = (err, req, res, next) => {
  res.status(500).render("error", {
    message: "Something went wrong!",
    error: err.message // Display the error message to the user
  });
};


// Apply the error handling middleware globally
app.use(errorHandler);

 
// Routes //

 
const userroute = require("./routes/userroute");
const adminroute = require("./routes/adminroute");
//  


const api=process.env.API_URL


app.use("/", userroute);
app.use("/admin", adminroute);
 


// Database //

mongoose.connect(process.env.CONNECTION_STRING)
.then(()=>{
console.log('Database Connection is ready...');
})
.catch((err)=>{
    console.log(err);
})


// Server //

app.listen(4000,  ()=> {
  console.log("server is running http://localhost:4000 ");
});
