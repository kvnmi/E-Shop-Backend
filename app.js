// Imports
require("dotenv/config"); // Enviroment variables (created somewhere and usable everywhere)
const express = require("express"); // Create a web server
const morgan = require("morgan"); // Loggin all epi requests made to terminal.
const mongoose = require("mongoose"); // Enables communications with mongo
const cors = require("cors"); // Enables comm b/w front and back -end
const jwtAuth = require("./middleware/jwtAuth");
const errorHandler = require("./middleware/errorHandler");

const app = express();
// Middleware
app.use(cors());
app.options("*", cors());
app.use(express.json()); // Use instead of bodyparser.json()
app.use(morgan("tiny"));
app.use(jwtAuth());
app.use(errorHandler);

// Routes
const productRouter = require("./routes/productApis");
const categoriesRoutes = require("./routes/categories");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

// Api's
const api = process.env.API_URL;
app.use(`${api}/products`, productRouter);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

// Database
mongoose
  .connect(process.env.MONGO_KEY, {
    dbName: "E-commerce_database",
  })
  .then(() => console.log("Database successfully connected"))
  .catch((error) => console.log(error));

app.listen(3000, () => {
  console.log("server started at http://localhost:3000");
});
/*
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5kb2VAZG9tYWluLmNvbSIsInVpZCI6IjYxNjYzZGY5NDQ1NWUwYzA1OThmNjcxZiIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTYzNDI3NDc4MSwiZXhwIjoxNjM0MzYxMTgxfQ.4_Lf25ZQ8A3iJKDgP2Q5O5FG-WnNC57sGii5ck69g8c"
 */
