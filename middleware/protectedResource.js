const { json } = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { JWT_SECRET } = require("../config");
const UserModel = mongoose.model("UserModel");
const protectedRoute = (module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({
      error:
        "Please provide authentication token in Header 'example-Bearer yourtoken' ",
    });
  }
  const token = authorization.replace("Bearer ", "");
  jwt.verify(token, JWT_SECRET, (error, payload) => {
    if (error) {
      return res.status(401).json({ error: "User not loged in" });
    }
    const { _id } = payload;
    UserModel.findById(_id).then((dbUser) => {
      req.user = dbUser;
      next();
    });
  });
});
module.exports = protectedRoute;
