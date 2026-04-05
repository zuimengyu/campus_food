const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// 提交失败反馈
router.post('/register-fail', auth, async (req, res) => {
  try {
    const { major, fail_reason } = req.body
    const [result] = await db.query(
      'INSERT INTO register_feedback(major,content,fail_id) VALUES(?,?,?)',
      [major, fail_reason,Date.now()]
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
router.post('/my-work', auth, async (req, res) => {
  try {
    const fail_id=req.body.fail_id;
    const [rows] = await db.query('SELECT * FROM register_feedback WHERE fail_id = ?', [req.body.fail_id])
    res.json({ code:200, msg:'成功', data:rows, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

module.exports = router