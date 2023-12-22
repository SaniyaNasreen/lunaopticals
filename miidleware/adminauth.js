const User = require("../models/usermodel");

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin_id) {
      return res.redirect("/admin");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isAdmin,
  isLogout,
  // isAdminLogin
};
