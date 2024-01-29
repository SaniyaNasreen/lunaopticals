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
    const totalCountOfOrders = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalCountOfOrders: { $sum: 1 },
        },
      },
    ]);

    const totalOrders =
      totalCountOfOrders.length > 0
        ? totalCountOfOrders[0].totalCountOfOrders
        : 0;

    const totalCountOfUsers = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          totalCountOfUsers: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalCountOfUsers: { $sum: 1 },
        },
      },
    ]);

    const totalUsers =
      totalCountOfUsers.length > 0 ? totalCountOfUsers[0].totalCountOfUsers : 0;

    const totalAmountOfProducts = await Order.aggregate([
      {
        $unwind: "$purchasedItems",
      },
      {
        $group: {
          _id: null,
          totalAmountOfProducts: { $sum: "$purchasedItems.price" },
        },
      },
    ]);
    const totalAmountProducts =
      totalAmountOfProducts.length > 0
        ? totalAmountOfProducts[0].totalAmountOfProducts
        : 0;
    const totalSales = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );

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
    const monthsOrder = await Order.aggregate([
      {
        $match: {
          date: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: "$date" } },
            year: { $year: { $toDate: "$date" } },
          },
          itemCount: { $sum: { $size: "$purchasedItems" } },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const monthlyUserCount = await Order.aggregate([
      {
        $match: {
          date: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: "$date" } },
            year: { $year: { $toDate: "$date" } },
            user: "$payment.user",
          },
          uniqueUsers: { $addToSet: "$payment.user" },
        },
      },
      {
        $group: {
          _id: {
            month: "$_id.month",
            year: "$_id.year",
          },
          userCount: { $sum: { $size: "$uniqueUsers" } },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const blockedUsersCount = await User.countDocuments({ is_blocked: true });
    const unblockedUsersCount = await User.countDocuments({
      is_blocked: false,
    });

    const monthsUser = await Order.aggregate([
      {
        $match: {
          date: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: "$date" } },
            year: { $year: { $toDate: "$date" } },
          },
          userCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const weekSales = {};
    const monthSales = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.date);
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
      totalCategories,
      totalProducts,
      totalCustomers: uniqueCustomers,
      weeklySalesData: weekSales,
      totalSalesData,
      totalOrdersData,
      totalCustomersData,
      lastMonthTotalSales,
      lastWeekTotalOrders,
      monthsOrder,
      monthsUser,
      totalAmountOfProducts,
      totalCountOfOrders,
      totalCountOfUsers,
      totalAmountProducts,
      totalUsers,
      totalOrders,
      monthlyUserCount,
      blockedUsersCount,
      unblockedUsersCount,
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
        totalCustomers,
        totalCategories,
        totalProducts,
        averageOrder,
        monthsOrder,
        monthsUser,
        totalAmountOfProducts,
        totalCountOfOrders,
        totalCountOfUsers,
        totalAmountProducts,
        totalUsers,
        totalOrders,
        monthlyUserCount,
        blockedUsersCount,
        unblockedUsersCount,
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
        totalCategories: totalCategories,
        totalProducts: totalProducts,
        averageOrder: averageOrder,
        monthsOrder,
        monthsUser,
        totalAmountOfProducts,
        totalCountOfOrders,
        totalCountOfUsers,
        totalAmountProducts,
        totalUsers,
        totalOrders,
        monthlyUserCount,
        blockedUsersCount,
        unblockedUsersCount,
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error("Error fetching sales details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadSalesReport = async (req, res, next) => {
  try {
    let query = {};
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (startDate && endDate) {
      const endOfDay = new Date(endDate + "T23:59:59.999Z");
      query.date = { $gte: new Date(startDate), $lte: endOfDay };
    }

    const sortOption = getSortOption(req.query.sort);

    const totalOrders = await Order.countDocuments(query);
    const sortedOrders = await Order.find(query).sort(sortOption).lean().exec();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

    const totalPages = Math.ceil(totalOrders / limit);
    const currentPage = page;
    const selectedSort = req.query.sort;

    res.render("admin/sales_report", {
      orders: paginatedOrders,
      selectedSort,
      currentPage,
      totalPages,
      totalItems: totalOrders,
      limit,
      req,
      section: "page",
      download: false,
    });
  } catch (error) {
    next(error);
  }
};

const getSortOption = (sortQuery) => {
  let sortOption = {};

  if (sortQuery === "price_asc") {
    sortOption = { price: 1 };
  } else if (sortQuery === "price_desc") {
    sortOption = { price: -1 };
  } else {
    sortOption = { createdAt: -1 };
  }

  return sortOption;
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
      section: "users",
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
  loadSalesReport,
  deleteUser,
  searchUser,
  salesdetails,
};
