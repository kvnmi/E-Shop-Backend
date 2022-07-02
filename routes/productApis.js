const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
const { Product } = require("../models/product");
const mongoose = require("mongoose");
const multer = require("multer");

const fileTypes = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = fileTypes[file.mimetype];
    const uploadError = isValid ? null : new Error("Invalid Image");
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.replace(" ", "-"); //Replaces all spaces in the imageName with -.
    const extension = fileTypes[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOption = multer({ storage: storage });

router.get("/", async (req, res) => {
  let filter = req.query.categories
    ? { category: req.query.categories.split(",") } // localhost:3000/api/v1/products?categories=2342342,234234. .split for filtering multiple categories
    : null; // Optionally filters products by categories
  try {
    const products = await Product.find(filter).populate("category", "name"); // Returns products (Optionaly filtered by category)
    if (!products)
      res
        .status(500)
        .json({ success: false, message: "Could not find proudcts" });
    res.send(products);
  } catch (error) {
    res.status(500).send(error);
  }
}); // Gets array of products

router.get("/get/count", async (req, res) => {
  const productCount = await Product.countDocuments();
  if (!productCount)
    res
      .status(404)
      .json({ success: false, message: "Could not find proudcts" });
  res.send({ count: productCount });
}); // Gets number of products

router.get("/getfeatured/:count", async (req, res) => {
  const count = req.params.count ? +req.params.count : 0;
  const product = await Product.find({ isFeatured: true }).limit(count);
  if (!product)
    res
      .status(404)
      .json({ success: false, message: "Could not find products" });
  res.send(product);
}); // Gets featured products

router.get("/:productId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).send("Invalid Id");
  } // Checks if given product id exists
  try {
    const response = await Product.findById(req.params.productId).populate(
      "category",
      "name"
    ); // Returns product with given id
    if (!response)
      return res
        .status(404)
        .json({ success: false, message: "Could not find product" });
    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
}); // Gets particular product.

router.post("/", uploadOption.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(404).send("Invalid Category");

  const image = req.file;
  if (!image) return res.status(404).send("There is no product image"); // Checks for images.

  const fileName = image.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  // req.protocol returns transferProtocol (i.e https), req.get("host") returns host (i.e. localhost: 3000)

  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDiscription: req.body.richDiscription,
    image: `${basePath}${fileName}`,
    images: req.body.images,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
    dateCreated: req.body.dateCreated,
  });
  try {
    const response = await product.save();
    if (!response) return res.status(400).send("Resource not found");
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
}); // Creates a particular product.

router.put("/:productId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).send("Invalid Id");
  } // Checks if given product id exists
  if (req.body.category) {
    try {
      const category = await Category.findById(req.body.category);
      if (!category) return res.status(404).send("Invalid Category");
    } catch (error) {
      return res.status(500).send(error);
    }
  } // Checks to ensure product category exists

  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).send("Invalid product");

  const file = req.file;
  let imagePath;

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    imagePath = `${basePath}${fileName}`;
  } else {
    imagePath = product.image;
  }

  try {
    const response = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        name: req.body.name,
        description: req.body.description,
        richDiscription: req.body.richDiscription,
        image: imagePath,
        images: req.body.images,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        dateCreated: req.body.dateCreated,
      },
      { new: true }
    ).populate("category", "name");
    if (!response) return res.status(400).send("Resource not found");
    return res.status(200).send(response);
  } catch (error) {
    return res.status(400).json({ success: false, error });
  }
}); // Updates a product detail

router.delete("/:productId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(400).send("Invalid Id");
  } // Checks if given product id exists
  try {
    const response = await Product.findByIdAndRemove(req.params.productId);
    if (!response)
      return res
        .status(404)
        .json({ success: false, message: "Could not find product" });
    return res
      .status(200)
      .json({ success: true, message: `product was succesfully deleted` });
  } catch (error) {
    return res.status(400).json({ success: false, error });
  }
}); // Deletes a product

router.put(
  "/gallery-images/:id",
  uploadOption.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product Id");
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!product) return res.status(500).send("the gallery cannot be updated!");

    res.send(product);
  }
);

module.exports = router;
