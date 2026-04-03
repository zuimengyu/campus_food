const express = require('express')
const app = express()
require('dotenv').config()

const corsMiddleware = require('./middleware/cors')
const errorHandler = require('./middleware/errorHandler')

app.use(corsMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 1. 用户模块
app.use('/api/user', require('./routes/user'))

// 2. 注册失败反馈
app.use('/api/feedback', require('./routes/feedback'))

// 3. 管理员工单
app.use('/api/work-order', require('./routes/workOrder'))

// 4. 投稿模块
app.use('/api/contribute', require('./routes/contribute'))

// 5. 活动模块
app.use('/api/activity', require('./routes/activity'))

// 6. 广场模块
app.use('/api/square', require('./routes/square'))

// 7. 互动模块
app.use('/api/interact', require('./routes/interact'))

// 8. 文件上传
app.use('/api/file', require('./routes/file'))

// 9. 通用模块
app.use('/api/common', require('./routes/common'))

// 全局错误处理
app.use(errorHandler)

// 启动服务
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`服务启动：http://localhost:${PORT}`)
})