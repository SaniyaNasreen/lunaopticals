const express = require("express");
const admin_route = express.Router();
const auth = require("../miidleware/adminauth");
const admincontroller = require("../controllers/admincontroller");
const productcontroller=require("../controllers/productcontroller")
const categorycontroller=require("../controllers/categorycontroller")
const app = express();
const Category = require("../models/categorymodel");
const upload = require("../utils/multer");

// loading pages and admin verify 
admin_route.get("/indexhome",auth.isAdmin,admincontroller.loadindex);

admin_route.get('/admin',auth.isAdmin,admincontroller.loadLogin);
admin_route.get('/',admincontroller.loadLogin);
admin_route.post("/login", admincontroller.verifyLogin);
admin_route.get("/logout", admincontroller.logout);

// Product Management
admin_route.get("/products", productcontroller.loadproducts);
admin_route.post("/products/addProduct", upload.array('images'), productcontroller.addproduct);
admin_route.post("/products/editProduct/:id",upload.array('images'),productcontroller.updateproduct);
admin_route.post('/products/unlist/:id',productcontroller.unlist );
admin_route.get("/search-product",  productcontroller.searchproduct);

// Category Management
admin_route.get("/categories",categorycontroller.loadcategory);
admin_route.get("/categories",categorycontroller.fetchCategories);
admin_route.post("/categories/addcategory/:id",upload.single('image'), categorycontroller.addcategory);
admin_route.post("/categories/editcategory/:id",upload.single('image'), categorycontroller.updatecategory);
admin_route.post("/categories/unlistCategory/:id", categorycontroller.unlistCategory);
admin_route.get("/search-category",  categorycontroller.searchcategory);

//User Management
admin_route.get("/customers",auth.isAdmin,admincontroller.loadcustomer);
admin_route.post("/customers/delete-user/:id", admincontroller.deleteUser);
admin_route.get("/search-user",  admincontroller.searchUser);

module.exports = admin_route;
