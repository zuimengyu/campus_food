const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ code:401, msg:'请登录' })
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (e) {
    res.status(401).json({ code:401, msg:'登录已过期' })
  }
}