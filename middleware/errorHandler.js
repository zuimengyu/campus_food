module.exports = (err, req, res, next) => {
  console.error(err)
  res.status(500).json({ code: 500, msg: '服务器异常', error: err.message })
}