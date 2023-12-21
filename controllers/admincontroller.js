const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Admin = require("../models/adminmodel");
const bcrypt = require("bcrypt");
const { name } = require("ejs");
const Category = require("../models/categorymodel");

const securepassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    if (!req?.session?.admin_id) {
      res.render("admin/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const adminData = await User.findOne({ email: email });
    if (!adminData) {
      res.render("admin/login", { message: "Email or password is incorrect" });
      return;
    }

    const passwordmatch = await bcrypt.compare(password, adminData.password);
    if (!passwordmatch) {
      res.render("admin/login", { message: "Password is incorrect" });
      return;
    }
    if (adminData.is_admin === 0) {
      res.redirect("/admin/login");
      return 
    }
    req.session.admin_id=adminData._id
     res.redirect("/admin/indexhome");
  } catch (error) {
    next(error);
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.admin_id=null;
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

//.....Loading Dashboard.....//
const loadindex = async (req, res) => {
  try {
    if (req?.session?.admin_id) {
      return res.render("admin/indexhome");
    } else res.redirect("/admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

const insertAdmin = async (req, res) => {
  try {
    if (req.body.password !== req.body.confirm_password) {
      res.render("registration", {
        message: "Password and Confirm Password do not match",
      });
      return;
    }

    const spassword = await securepassword(req.body.password);
    const admin = new Admin({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 1,
    });
    const adminData = await admin.save();
    if (adminData) {
      req.session.admin_id = adminData._id;

      sendverifymail(req.body.name, req.body.email, adminData._id);
      res.render("admin/login", {
        message:
          "Your regestration has been susseccfull,please verify your mail.",
      });
    } else {
      throw new Error("Your registration has failed");
    }
  } catch (error) {
    next(error);
  }
}; 

const loadcustomer = async (req, res) => {
  try {
    const users = await User.find({ is_admin: 0 });
    if (!users) {
      const error = new Error("No customers found");
      error.statusCode = 404;
      throw error;
    }
    return res.render("admin/customers", { users: users });
  } catch (error) {
    next(error);
  }
};

//.....................................delete user......................................//
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    user.is_blocked = !user.is_blocked;
    await user.save();
    return res.redirect("/admin/customers");
  } catch (error) {
    next(error);
  }
};

//....................................Search User.......................................//
const searchUser = async (req, res) => {
  try {
    const searchquery = req.query.search || "";
    const userData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: searchquery, $options: "i" } },
        { email: { $regex: searchquery, $options: "i" } },
      ],
    });
    res.render("admin/customers", { users: userData, searchquery });
  } catch (error) {
    next(error);
  }
};

//............................................Exports...................................//
module.exports = {
  loadindex,
  loadcustomer,
  insertAdmin,
  loadLogin,
  adminLogin,
  adminLogout,
  deleteUser,
  searchUser,
};
