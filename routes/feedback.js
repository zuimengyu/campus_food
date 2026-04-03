const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// 提交失败反馈
router.post('/register-fail', auth, async (req, res) => {
  try {
    const { college, fail_reason } = req.body
    const [result] = await db.query(
      'INSERT INTO feedback(student_id, college, fail_reason) VALUES(?,?,?)',
      [req.user.id, college, fail_reason]
    )
    res.json({
      code:200, msg:'提交成功',
      data:{ id:result.insertId, status:0, create_time:new Date() },
      timestamp:Date.now()
    })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 查询我的反馈
router.get('/my-work', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM feedback WHERE student_id = ?', [req.user.id])
    res.json({ code:200, msg:'成功', data:rows, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

module.exports = router