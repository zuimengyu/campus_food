const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// 管理员校验
const adminAuth = (req, res, next) => {
  if (req.user.is_admin !== 1) return res.json({ code:403, msg:'无权限', data:null, timestamp:Date.now() })
  next()
}

// 活动列表
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activity')
    res.json({ code:200, msg:'成功', data:{ total:rows.length, list:rows }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 活动详情
router.get('/detail/:year_month', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activity WHERE year_month = ?', [req.params.year_month])
    res.json({ code:200, msg:'成功', data:rows[0], timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 管理员发布活动
router.post('/publish', auth, adminAuth, async (req, res) => {
  try {
    const { year_month, activity_name, publish_time, like_start, like_end, max_submit } = req.body
    const [result] = await db.query(
      'INSERT INTO activity(year_month, activity_name, publish_time, like_start, like_end, max_submit) VALUES(?,?,?,?,?,?)',
      [year_month, activity_name, publish_time, like_start, like_end, max_submit]
    )
    res.json({ code:200, msg:'活动发布成功', data:{ id:result.insertId, create_time:new Date() }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 管理员修改活动
router.put('/update', auth, adminAuth, async (req, res) => {
  try {
    const { id, activity_name, like_start, like_end } = req.body
    await db.query('UPDATE activity SET activity_name=?, like_start=?, like_end=?, update_time=? WHERE id=?',
      [activity_name, like_start, like_end, new Date(), id]
    )
    res.json({ code:200, msg:'修改成功', data:{ id, update_time:new Date() }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 管理员删除活动
router.delete('/delete/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM activity WHERE id = ?', [req.params.id])
    res.json({ code:200, msg:'删除成功', data:null, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 获取当月活动
router.get('/current', async (req, res) => {
  try {
    const now = new Date()
    const year_month = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}`
    const [rows] = await db.query('SELECT * FROM activity WHERE year_month = ?', [year_month])
    res.json({ code:200, msg:'成功', data:rows[0], timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

module.exports = router