// cors.js / errorHandler.js 必须这样写
module.exports = (req, res, next) => {
  // 你的中间件逻辑
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
}