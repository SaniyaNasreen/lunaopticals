const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Admin = require("../models/adminmodel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const { name } = require("ejs");
const mongoose = require("mongoose");
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

const sendverifymail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.emailUser, // Use environment variables
        pass: config.emailpassword, // Use environment variables
      },
    });

    const mailOption = {
      from: "jafferkuwait0916@gmail.com",
      to: email,
      subject: "For varification mail",
      html:
        "<p>Hy " +
        name +
        ',please click here to <a href="http://localhost:4000/verify?id=' +
        user_id +
        ' ">Verify </a> your mail.</p> ',
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        const modal = `
            <div class="modal" tabindex="-1" id="myModal">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Email Sent</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <p>Email has been sent: ${info.response}</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  </div>
                </div>
              </div>
            </div>
          `;
      }
    });
  } catch (error) {
    next(error);
  }
};

const loadindex = async (req, res) => {
  try {
    if (req?.session?.admin_id) {
      return res.render("admin/indexhome");
    }else res.redirect("/admin/login")
  } catch (error) {
    console.log(error.message);
  }
};

const loadregister = async (req, res) => {
  try {
    return res.render("admin/registration");
  } catch (error) {
    console.log(error.message);
  }
};

const insertAdmin = async (req, res) => {
  try {
    console.log(req.body);
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
      // res.redirect('/home')
      res.render("admin/login", {
        message:
          "Your regestration has been susseccfull,please verify your mail.",
      });
    } else {
      throw new Error("Your registration has failed");
    }
  } catch (error) {
    // Pass the caught error to the error handling middleware
    next(error);
  }
};

const loadcustomer = async (req, res) => {
  try {
    const users = await User.find({ is_admin: 0 });
    if (!users) {
      // If no users are found, you might want to throw a specific error
      const error = new Error("No customers found");
      error.statusCode = 404; // Set a specific status code for this error
      throw error;
    }
    return res.render("admin/customers", { users: users });
  } catch (error) {
    next(error);
  }
};

// const loadproducts = async (req, res) => {
//     try {
//         const products = await Product.find(); // Fetch products from the database
//         return res.render('admin/products', { products }); // Pass products to the view
//     } catch (error) {
//         console.error(error.message);
//         return res.status(500).send('Error loading products'); // Handle error response
//     }
// };

const loadLogin = async (req, res) => {
  try {
    if (!req?.session?.admin_id) {
      res.render("admin/login");
    } else {
      res.redirect("/admin/indexhome");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await Admin.findOne({ email: email });
    if (adminData) {
      const passwordmatch = await bcrypt.compare(password, userData.password);

      if (passwordmatch) {
        if (adminData.is_admin === 1) {
          req.session.admin_id = adminData._id;

          return res.render("admin/lndexhome");
        } else {
          return res.redirect("/admin/login");
        }
      } else {
        return res.render("admin/login", {
          message: "Email or password is incorrect",
        });
      }
    } else {
      return res.render("admin/login", {
        message: "Email or password is incorrect",
      });
    }
  } catch (error) {
    next(error);
  }
};
const loadlogged = async (req, res) => {
  try {
    res.render("admin/logged");
  } catch (error) {
    console.log(error);
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.redirect("/admin/login");
  } catch (error) {
    next(error);
  }
};

//delete user //
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Toggle the 'listed' field between true and false
    user.is_blocked = !user.is_blocked;
    await user.save();

    // Success message or further operations after toggling the user status
    console.log(
      `User ${user.is_blocked ? "unblocked" : "blocked"} successfully:`,
      user
    );
    // Redirect to '/admin/customers' after successfully toggling the user status
    return res.redirect("/admin/customers");
  } catch (error) {
    next(error);
  }
};

const searchUser = async (req, res) => {
  try {
    const searchquery = req.query.search || ""; // Set a default value when searchquery is not provided

    const userData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: searchquery, $options: "i" } },
        { email: { $regex: searchquery, $options: "i" } },
      ],
    });

    res.render("admin/customers", { users: userData, searchquery }); // Pass searchquery to the template
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadindex,
  loadcustomer,
  loadregister,
  insertAdmin,
  loadLogin,
  verifyLogin,
  logout,
  loadlogged,
  deleteUser,
  searchUser,
};
