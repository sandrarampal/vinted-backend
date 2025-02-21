const isNotAllowed = (req, res, next) => {
  if (req.body.description.length > 500) {
    return res.status(400).json({ message: "Description is too long" });
  }
  if (req.body.title.length > 50) {
    return res.status(400).json({ message: "Title is too long" });
  }
  if (req.body.price > 100000) {
    return res.status(400).json({ message: "The price is too high" });
  }
  next();
};

module.exports = isNotAllowed;
