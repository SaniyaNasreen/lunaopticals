const checkUserLoggedIn = (req, res, next) => {
    if (req.session && req.session.user_id) {
      res.locals.isLoggedIn = true;
    } else {
      res.locals.isLoggedIn = false;
    }
    next();
  };
  
  const isLogin = async (req, res, next) => {
    if (res.locals.isLoggedIn) {
      res.redirect('/');
    } else {
      next();
    }
  };
  
  const isLogout = async (req, res, next) => {
    if (!res.locals.isLoggedIn) {
      res.redirect('/login');
    } else {
      next();
    }
  };
module.exports={
    checkUserLoggedIn,
    isLogin,
    isLogout,
    
}