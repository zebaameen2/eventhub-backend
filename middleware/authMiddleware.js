const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // id & email mil jayega
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/** Sets req.user when token is valid; does not 401 when missing. Use for optional auth (e.g. GET ratings). */
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (_) {}
  next();
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;