const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // 你的登录鉴权中间件
const adminAuth = require('../middleware/admin'); // 你刚封装好的管理员中间件！
const db = require('../config/db');
const { publishUpload } = require('../utils/upload');
const fs = require('fs');
const path = require('path');

// ======================================
// 👇 普通用户接口（完全保留，无修改）
// ======================================
// 1. 发布作品
router.post('/add', auth, publishUpload.single('image'), async (req, res) => {
  try {
    const student_id = req.user.id;
    const { title, content, price_range, recommend_dish, people_range, address } = req.body;
    
    if (!title || !content || !req.file) {
      return res.status(400).json({ code:400, msg:'标题/内容/图片不能为空', timestamp:Date.now() });
    }

    const imageUrl = `http://localhost:3000/uploads/publish/${req.file.filename}`;
    const [result] = await db.query(`
      INSERT INTO publish_content (student_id,title,content,price_range,recommend_dish,people_range,address,image)
      VALUES (?,?,?,?,?,?,?,?)
    `, [student_id, title.trim(), content.trim(), price_range, recommend_dish, people_range, address, imageUrl]);

    res.json({ code:200, msg:'发布成功', data:{ id:result.insertId }, timestamp:Date.now() });
  } catch (err) {
    res.status(500).json({ code:500, msg:'发布失败', timestamp:Date.now() });
  }
});

// 2. 修改作品
router.put('/edit', auth, publishUpload.single('image'), async (req, res) => {
  try {
    const { id, title, content, price_range, recommend_dish, people_range, address } = req.body;
    if (!id) return res.status(400).json({ code:400, msg:'作品ID不能为空', timestamp:Date.now() });

    const [workRows] = await db.query('SELECT student_id,image FROM publish_content WHERE id = ?', [id]);
    if (!workRows.length) return res.status(404).json({ code:404, msg:'作品不存在', timestamp:Date.now() });
    if (req.user.id !== workRows[0].student_id) return res.status(403).json({ code:403, msg:'无权限修改', timestamp:Date.now() });

    let sql = 'UPDATE publish_content SET update_time = NOW()';
    let params = [];
    if (title) { sql += ', title = ?'; params.push(title.trim()); }
    if (content) { sql += ', content = ?'; params.push(content.trim()); }
    if (price_range) { sql += ', price_range = ?'; params.push(price_range); }
    if (recommend_dish) { sql += ', recommend_dish = ?'; params.push(recommend_dish); }
    if (people_range) { sql += ', people_range = ?'; params.push(people_range); }
    if (address) { sql += ', address = ?'; params.push(address); }
    if (req.file) {
      const newImage = `http://localhost:3000/uploads/publish/${req.file.filename}`;
      sql += ', image = ?'; params.push(newImage);
    }
    sql += ' WHERE id = ?'; params.push(id);

    await db.query(sql, params);
    res.json({ code:200, msg:'修改成功', timestamp:Date.now() });
  } catch (err) {
    res.status(500).json({ code:500, msg:'修改失败', timestamp:Date.now() });
  }
});

// 3. 自行下架/上架
router.put('/down', auth, async (req, res) => {
  try {
    const { id, is_down } = req.body;
    if (!id || is_down === undefined) return res.status(400).json({ code:400, msg:'参数错误', timestamp:Date.now() });

    const [workRows] = await db.query('SELECT student_id FROM publish_content WHERE id = ?', [id]);
    if (!workRows.length) return res.status(404).json({ code:404, msg:'作品不存在', timestamp:Date.now() });
    if (req.user.id !== workRows[0].student_id) return res.status(403).json({ code:403, msg:'无权限操作', timestamp:Date.now() });

    await db.query('UPDATE publish_content SET is_down = ? WHERE id = ?', [is_down, id]);
    res.json({ code:200, msg: is_down==1?'已下架':'已上架', timestamp:Date.now() });
  } catch (err) {
    res.status(500).json({ code:500, msg:'操作失败', timestamp:Date.now() });
  }
});

// 4. 自行物理删除（删图+删库）
router.delete('/delete', auth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ code:400, msg:'作品ID不能为空', timestamp:Date.now() });

    const [workRows] = await db.query('SELECT student_id,image FROM publish_content WHERE id = ?', [id]);
    if (!workRows.length) return res.status(404).json({ code:404, msg:'作品不存在', timestamp:Date.now() });
    if (req.user.id !== workRows[0].student_id) return res.status(403).json({ code:403, msg:'无权限删除', timestamp:Date.now() });

    // 删除服务器图片
    if (workRows[0].image) {
      const relativePath = workRows[0].image.replace('http://localhost:3000', '');
      const filePath = path.join(__dirname, '../', relativePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // 物理删除数据库
    await db.query('DELETE FROM publish_content WHERE id = ?', [id]);
    res.json({ code:200, msg:'已彻底删除', timestamp:Date.now() });
  } catch (err) {
    res.status(500).json({ code:500, msg:'删除失败', timestamp:Date.now() });
  }
});

// ======================================
// 🔴 管理员专属接口（用你封装的adminAuth）
// ======================================
// 5. 管理员强制下架/上架（任意作品+通知作者）
router.put('/admin/down', auth, adminAuth, async (req, res) => {
  try {
    const { id, is_down } = req.body;

    // 参数校验
    if (!id || is_down === undefined) {
      return res.status(400).json({ code:400, msg:'作品ID/状态不能为空', timestamp:Date.now() });
    }

    // 查询作品（作者密文+标题，用于通知）
    const [workRows] = await db.query('SELECT student_id, title FROM publish_content WHERE id = ?', [id]);
    if (!workRows.length) return res.status(404).json({ code:404, msg:'作品不存在', timestamp:Date.now() });
    const { student_id: authorStudentId, title } = workRows[0];

    // 执行上下架
    await db.query('UPDATE publish_content SET is_down = ? WHERE id = ?', [is_down, id]);

    // 自动发通知给作者（notice表存密文学号，完全适配你的表结构）
    const noticeContent = `【管理员通知】您的作品《${title}》已被管理员${is_down===1?'下架':'上架'}`;
    await db.query(
      'INSERT INTO notice (student_id, content, is_read, create_time) VALUES (?, ?, 0, NOW())',
      [authorStudentId, noticeContent]
    );

    res.json({ code:200, msg:`管理员已${is_down===1?'下架':'上架'}，已通知作者`, timestamp:Date.now() });
  } catch (err) {
    res.status(500).json({ code:500, msg:'操作失败', timestamp:Date.now() });
  }
});

// 6. 管理员强制物理删除（删图+删库+通知作者）
router.delete('/admin/delete', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.body;

    // 参数校验
    if (!id) return res.status(400).json({ code:400, msg:'作品ID不能为空', timestamp:Date.now() });

    // 查询作品（作者密文+图片+标题）
    const [workRows] = await db.query('SELECT student_id, image, title FROM publish_content WHERE id = ?', [id]);
    if (!workRows.length) return res.status(404).json({ code:404, msg:'作品不存在', timestamp:Date.now() });
    const { student_id: authorStudentId, image: imageUrl, title } = workRows[0];

    // 删除服务器图片
    if (imageUrl) {
      const relativePath = imageUrl.replace('http://localhost:3000', '');
      const filePath = path.join(__dirname, '../', relativePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // 物理删除数据库
    await db.query('DELETE FROM publish_content WHERE id = ?', [id]);

    // 自动发通知给作者
    const noticeContent = `【管理员通知】您的作品《${title}》已被管理员永久删除`;
    await db.query(
      'INSERT INTO notice (student_id, content, is_read, create_time) VALUES (?, ?, 0, NOW())',
      [authorStudentId, noticeContent]
    );

    res.json({ code:200, msg:'管理员已彻底删除，已通知作者', timestamp:Date.now() });
  } catch (err) {
    res.status(500).json({ code:500, msg:'删除失败', timestamp:Date.now() });
  }
});

module.exports = router;