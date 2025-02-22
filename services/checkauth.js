const { getUser } = require("./aouth");

function checkAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).redirect("/login"); // Unauthorized
  }

  const user = getUser(token);
  if (!user) {
    return res.status(401).redirect("/login"); // Unauthorized
  }

  req.user = user;
  next();
}

module.exports = checkAuth;
