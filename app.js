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
app.use('/api/workorder', require('./routes/workOrder'))

// 4. 发布模块
app.use('/api/publish', require('./routes/publish'))

// 5. 广场模块
//app.use('/api/square', require('./routes/square'))

//6.主页模块
//app.user('/api/index',require('./routes/index'))

// 7. 互动模块
//app.use('/api/interact', require('./routes/interact'))


// 全局错误处理
//app.use(errorHandler)

// 启动服务
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`服务启动：http://localhost:${PORT}`)
})