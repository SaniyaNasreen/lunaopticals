        const express = require("express");
        const admin_route = express.Router();
        const auth = require("../miidleware/adminauth");
        const admincontroller = require("../controllers/admincontroller");
        const session = require("express-session");
        




      
        admin_route.get("/indexhome",auth.isLogin,admincontroller.loadindex);
        admin_route.get("/products", admincontroller.loadproducts);
        admin_route.get("/categories",admincontroller.loadcategory)
        admin_route.get("/categories",admincontroller.fetchCategories)
        admin_route.get('/login',auth.isLogin,admincontroller.loadLogin)
        admin_route.get("/customers", admincontroller.loadcustomer);
        admin_route.get("/register", admincontroller.loadregister);
        admin_route.post("/register", admincontroller.insertUser);
        admin_route.get('/',admincontroller.loadLogin)
        admin_route.post("/", admincontroller.verifyLogin);
        admin_route.get("/logout", auth.isLogout, admincontroller.logout);
        admin_route.get("/logged", auth.isLogin, admincontroller.loadlogged);
        admin_route.get("/addproduct", admincontroller.newproductLoad);
        admin_route.post("/addproduct", admincontroller.addproduct);
        admin_route.get("/addcategory", admincontroller.newcategoryLoad);
        admin_route.post("/addcategory", admincontroller.addcategory);

        admin_route.get("/products/editProduct/:id",  admincontroller.editproductLoad);
        admin_route.post("/products/editProduct/:id",admincontroller.updateproduct);
        admin_route.get("/edit-category",  admincontroller.editcategoryLoad);
        admin_route.post("/edit-category", admincontroller.updatecategory);
        admin_route.post("/customers/delete-user/:id", admincontroller.deleteUser);
        admin_route.post("/categories/unlistCategory/:id", admincontroller.unlistCategory);
        admin_route.post('/products/unlist/:id',admincontroller.unlist );
        admin_route.get("/search-user",  admincontroller.searchUser);
        admin_route.get("/search-category",  admincontroller.searchcategory);
        admin_route.get("/search-product",  admincontroller.searchproduct);

 

        module.exports = admin_route;
