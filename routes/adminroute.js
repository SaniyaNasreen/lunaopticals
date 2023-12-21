const express = require("express");
const admin_route = express.Router();
const auth = require("../miidleware/auth");
const admincontroller = require("../controllers/admincontroller");
const productcontroller = require("../controllers/productcontroller");
const categorycontroller = require("../controllers/categorycontroller");
const app = express();
const Category = require("../models/categorymodel");
const upload = require("../utils/multer");

// loading pages and admin verify
admin_route.get("/indexhome", auth.isAdmin, admincontroller.loadIndex);
admin_route.get("/admin", auth.isAdmin, admincontroller.loadLogin);
admin_route.get("/", admincontroller.loadLogin);
admin_route.post("/login", admincontroller.adminLogin);
admin_route.get("/logout", admincontroller.adminLogout);

// Product Management
admin_route.get("/products", productcontroller.loadProducts);
admin_route.post(
  "/products/add-product",
  upload.array("images"),
  productcontroller.addProduct
);
admin_route.post(
  "/products/edit-product/:id",
  upload.array("images"),
  productcontroller.updateProduct
);
admin_route.post(
  "/products/unlist-product/:id",
  productcontroller.unlistProduct
);
admin_route.get("/search-product", productcontroller.searchProduct);

// Category Management
admin_route.get("/categories", categorycontroller.loadCategory);
admin_route.get("/categories", categorycontroller.getCategories);
admin_route.post(
  "/categories/add-category/:id",
  upload.single("image"),
  categorycontroller.addCategory
);
admin_route.post(
  "/categories/edit-category/:id",
  upload.single("image"),
  categorycontroller.updateCategory
);
admin_route.post(
  "/categories/unlist-category/:id",
  categorycontroller.unlistCategory
);
admin_route.get("/search-category", categorycontroller.searchCategory);

//User Management
admin_route.get("/customers", auth.isAdmin, admincontroller.loadCustomer);
admin_route.post("/customers/delete-user/:id", admincontroller.deleteUser);
admin_route.get("/search-user", admincontroller.searchUser);

module.exports = admin_route;
