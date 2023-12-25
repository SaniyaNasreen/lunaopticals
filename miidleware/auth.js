const User = require("../models/usermodel");
const isUserBlocked = async (req, res, next) => {
  try {
    if (req?.session?.user_id) {
      const userData = await User.findOne({ _id: req.session.user_id });

      if (userData.is_blocked) {
        res.render("users/login", {
          errorWith: "USER",
          message: "Your account has been blocked due to some reasons",
        });
        return;
      }
      req.user = userData;
      next();
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
};

const isUser = async (req, res, next) => {
  try {
    if (req?.session?.user_id) {
      const userData = await User.findOne({ _id: req.session.user_id });

      if (!userData) {
        res.render("users/login", { message: "No User Found" });
        return;
      }
      if (userData.is_blocked) {
        res.render("users/login", {
          message: "Your account has been blocked due to some reasons",
        });
        return;
      }
      if (userData.is_varified === 0) {
        res.render("users/login", { message: "Email not Varified" });
        return;
      }
      if (userData.is_admin === 1) {
        res.render("users/login", { message: "This is not user account" });
        return;
      }
      req.user = userData;
      next();
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    next(error);
  }
};

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

module.exports = {
  isUserBlocked,
  isUser,
  isAdmin,
};
