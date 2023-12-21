const User = require("../models/usermodel");

const isAdmin = async (req, res, next) => {
  try {
    if (req?.session?.admin_id) {

      const adminData = await User.findOne({ _id: req.session.admin_id });

      if (!adminData) {
        res.render("admin/login", { message: "No Admin Found" });
        return;
      }
      if (adminData.is_admin === 0) {
        res.render("admin/login", { message: "This is not admin account" });
        return;
      }
      req.admin = adminData;
      next();
    } else {
      return res.redirect("/admin");
    }
  } catch (error) {
    next(error);
  }
};

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
