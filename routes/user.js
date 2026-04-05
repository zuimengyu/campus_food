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
    delete user.password;

    const token = jwt.sign(
      { id: encryptedId, is_admin:user.is_admin }, 
      process.env.JWT_SECRET, 
      { expiresIn:'7d' }
    )

    res.json({ code:200, msg:'登录成功', data:{ token, user }, timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})


// 注册接口
router.post('/register', async (req, res) => {
  try {
    const { student_id, password } = req.body;

    // ===================== 核心：学号严格校验 =====================
    // 1. 必须是12位纯数字
    if (!/^\d{12}$/.test(student_id)) {
      return res.json({
        code: 400,
        msg: "学号不合规",
        data: null,
        timestamp: Date.now()
      });
    }
    
    // 拆分12位学号（索引 0-11）
    const firstTwo = student_id.slice(0, 2);      // 前两位
    const collegeCode = student_id.slice(2, 6);   // 第3-6位（学院代码）
    const lastTwo = student_id.slice(10, 12);    // 最后两位

    // 2. 前两位必须在 20 ~ 30 之间
    const firstTwoNum = Number(firstTwo);
    if (firstTwoNum < 20 || firstTwoNum > 30) {
      return res.json({
        code: 400,
        msg: "学号不合规",
        data: null,
        timestamp: Date.now()
      });
    }

    // 3. 最后两位必须小于 50
    const lastTwoNum = Number(lastTwo);
    if (lastTwoNum >= 50) {
      return res.json({
        code: 400,
        msg: "学号不合规",
        data: null,
        timestamp: Date.now()
      });
    }

    // 4. 校验学院代码：必须在 a 表中存在
    const [collegeResult] = await db.query(
      "SELECT college_code FROM id_college WHERE college_code = ?",
      [collegeCode]
    );
    if (collegeResult.length === 0) {
      return res.json({
        code: 400,
        msg: "未录入当前学院",
        data: null,
        timestamp: Date.now()
      });
    }
    // 学号加密
    const encryptedId = encryptStuId(student_id);
    // 查询是否已注册
    const [exist] = await db.query("SELECT student_id FROM user WHERE student_id = ?", [encryptedId]);
    if (exist.length) {
      return res.json({
        code: 400,
        msg: "该学号已注册",
        data: null,
        timestamp: Date.now()
      });
    }


    // 密码加密 + 插入数据库
    const nickname = `用户${Date.now()}`;
    const hashedPwd = hashPwd(password);
    await db.query(
      "INSERT INTO user(student_id, password, nickname) VALUES(?,?,?)",
      [encryptedId, hashedPwd, nickname]
    );

    // 返回成功
    res.json({
      code: 200,
      msg: "注册成功",
      data: { student_id },
      timestamp: Date.now()
    });

  } catch (err) {
    res.json({
      code: 500,
      msg: "服务器错误：" + err.message,
      data: null,
      timestamp: Date.now()
    });
  }
});





// 退出登录
router.post('/logout', auth, (req, res) => {
  res.json({ code:200, msg:'退出成功', data:null, timestamp:Date.now() })
})




// 获取个人信息
router.get('/info', auth, async (req, res) => {
  try {
    // 🔥 直接用 Token 里的【加密学号】查询（和数据库完全匹配）
    const [rows] = await db.query('SELECT * FROM user WHERE student_id = ?', [req.user.id])

    // 安全判断：查不到用户返回提示
    if (!rows.length) {
      return res.json({ code:400, msg:"用户不存在", data:null, timestamp:Date.now() })
    }

    // 解密学号返回前端
    rows[0].student_id = decryptStuId(rows[0].student_id)
    delete rows[0].password // 不返回密码，更安全

    res.json({ code:200, msg:'成功', data:rows[0], timestamp:Date.now() })
  } catch (err) {
    res.json({ code:500, msg:err.message, data:null, timestamp:Date.now() })
  }
})

// 校验管理员
router.get('/check-admin', auth, (req, res) => {
  res.json({ code:200, msg:'成功', data:{ is_admin:req.user.is_admin }, timestamp:Date.now() })
})

module.exports = router