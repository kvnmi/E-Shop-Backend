const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) {
    return res.status(500).json({ success: false });
  }
  return res.status(200).send(categoryList);
});

router.get("/:categoryId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.categoryId)) {
    return res.status(400).send("Invalid Id");
  }
  try {
    const response = await Category.findById(req.params.categoryId);
    if (!response) return res.status(400).send("Resource not found");
    return res.status(200).send(response);
  } catch (error) {
    return res
      .status(404)
      .json({ success: false, message: "Category with given id not found" });
  }
});

router.post("/", async (req, res) => {
  const category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });
  const response = await category.save();
  if (!response)
    return res.status(404).send("Could not create category. Try again");
  return res.send(response);
});

router.delete("/:categoryId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.categoryId)) {
    return res.status(400).send("Invalid Id");
  }
  try {
    const response = await Category.findByIdAndRemove(req.params.categoryId);
    if (!response)
      return res
        .status(404)
        .json({ success: false, message: "Could not find document" });
    return res
      .status(200)
      .json({ success: true, message: `category was succesfully deleted` });
  } catch (error) {
    return res.status(400).json({ success: false, error });
  }
});

router.put("/:categoryId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.categoryId)) {
    return res.status(400).send("Invalid Id");
  }
  try {
    const response = await Category.findByIdAndUpdate(
      req.params.categoryId,
      {
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
      },
      { new: true }
    );
    if (!response) return res.status(400).send("Resource not found");
    return res.status(200).send(response);
  } catch (error) {
    return res.status(400).json({ success: false, error });
  }
});

module.exports = router;
