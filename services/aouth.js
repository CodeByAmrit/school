const sessionIdToUserMap = new Map()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
dotenv.config()
const chabi = process.env.jwt_token

function setUser(user) {
  return jwt.sign(
    {
      _id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      school_address: user.school_address,
      school_name: user.school_name,
      school_phone: user.school_phone
    },
    chabi
  )
}

function getUser(token) {
  if (!token) return null
  try {
    return jwt.verify(token, chabi)
  } catch (error) {
    return null
  }
}

function logoutUser(id) {
  sessionIdToUserMap.delete(id)
}

module.exports = { setUser, getUser, logoutUser }
