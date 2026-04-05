const express = require('express')
const router = express.Router()
const db = require('../config/db')
const auth = require('../middleware/auth')

// 管理员校验
const adminAuth=require('../middleware/admin')

// 工单列表
router.get('/list', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query
    let sql = 'SELECT * FROM register_feedback'
    let params = []
    if (status) { sql += ' WHERE status = ?'; params.push(status) }
    const [rows] = await db.query(sql, params)
    res.json({ code:200, msg:'成功', data:{ total:rows.length, list:rows }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 处理工单
router.put('/handle', auth, adminAuth, async (req, res) => {
  try {
    // 所有参数 全部从 body 取！
    const { fail_id, result } = req.body;

    // 校验
    if (!fail_id || !result) {
      return res.json({ code:400, msg:'请输入工单编号和处理结果' })
    }

    // 直接更新，WHERE 用 fail_id
    await db.query(
      'UPDATE register_feedback SET status = 1, result = ?, update_time = ? WHERE fail_id = ?',
      [result, new Date(), fail_id]
    );

    res.json({ code:200, msg:'处理完成' })
  } catch (err) {
    res.json({ code:500, msg:err.message })
  }
})

// 删除工单
// 删除工单
router.post('/delete', auth, adminAuth, async (req, res) => {
  try {
    const { fail_id } = req.body;
    if (!fail_id) {
      return res.json({ code: 400, msg: '请传入要删除的工单编号', data: null, timestamp: Date.now() });
    }

    await db.query('DELETE FROM register_feedback WHERE fail_id = ?', [fail_id]);

    res.json({ code: 200, msg: '删除成功', data: null, timestamp: Date.now() });
  } catch (err) {
    res.json({ code: 500, msg: err.message, data: null, timestamp: Date.now() });
  }
})

module.exports = router