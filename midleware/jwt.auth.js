const jwt = require("jsonwebtoken");
const dotenv = require('dotenv').config()
const { User } = require("../models/user.model");

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  const payload = {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  };

  const token = jwt.sign(payload, secret, { expiresIn: "5h" });

  return token
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Missing or invalid token",
    });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET
  try {
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next();
  } catch (err) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Invalid token",
    });
  }
};

module.exports ={generateToken, verifyToken }