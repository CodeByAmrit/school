const { getUser } = require("./aouth");

function checkStudentAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = getUser(token);
  if (!user) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = user;
  next();
}

module.exports = checkStudentAuth;
