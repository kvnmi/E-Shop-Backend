const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // Encrypts password
const jwt = require("jsonwebtoken");

const secret = process.env.secret;

router.get(`/`, async (req, res) => {
  try {
    const userList = await User.find().select("-passwordHash"); // Returns users and props (besides password)

    if (!userList) return res.status(500).json({ success: false });

    res.send(userList);
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
}); // Gets a list of system users

router.get(`/:id`, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash"); // Returns user with particular id

    if (!user) return res.status(500).json({ success: false });

    res.send(user);
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
}); // Gets a particular user.

router.get("/getcount", async (req, res) => {
  const userCount = await User.countDocuments();
  if (!userCount)
    res.status(404).json({ success: false, message: "Could not find users" });
  res.send({ count: userCount });
}); // Gets number user

router.post("/", async (req, res) => {
  try {
    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    });
    user = await user.save();

    if (!user) return res.status(400).send("the user cannot be created!");

    res.send(user);
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
}); // Creates new user (Admin)

router.post("/register", async (req, res) => {
  try {
    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    });
    user = await user.save();

    if (!user) return res.status(400).send("the user cannot be created!");

    res.send(user);
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(404).send("Invalid email address");
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          uid: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        secret,
        { expiresIn: "1d" }
      );
      return res.status(200).send({ email: user.email, token });
    } else {
      return res.status(404).send("Email and password mismatch");
    }
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong, try again", error: error });
  }
});

router.delete("/:userId", async (req, res) => {
  try {
    const response = await User.findByIdAndRemove(req.params.userId);
    if (!response)
      return res
        .status(404)
        .json({ success: false, message: "Could not find user" });
    return res
      .status(200)
      .json({ success: true, message: `user was succesfully deleted` });
  } catch (error) {
    return res.status(400).json({ success: false, error });
  }
}); // Deletes a user

module.exports = router;
