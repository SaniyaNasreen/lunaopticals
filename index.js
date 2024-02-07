const express = require("express");
const app = express();
const ejs = require("ejs");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const userroute = require("./routes/userroute");
const adminroute = require("./routes/adminroute");
const errorHandler = require("./miidleware/errorHandler");
require("./config/connectdb");
const nocache = require("nocache");
const easyinvoice = require("easyinvoice");
const puppeteer = require("puppeteer");
const Order = require("./models/ordermodel");
const User = require("./models/usermodel");
const Offer = require("./models/usermodel");
const fs = require("fs");
const Category = require("./models/categorymodel");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use("/public", express.static("public"));
app.use(nocache());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(errorHandler);
app.use("/", userroute);
app.use("/admin", adminroute);

app.get("/download-invoice/:orderNumber", async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    const order = await Order.findOne({ orderNumber })
      .populate("user")
      .populate("purchasedItems.product");
    if (!order) {
      return res.status(404).send("Order not found");
    }
    if (!order.address || !order.address.firstname || !order.address.email) {
      return res.status(400).send("Invalid order address");
    }
    const userId = req.session.user_id;
    console.log("user_id", userId);
    const user = await User.findOne({ _id: userId });
    console.log("user", user);
    const clientName = `${order.address.firstname} ${
      order.address.lastname || ""
    }`;
    const clientAddress = order.address.address || "N/A";
    const clientEmail = order.address.email || "N/A";

    const productsData = await Promise.all(
      order.purchasedItems.map(async (item) => {
        const product = item.product;
        console.log(product.category._id);
        console.log(product._id);
        const offer = await Offer.findOne({
          $or: [{ product: product._id }, { category: product.category }],
        });
        console.log("off", offer);
        if (offer) {
          console.log("hello");
          if (offer.status === "Active" && offer.validity > new Date()) {
            const discountAmount = product.price * (offer.discount / 100);
            console.log(discountAmount);
            product.price -= discountAmount;
          }
        }
        return {
          description: item.product.name || "N/A",
          quantity: item.quantity || 0,
          price: product.price || 0,
        };
      })
    );
    console.log(productsData);
    const data = {
      client: {
        name: clientName,
        address: clientAddress,
        email: clientEmail,
      },
      invoice: {
        number: order.orderNumber,
        date: order.date.toISOString().split("T")[0],
      },
      products: productsData,
      billing: {
        address: clientAddress,
      },
      settings: {
        currency: "USD",
      },
    };
    const totalAmount = user.totalAmount;
    const productRows = data.products.map(
      (product) => `
        <tr>
        <td>${product.name}</td>
          <td>${product.description}</td>
          <td>${product.quantity}</td>
          <td>$${product.price}</td>
          <td>$${user.totalAmount}</td>
        </tr>
      `
    );

    console.log(productsData);
    const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Order Invoice</title>
        <style>
          /* Your CSS styles here */
          /* ... */
          .invoice-products table {
            border-collapse: collapse; 
            width: 100%; 
          }
        
          .invoice-products thead th {
            border-bottom: 1px solid black;  
            padding-top: 10px; 
            position:relative;
            right:30px;
             font-size:25px;
          }
        
          .invoice-products tbody td {
            padding-top: 10px; 
            font-size:20px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header" >
            <!-- Replace the heading with an image -->
            <img src="'/public/images\ \(1\).jpg'" alt="Invoice Header Image" />
            <p>Contact Number:8921047415|| saniyanasreen@gamil.com</p>
            <h4>Tech Connect Retail Private Limited<p>Gandhi nagar,Second Street,Delhi,675846</p></h4> 
          </div>
          <div class="invoice-details" style="display:flex;position:relative; top:130px;border-style:groove;border: 1px solid black;  border-left: none; border-right: none;" >
          <div style="font-size:20px ;">
          <h3>Order Dates:</h3>
          <p>Order Date: ${data.invoice.date}</p>
          <p>Current Date: ${new Date().toISOString().split("T")[0]}</p>
          </div>
          <div style="font-size:20px;position:relative; left:30px">
            <h3>Shipping Address</h3>
            <p>${data.client.name},<br>${data.client.address},<br>${
      data.client.email
    }</p>
            
           </div>  
          </div>
          <div class="invoice-products"style=" height:100px; position:relative; top:120px;border-style:groove; border: 1px solid black;  border-left: none; border-top:none;border-right: none;">
            <!-- Heading for products -->
            
            <!-- Display product details -->
            <table>
        
              <thead >
              
                <tr>
                <th >Name</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr> 
              </thead>
           
              <tbody>
              
                ${productRows.join("")}
              </tbody>
           
            </table>
          </div>
          <div class="invoice-total"style="font-size:20px;display:flex;position:relative; top:170px;border-style:groove; border : 1px solid black;border-top:none; padding-left:600px ; border-left: none; border-right: none;  ">
            <!-- Calculate and display the total amount -->
            <div style="position:relative;left:200px">
            <h3  style="float:left; ">Total Amount: $${totalAmount}</h3> 
          </div> 
        </div> 
      </body>
      <p style="position:relative; top:190px;left:300px;">This is computer generated invoice .No signature required.</p>
    </html>
    `;
    const browser = await puppeteer.launch({
      headless: "new",
    });
    const page = await browser.newPage();
    await page.setContent(invoiceHTML);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice_${order.orderNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/download-sales-report", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).send("Please provide both start and end dates");
    }
    const orders = await Order.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).populate("user");

    // Check if no orders were found
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .send("No orders found for the specified date range");
    }

    const htmlContent = `
    <style>
  .nk-tb-list {
    border-collapse: collapse;
    width: 100%;
    margin-top: 20px;
  }

  .nk-tb-list th, .nk-tb-list td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  .nk-tb-list th {
    background-color: #f2f2f2;
  }

  .nk-tb-item {
    background-color: #fff;
  }
</style>
<h1>Sales Report</h1>
    <table class="nk-tb-list">
      <thead style=" font-size:14px;">
        <tr>
          
          <th>Date</th>
          <th>Order Number</th>
          <th>Product Name</th>
          <th>Product Price</th>
          <th>Product Quantity</th>
          <th>Total Amount</th> 
        </tr>
      </thead>
      <tbody>

        ${orders
          .map(
            (order) => `
          <tr class="nk-tb-item">
            
            <td style=" font-size:10px;">${
              order.date instanceof Date ? order.date.toDateString() : ""
            }</td>
            <td><span style="color: blue; font-weight: 500; font-size:10px;">#${
              order.orderNumber
            }</span></td>
            <td>${
              order.purchasedItems && order.purchasedItems.length > 0
                ? order.purchasedItems
                    .map(
                      (item) =>
                        `<span class="tb-sub text-primary" style="font-size: 11px; font-weight: 500;">${
                          item.product
                            ? item.product
                            : "Product Name Not Available"
                        }</span>`
                    )
                    .join("")
                : '<span class="tb-sub">No purchased items</span>'
            }</td>
            <td>${
              order.purchasedItems && order.purchasedItems.length > 0
                ? order.purchasedItems
                    .map(
                      (item) =>
                        `<span class="tb-lead" style="color: rgb(127, 166, 166); font-size: 12px;">${
                          item.price
                            ? item.price
                            : "Product price Not Available"
                        }</span>`
                    )
                    .join("")
                : '<span class="tb-sub">No purchased items</span>'
            }</td>
            <td>${
              order.purchasedItems && order.purchasedItems.length > 0
                ? order.purchasedItems
                    .map(
                      (item) =>
                        `<span class="tb-lead" style="color: rgb(127, 166, 166); font-size: 12px;">${
                          item.quantity
                            ? item.quantity
                            : "Product quantity Not Available"
                        }</span>`
                    )
                    .join("")
                : '<span class="tb-sub">No purchased items</span>'
            }</td>
            <td><span class="tb-lead" style="font-size: 12px;">₹${
              order.totalAmount
            }</span></td>
          
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="sales_report.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
function checkEnvVariables() {
  const requiredEnvVariables = [
    "PORT",
    "API_URL",
    "CONNECTION_STRING",
    "SESSION_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
  ];

  const missingVariables = requiredEnvVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    console.error(
      `Error: The following environment variables are missing: ${missingVariables.join(
        ", "
      )}`
    );
    process.exit(1);
  }
}
checkEnvVariables();

app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
