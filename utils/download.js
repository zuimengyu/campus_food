const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const upload = require('../utils/upload')
const path = require('path') // 你已经引过了，不用重复引

// 1. 你原有的上传接口（不动）
router.post('/avatar/upload', auth, upload.single('avatar'), (req, res) => {
  try {
    const avatarUrl = `http://localhost:3000/uploads/avatars/${req.file.filename}`
    res.json({ code: 200, msg: '上传成功', data: avatarUrl })
  } catch (err) {
    res.json({ code: 500, msg: '上传失败' })
  }
})

// 2. ✅ 新增：头像下载接口（核心！）
router.get('/avatar/download', auth, (req, res) => {
  try {
    // 前端传文件名：?filename=xxx.jpg
    const { filename } = req.query
    if (!filename) {
      return res.status(400).json({ code: 400, msg: '请传入文件名' })
    }

    // 拼接服务器上的真实文件路径
    const filePath = path.join(__dirname, '../uploads/avatars', filename)

    // Express 自带下载方法，自动返回文件给前端
    res.download(filePath, (err) => {
      if (err) {
        res.status(404).json({ code: 404, msg: '文件不存在' })
      }
    })

  } catch (err) {
    res.status(500).json({ code: 500, msg: '下载失败' })
  }
})

module.exports = router