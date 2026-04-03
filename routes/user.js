const express = require('express')
const router = express.Router()
const db = require('../config/db')
const { encryptStuId, decryptStuId, hashPwd, comparePwd } = require('../utils/encrypt')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')

// 登录
router.post('/login', async (req, res) => {
  try {
    const { student_id, password } = req.body
    const encryptedId = encryptStuId(student_id)
    const [rows] = await db.query('SELECT * FROM user WHERE student_id = ?', [encryptedId])

    if (!rows.length) return res.json({ code:400, msg:'账号不存在', data:null, timestamp:Date.now() })
    if (!comparePwd(password, rows[0].password)) return res.json({ code:400, msg:'密码错误', data:null, timestamp:Date.now() })

    const user = rows[0]
    user.student_id = decryptStuId(user.student_id)
    const token = jwt.sign({ id:user.id, is_admin:user.is_admin }, process.env.JWT_SECRET, { expiresIn:'7d' })

    res.json({ code:200, msg:'登录成功', data:{ token, user }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 注册
router.post('/register', async (req, res) => {
  try {
    const { student_id, password } = req.body
    const encryptedId = encryptStuId(student_id)
    const [exist] = await db.query('SELECT id FROM user WHERE student_id = ?', [encryptedId])

    if (exist.length) return res.json({ code:400, msg:'学号已注册', data:null, timestamp:Date.now() })

    const hashedPwd = hashPwd(password)
    await db.query('INSERT INTO user(student_id, password) VALUES(?,?)', [encryptedId, hashedPwd])
    res.json({ code:200, msg:'注册成功', data:{ student_id, create_time:new Date() }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 退出登录
router.post('/logout', auth, (req, res) => {
  res.json({ code:200, msg:'退出成功', data:null, timestamp:Date.now() })
})

// 获取个人信息
router.get('/info', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE id = ?', [req.user.id])
    rows[0].student_id = decryptStuId(rows[0].student_id)
    res.json({ code:200, msg:'成功', data:rows[0], timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 修改个人信息
router.put('/update', auth, async (req, res) => {
  try {
    const { nickname, avatar, password } = req.body
    let sql = 'UPDATE user SET update_time = ?'
    let params = [new Date()]

    if (nickname) { sql += ', nickname = ?'; params.push(nickname) }
    if (avatar) { sql += ', avatar = ?'; params.push(avatar) }
    if (password) { sql += ', password = ?'; params.push(hashPwd(password)) }

    sql += ' WHERE id = ?'
    params.push(req.user.id)
    await db.query(sql, params)

    res.json({ code:200, msg:'修改成功', data:{ update_time:new Date() }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 校验管理员
router.get('/check-admin', auth, (req, res) => {
  res.json({ code:200, msg:'成功', data:{ is_admin:req.user.is_admin }, timestamp:Date.now() })
})

module.exports = router