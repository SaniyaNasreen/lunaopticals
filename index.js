const express = require("express");
const app = express();
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
const fs = require("fs");

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
// View engine
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

    // Check if order exists
    if (!order) {
      return res.status(404).send("Order not found");
    }
    if (!order.address || !order.address.firstname || !order.address.email) {
      return res.status(400).send("Invalid order address");
    }
    // Construct data object for the invoice
    const clientName = `${order.address.firstname} ${
      order.address.lastname || ""
    }`;
    const clientAddress = order.address.address || "N/A";
    const clientEmail = order.address.email || "N/A";

    const productsData = order.purchasedItems.map((item) => ({
      description: item.product.name || "N/A",
      quantity: item.quantity || 0,
      price: item.product.price || 0, // Assuming product price is retrieved from the product object
    }));

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
        address: clientAddress, // or any other billing address field
      },
      settings: {
        currency: "USD",
      },
    };

    // Construct HTML template for the invoice
    const productRows = data.products.map(
      (product) => `
        <tr>
          <td>${product.description}</td>
          <td>${product.quantity}</td>
          <td>$${product.price}</td>
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
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <!-- Replace the heading with the logo -->
            <img src="path/to/your/logo.png" alt="Company Logo" />
          </div>
          <div class="invoice-details">
            <h3>Client Information:</h3>
            <p>Name: ${data.client.name}</p>
            <p>Address: ${data.client.address}</p>
            <p>Email: ${data.client.email}</p>
            <!-- Add more client details using 'data' -->
            <h3>Invoice Details:</h3>
            <p>Order Date: ${data.orderDate}</p>
            <p>Invoice Date: ${data.invoiceDate}</p>
            <!-- Add more invoice details using 'data' -->
          </div>
          <div class="invoice-products">
            <h3>Ordered Products:</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${productRows.join(
                  ""
                )} <!-- Ensure productRows are included here -->
              </tbody>
            </table>
          </div>
          <div class="invoice-total">
            <h3>
              Total Amount: $${data.products.reduce(
                (total, product) => total + product.quantity * product.price,
                0
              )}
            </h3>
          </div>
        </div>
      </body>
    </html>`;
    const browser = await puppeteer.launch({
      headless: "new", // Ensure you've updated headless mode if needed
    });
    // Prepare data for easyinvoice
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
// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
// Construct HTML template for the invoice
