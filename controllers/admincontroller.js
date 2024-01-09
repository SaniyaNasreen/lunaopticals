const User = require("../models/usermodel");
const Admin = require("../models/adminmodel");
const Order = require("../models/ordermodel");
const bcrypt = require("bcrypt");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");

const securePassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    if (req?.session?.admin_id) {
      res.redirect("/admin/indexhome");
    } else {
      res.render("admin/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const adminData = await User.findOne({ email: email });
    if (!adminData) {
      res.render("admin/login", { message: "Email or password is incorrect" });
      return;
    }

    const passwordmatch = await bcrypt.compare(password, adminData.password);
    if (!passwordmatch) {
      res.render("admin/login", { message: "Password is incorrect" });
      return;
    }
    if (adminData.is_admin === 0) {
      console.log("Not an admin");
      res.redirect("/admin/login");
      return;
    }
    console.log("Setting admin_id session");
    req.session.admin_id = adminData._id;
    res.redirect("/admin/indexhome");
  } catch (error) {
    next(error);
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.admin_id = null;
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

const salesdetails = async (req, res) => {
  console.log("heyy");
  function getWeekNumber(date) {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const millisecondsPerWeek = 604800000;
    return Math.ceil((date - oneJan) / millisecondsPerWeek + 1);
  }

  try {
    const products = await Product.find({});
    const categories = await Category.find({});
    const orders = await Order.find({})
      .populate("user")
      .populate("purchasedItems.product");
    const totalSales = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalCategories = categories.length;
    const averageOrder = totalSales / totalOrders;
    const uniqueCustomers = new Set(orders.map((order) => order.user._id)).size;
    const totalSalesData = orders.map((order) => order.totalAmount);
    const totalOrdersData = orders.map((order, index) => index + 1);
    const totalCustomersData = Array.from(
      { length: totalOrders },
      (_, index) => index + 1
    );
    const lastWeekTotalOrders = totalOrdersData[totalOrdersData.length - 2];
    const lastMonthTotalSales = totalSalesData[totalSalesData.length - 2];

    // const totalAmountLastWeek = lastWeekTotalOrders.reduce(
    //   (acc, order) => acc + order.totalAmount,
    //   0
    // );

    const weekSales = {};
    const monthSales = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.date); // Assuming there's a 'date' field in your order schema
      const weekNumber = getWeekNumber(orderDate);
      const monthYear =
        orderDate.getMonth() + 1 + "-" + orderDate.getFullYear();

      if (!weekSales[weekNumber]) {
        weekSales[weekNumber] = 0;
      }
      if (!monthSales[monthYear]) {
        monthSales[monthYear] = 0;
      }

      weekSales[weekNumber] += order.totalAmount;
      monthSales[monthYear] += order.totalAmount;
    });

    console.log("Sales details fetched successfully");
    return {
      orders,
      totalSales,
      weekSales,
      averageOrder,
      totalOrders,
      totalCategories,
      totalProducts,
      totalCustomers: uniqueCustomers,
      weeklySalesData: weekSales,
      totalSalesData,
      totalOrdersData,
      totalCustomersData,
      lastMonthTotalSales,
      lastWeekTotalOrders,
      // totalAmountLastWeek,
    };
  } catch (error) {
    console.error("Error fetching sales details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//.....Loading Dashboard.....//
const loadIndex = async (req, res) => {
  try {
    if (req?.session?.admin_id) {
      const salesDetails = await salesdetails();
      if (!salesDetails || !salesDetails.weeklySalesData) {
        console.error("Sales details not available or missing necessary data");
        return res.status(500).json({ error: "Sales details not available" });
      }
      const {
        weekSales,
        weeklySalesData,
        totalSales,
        totalSalesData,
        totalOrdersData,
        totalCustomersData,
        lastWeekTotalOrders,
        lastMonthTotalSales,
        orders,
        totalOrders,
        totalCustomers,
        totalCategories,
        totalProducts,
        averageOrder,
        // totalAmountLastWeek,
      } = salesDetails;
      return res.render("admin/indexhome", {
        weeklySalesData: weeklySalesData,
        totalSales: totalSales,
        totalSalesData: totalSalesData,
        totalOrdersData: totalOrdersData,
        totalCustomersData: totalCustomersData,
        weekSales: weekSales,
        lastWeekTotalOrders: lastWeekTotalOrders,
        lastMonthTotalSales: lastMonthTotalSales,
        orders: orders,
        totalCustomers: totalCustomers,
        totalOrders: totalOrders,
        totalCategories: totalCategories,
        totalProducts: totalProducts,
        averageOrder: averageOrder,
        // totalAmountLastWeek: totalAmountLastWeek,
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error("Error fetching sales details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadCustomer = async (req, res, next) => {
  try {
    const users = await User.find({ is_admin: 0 });
    if (!users) {
      const error = new Error("No customers found");
      error.statusCode = 404;
      throw error;
    }
    let sortOption = {};
    const sortQuery = req.query.sort;
    if (sortQuery === "price_asc") {
      sortOption = { price: 1 };
    } else if (sortQuery === "price_desc") {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const totalUser = await User.countDocuments();
    const sortedUser = await User.find().sort(sortOption).lean().exec();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedUser = sortedUser.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalUser / limit);
    const currentPage = page;
    const selectedSort = sortQuery;
    return res.render("admin/customers", {
      users: users,
      selectedSort,
      currentPage,
      totalPages,
      totalItems: totalUser,
      users: paginatedUser,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    user.is_blocked = !user.is_blocked;
    await user.save();
    return res.redirect("/admin/customers");
  } catch (error) {
    next(error);
  }
};

const searchUser = async (req, res) => {
  try {
    const searchquery = req.query.search || "";
    const userData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: searchquery, $options: "i" } },
        { email: { $regex: searchquery, $options: "i" } },
      ],
    });
    res.render("admin/customers", { users: userData, searchquery });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadIndex,
  loadCustomer,
  loadLogin,
  adminLogin,
  adminLogout,
  deleteUser,
  searchUser,
  salesdetails,
};
