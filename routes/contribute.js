const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// 管理员校验
const adminAuth = (req, res, next) => {
  if (req.user.is_admin !== 1) return res.json({ code:403, msg:'无权限', data:null, timestamp:Date.now() })
  next()
}

// 我的投稿
router.get('/my-list', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contribute WHERE student_id = ?', [req.user.id])
    res.json({ code:200, msg:'成功', data:{ total:rows.length, list:rows }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 管理员查看全部投稿
router.get('/all-list', auth, adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contribute')
    res.json({ code:200, msg:'成功', data:{ total:rows.length, list:rows }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 发布投稿
router.post('/publish', auth, async (req, res) => {
  try {
    const { activity_id, title, content, type, images } = req.body
    const [result] = await db.query(
      'INSERT INTO contribute(student_id, activity_id, title, content, type, images) VALUES(?,?,?,?,?,?)',
      [req.user.id, activity_id, title, content, type, images||'']
    )
    res.json({
      code:200, msg:'发布成功',
      data:{ id:result.insertId, activity_id, title, create_time:new Date() },
      timestamp:Date.now()
    })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 删除投稿
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM contribute WHERE id = ? AND student_id = ?', [req.params.id, req.user.id])
    res.json({ code:200, msg:'删除成功', data:null, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 投稿上下架
router.put('/change-status', auth, adminAuth, async (req, res) => {
  try {
    const { id, is_down } = req.body
    await db.query('UPDATE contribute SET is_down = ?, update_time = ? WHERE id = ?', [is_down, new Date(), id])
    res.json({ code:200, msg:'状态修改成功', data:{ id, is_down, update_time:new Date() }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

module.exports = router