const {getUser}= require('./aouth');

function checkAuth(req, res, next) {
  const token = req.cookies.token;

  if (token == null) {
    
    return res.status(401).redirect("/login"); // Unauthorized
  }
  const user = getUser(token);
  if (!user){
        res.status(401).redirect("/login"); // Unauthorized
    }
  req.user = user
  next()
}

module.exports = checkAuth;
