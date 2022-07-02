const { Order } = require("../models/order");
const express = require("express");
const mongoose = require("mongoose");
const { OrderItem } = require("../models/orderItem");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .populate("user", "name") // Populates the user object with required props instead of just id
    .sort("dateOrdered"); // Sorts in ascending order. (For descending; .sort({dateOrdered: -1}))

  if (!orderList) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  return res.send(orderList);
});
router.get(`/get/userOrders/:uid`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.uid })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .populate("user", "name") // Populates the user object with required props instead of just id
    .sort("dateOrdered"); // Sorts in ascending order. (For descending; .sort({dateOrdered: -1}))

  if (!userOrderList) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  return res.send(userOrderList);
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });
  return res.status(200).send(order);
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
  ]);
  if (!totalSales) res.status(400).send("Something went wrong, try again");
  res.status(200).send({ totalSales: totalSales.pop().totalSales });
});
/* 
  .aggregate is a mongoose method that consolidates all the documents in a collection.
  $group && $sum are mongoose reserver words. Returns a json with id null && sum of values in $totalPrice field
*/
router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments();
  if (!orderCount)
    res.status(404).json({ success: false, message: "Could not find orders" });
  res.send({ count: orderCount });
}); // Gets number of orders

router.post("/", async (req, res) => {
  const orderItemIds = await Promise.all(
    req.body.orderItems.map(async (item) => {
      const newOrderItem = new OrderItem({
        product: item.product,
        quantity: item.quantity,
      });
      await newOrderItem.save(); // Saves individual order items (prod $ quant) in db
      return newOrderItem.id; // Returns an array of order item id's.
    })
  ); // Promise.all so it gathers all the (var response) once before sending to db.
  const totalPrices = await Promise.all(
    orderItemIds.map(async (item) => {
      const orderItem = await OrderItem.findById(item).populate(
        "product",
        "price"
      );
      return orderItem.product.price * orderItem.quantity;
    })
  );
  const totalPrice = totalPrices.reduce((a, b) => a + b, 0); // Returns sum of all numbers in the array, initial value 0.

  const orders = new Order({
    orderItems: orderItemIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    status: req.body.status,
    country: req.body.country,
    phone: req.body.phone,
    totalPrice: totalPrice,
    user: req.body.user,
  }); // Create new order

  const response = await orders.save();
  response
    ? res.status(200).send(response)
    : res.status(500).json({
        sucess: false,
        message: "Something went wrong while creating order",
      }); // Returns order props
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order)
    return res.status(500).json({
      sucess: false,
      message: "Something went wrong while creating order",
    });
  return res.status(200).send(order);
});

router.delete("/:order", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.order)) {
    return res.status(400).send("Invalid Id");
  }
  try {
    const response = await Order.findByIdAndRemove(req.params.order);
    if (!response)
      return res
        .status(404)
        .json({ success: false, message: "Could not find document" });
    if (response) {
      await response.orderItems.map(
        async (item) => await OrderItem.findByIdAndDelete(item)
      );
    }
    return res
      .status(200)
      .json({ success: true, message: `order was succesfully deleted` });
  } catch (error) {
    return res.status(400).json({ success: false, error });
  }
});

module.exports = router;
