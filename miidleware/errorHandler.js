const errorHandler = (err, req, res, next) => {
    res.status(500).render("error", {
      message: "Something went wrong!",
      error: err.message 
    });
  };

module.exports=errorHandler