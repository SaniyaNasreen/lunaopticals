const express = require("express");
const app = express();
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const userroute = require("./routes/userroute");
const adminroute = require("./routes/adminroute");
const errorHandler = require("./miidleware/errorHandler");
require("./config/connectdb");
const nocache = require("nocache");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use("/public", express.static("public"));
app.use(nocache());
// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(errorHandler);
app.use("/", userroute);
app.use("/admin", adminroute);

app.listen(process.env.PORT, () => {
  console.log(`server is running http://localhost:${process.env.PORT}`);
});
