const path = require("path");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const { upload, cropToSquare } = require("../utils/multer");
const loadProducts = async (req, res) => {
  try {
    const categories = await Category.find();
    const products = await Product.find().populate("category");
    return res.render("admin/products", { products, categories });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Error loading products");
  }
};

const addProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      richDescription,
      brand,
      price,
      category,
      images,
      countInStock,
      rating,
      numReviews,
    } = req.body;
    if (req.fileValidationError) {
      return res.status(400).send(req.fileValidationError);
    }

    const categoryId = req.body.category;
    const foundCategory = await Category.findById(categoryId);
    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }

    const product = new Product({
      name,
      description,
      richDescription,
      brand,
      price,
      category: foundCategory._id,
      countInStock,
      rating,
      numReviews,
      dateCreated: Date.now(),
      is_admin: 0,
    });
    const filePromises = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = path.join("public/uploads", file.filename);
        const outputCroppedPath = path.join(
          "public/uploads",
          `cropped_${file.filename}`
        );

        const cropPromise = new Promise((resolve, reject) => {
          cropToSquare(filePath, outputCroppedPath, 600, 600);
          resolve();
        });

        filePromises.push(cropPromise);

        const fileUrl = `http://localhost:4000/public/uploads/cropped_${file.filename}`;
        product.images.push(fileUrl);
      }

      await Promise.all(filePromises); // Wait for all image cropping operations to finish
    }
    const productData = await product.save();

    if (!productData) {
      res.status(500).send("Failed to add product");
    }
    res.redirect("/admin/products?success=Product added successfully");
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    const categoryId = req.body.category;
    const foundCategory = await Category.findById(categoryId);
    if (!foundCategory) {
      console.log("Category not found or undefined");
      return res.status(404).send("Category not found or undefined");
    }

    if (typeof req.body.deleteImages !== "object") {
      req.body.deleteImages = [req.body.deleteImages];
    }
    if (
      req.body._delete &&
      req.body.deleteImages &&
      req.body.deleteImages.length > 0
    ) {
      const indexesToDelete = req.body.deleteImages.map((index) =>
        parseInt(index)
      );
      product.images = product.images.filter(
        (image, index) => !indexesToDelete.includes(index)
      );
    }
    product.name = req.body.name;
    product.description = req.body.description;
    product.brand = req.body.brand;
    product.price = req.body.price;
    product.category = foundCategory._id;
    product.countInStock = req.body.countInStock;
    const filePromises = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = path.join("public/uploads", file.filename);
        const outputCroppedPath = path.join(
          "public/uploads",
          `cropped_${file.filename}`
        );

        const cropPromise = new Promise((resolve, reject) => {
          cropToSquare(filePath, outputCroppedPath, 600, 600);
          resolve();
        });

        filePromises.push(cropPromise);

        const fileUrl = `http://localhost:4000/public/uploads/cropped_${file.filename}`;
        product.images.push(fileUrl);
      }

      await Promise.all(filePromises); // Wait for all image cropping operations to finish
    }

    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const unlistProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      const error = "Product not found";
      error.statusCode = 404;
      throw error;
    }
    product.listed = !product.listed;
    await product.save();
    return res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const searchquery = req.query.search || "";

    const productData = await Product.find({
      $or: [
        { name: { $regex: searchquery } },
        { brand: { $regex: searchquery } },
        { description: { $regex: searchquery } },
        { category: { $regex: searchquery } },
      ],
    });
    res.render("admin/products", { products: productData, searchquery });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadProducts,
  addProduct,
  updateProduct,
  searchProduct,
  unlistProduct,
};
