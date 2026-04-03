const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// 管理员校验
const adminAuth = (req, res, next) => {
  if (req.user.is_admin !== 1) return res.json({ code:403, msg:'无管理员权限', data:null, timestamp:Date.now() })
  next()
}

// 工单列表
router.get('/list', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query
    let sql = 'SELECT * FROM feedback'
    let params = []
    if (status) { sql += ' WHERE status = ?'; params.push(status) }
    const [rows] = await db.query(sql, params)
    res.json({ code:200, msg:'成功', data:{ total:rows.length, list:rows }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 工单详情
router.get('/detail/:id', auth, adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM feedback WHERE id = ?', [req.params.id])
    res.json({ code:200, msg:'成功', data:rows[0], timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 处理工单
router.put('/handle/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE feedback SET status = 1, update_time = ? WHERE id = ?', [new Date(), req.params.id])
    res.json({ code:200, msg:'处理完成', data:{ id:req.params.id, status:1, update_time:new Date() }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 删除工单
router.delete('/delete/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM feedback WHERE id = ?', [req.params.id])
    res.json({ code:200, msg:'删除成功', data:null, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

module.exports = router