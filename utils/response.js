exports.success = (res, data, msg = '成功') => {
  res.json({ code: 200, msg, data })
}

exports.error = (res, msg = '失败', code = 400) => {
  res.json({ code, msg, data: null })
}