const mongoose = require("mongoose");
const express = require("express");
const app = express();
const session = require("express-session");
const nocache=require("nocache")
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
app.use(nocache())
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));


 

// Routes //

const productsRouter= require('./routes/productroute');
const categoryRouter=require('./routes/categoryroute')
const userroute = require("./routes/userroute");
const adminroute = require("./routes/adminroute");
//  


const api=process.env.API_URL


app.use("/", userroute);
app.use("/admin", adminroute);
app.use(`${api}/products`,productsRouter)
app.use(`${api}/category`,categoryRouter)


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
