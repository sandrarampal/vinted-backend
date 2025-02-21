const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(409).json({ message: "Unauthorized" });
  }
  const user = await User.findOne({
    token: req.headers.authorization.replace("Bearer ", ""),
  });
  if (!user) {
    return res.status(409).json({ message: "Unauthorized" });
  } else {
    req.user = user;
    next();
  }
};

module.exports = isAuthenticated;
