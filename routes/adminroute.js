        const express = require("express");
        const admin_route = express.Router();
        const auth = require("../miidleware/adminauth");
        const admincontroller = require("../controllers/admincontroller");
        const productcontroller=require("../controllers/productcontroller")
        const categorycontroller=require("../controllers/categorycontroller")
        const session = require("express-session");
        const multer = require("multer");
        const Category = require("../models/categorymodel");
        
// File type map for validating uploaded images
const FILE_TYPE_MAP = {
        "/image/png": "png",
        "/image/jpeg": "jpeg",
        "/image/jpg": "jpg",
      };
      
      // Multer storage configuration
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          // Define the destination where uploaded category images will be stored
          cb(null, 'public/category_images'); // Update the destination folder as needed
        },
        filename: function (req, file, cb) {
          // Generate unique filenames for uploaded category images
          cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop());
        }
      });
      
      
      // Multer upload options
      const upload = multer({ storage: storage });
       
      
      
       
      
      admin_route.post("/", upload.single('icon'), async (req, res) => {
        try {
          const { name } = req.body;
          const iconPath = req.file.path; // Get the path of the uploaded image
      
          // Create a new category with the provided name and the uploaded image path
          let category = new Category({
            name: name,
            icon: iconPath, // Store the image path in the 'icon' field of the Category model
            // Other properties...
          });
      
          category = await category.save();
      
          if (!category) {
            return res.status(404).send("The category cannot be created");
          }
          res.send(category);
        } catch (error) {
          console.log(error.message);
          res.status(500).send("Internal Server Error");
        }
      });



      
        admin_route.get("/indexhome",auth.isLogin,admincontroller.loadindex);
        admin_route.get("/products", productcontroller.loadproducts);
        admin_route.get("/categories",categorycontroller.loadcategory)
        admin_route.get("/categories",categorycontroller.fetchCategories)
        admin_route.get('/login',auth.isLogin,admincontroller.loadLogin)
        admin_route.get("/customers", admincontroller.loadcustomer);
        admin_route.get("/registration", admincontroller.loadregister);
        admin_route.post("/registration", admincontroller.insertAdmin);
        admin_route.get('/',admincontroller.loadLogin)
        admin_route.post("/", admincontroller.verifyLogin);
        admin_route.get("/logout", auth.isLogout, admincontroller.logout);
        admin_route.get("/logged", auth.isLogin, admincontroller.loadlogged);
        admin_route.get("/addproduct", productcontroller.newproductLoad);
        admin_route.post("/addproduct", productcontroller.addproduct);
        admin_route.get("/addcategory", categorycontroller.newcategoryLoad);
        admin_route.post("/addcategory", categorycontroller.addcategory);
        admin_route.get("/products/editProduct/:id",  productcontroller.editproductLoad);
        admin_route.post("/products/editProduct/:id",productcontroller.updateproduct);
        admin_route.get("/edit-category",  categorycontroller.editcategoryLoad);
        admin_route.post("/edit-category", categorycontroller.updatecategory);
        admin_route.post("/customers/delete-user/:id", admincontroller.deleteUser);
        admin_route.post("/categories/unlistCategory/:id", categorycontroller.unlistCategory);
        admin_route.post('/products/unlist/:id',productcontroller.unlist );
        admin_route.get("/search-user",  admincontroller.searchUser);
        admin_route.get("/search-category",  categorycontroller.searchcategory);
        admin_route.get("/search-product",  productcontroller.searchproduct);

 

        module.exports = admin_route;
