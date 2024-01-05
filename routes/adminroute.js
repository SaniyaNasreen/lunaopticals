const express = require("express");
const admin_route = express.Router();
const auth = require("../miidleware/auth");
const admincontroller = require("../controllers/admincontroller");
const productcontroller = require("../controllers/productcontroller");
const categorycontroller = require("../controllers/categorycontroller");
const ordercontroller = require("../controllers/ordercontroller");
const couponcontroller = require("../controllers/couponcontroller");
const multer = require("multer");
const upload = multer({ dest: "public/uploads" });

// loading pages and admin verify
admin_route.get("/indexhome", auth.isAdmin, admincontroller.loadIndex);

admin_route.get("/", admincontroller.loadLogin);
admin_route.post("/login", admincontroller.adminLogin);
admin_route.get("/logout", auth.isAdmin, admincontroller.adminLogout);

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
  "/categories/add-category",
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

//Order management
admin_route.get("/orders", auth.isAdmin, ordercontroller.loadOrder);
admin_route.get(
  "/orders/updateOrderStatus/:orderId/:action",
  auth.isAdmin,
  ordercontroller.updateStatus
);
admin_route.put(
  "/orders/updateOrderStatus/:orderId/",
  auth.isAdmin,
  ordercontroller.updateStatus
);
admin_route.get(
  "/orderInfo/:id",
  auth.isAdmin,
  ordercontroller.loadAdminOrderDetails
);

//Coupon management
admin_route.get("/coupon", couponcontroller.loadCoupon);
admin_route.post("/coupon/add-coupon", couponcontroller.addCouponForCategory);
admin_route.post(
  "/coupon/edit-coupon/:id",
  auth.isAdmin,
  couponcontroller.editCouponForCategory
);
module.exports = admin_route;
