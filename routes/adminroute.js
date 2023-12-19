        const express = require("express");
        const admin_route = express.Router();
        const auth = require("../miidleware/adminauth");
        const admincontroller = require("../controllers/admincontroller");
        const productcontroller=require("../controllers/productcontroller")
        const categorycontroller=require("../controllers/categorycontroller")
        const session = require("express-session");
        const multer = require("multer");
        const app = express();
        const Category = require("../models/categorymodel");
        

       
// File type map for validating uploaded images
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/webp": "webp", // Add webp as an allowed file type
  
};
// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname.split(".").shift() + '-' + Date.now() + '.' + file.originalname.split('.').pop());
  }
});

// Add console logs to check the mimetype of the uploaded file
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isValidFileType = FILE_TYPE_MAP[file.mimetype];
    if (isValidFileType) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only PNG, JPEG, and JPG files are allowed."),
        false
      );
    }
  },
});
 
//app.use(upload.array('images', 5)); 
 

       
      
    



      
        admin_route.get("/indexhome",auth.isLogin,admincontroller.loadindex);
        admin_route.get("/products", productcontroller.loadproducts);
        admin_route.get("/categories",categorycontroller.loadcategory);
        admin_route.get("/categories",categorycontroller.fetchCategories);
        admin_route.get('/login',admincontroller.loadLogin);
        admin_route.get("/customers", admincontroller.loadcustomer);
        admin_route.get("/registration", admincontroller.loadregister);
        admin_route.post("/registration", admincontroller.insertAdmin);
        admin_route.get('/',admincontroller.loadLogin);
        admin_route.post("/", admincontroller.verifyLogin);
        admin_route.get("/logout", admincontroller.logout);
        admin_route.get("/logged", auth.isLogin, admincontroller.loadlogged);
        // admin_route.get("/addproduct", productcontroller.newproductLoad);
        admin_route.post("/products/addProduct/:id", upload.array('images'), productcontroller.addproduct);
        // admin_route.get("/addcategory", categorycontroller.newcategoryLoad);
        admin_route.post("/categories/addcategory/:id",upload.single('image'), categorycontroller.addcategory);
      
        admin_route.post("/products/editProduct/:id",upload.array('images'),productcontroller.updateproduct);
        admin_route.get("/edit-category",  categorycontroller.editcategoryLoad);
        admin_route.post("/edit-category",upload.single('image'), categorycontroller.updatecategory);
       
        admin_route.post("/customers/delete-user/:id", admincontroller.deleteUser);
        admin_route.post("/categories/unlistCategory/:id", categorycontroller.unlistCategory);
        admin_route.post('/products/unlist/:id',productcontroller.unlist );
        admin_route.get("/search-user",  admincontroller.searchUser);
        admin_route.get("/search-category",  categorycontroller.searchcategory);
        admin_route.get("/search-product",  productcontroller.searchproduct);

 

        module.exports = admin_route;
