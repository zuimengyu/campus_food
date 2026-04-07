const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// 6.1 广场内容列表
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, student_id, title, content, image, like_count, create_time 
       FROM publish_content 
       WHERE is_down = 0 
       ORDER BY create_time DESC`
    );
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: rows.length,
        list: rows
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('获取广场内容列表失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 6.2 广场点赞/取消
router.post('/like', auth, async (req, res) => {
  const { contribute_id, action } = req.body;
  const student_id = req.user.id;
  
  try {
    if (action === 'like') {
      // 检查是否已点赞
      const [existingLike] = await db.query(
        'SELECT * FROM user_like WHERE student_id = ? AND publish_id = ?',
        [student_id, contribute_id]
      );
      
      if (existingLike.length === 0) {
        // 插入点赞记录
        await db.query(
          'INSERT INTO user_like (student_id, publish_id) VALUES (?, ?)',
          [student_id, contribute_id]
        );
        // 更新点赞数
        await db.query(
          'UPDATE publish_content SET like_count = like_count + 1 WHERE id = ?',
          [contribute_id]
        );
      }
    } else if (action === 'cancel') {
      // 删除点赞记录
      await db.query(
        'DELETE FROM user_like WHERE student_id = ? AND publish_id = ?',
        [student_id, contribute_id]
      );
      // 更新点赞数
      await db.query(
        'UPDATE publish_content SET like_count = GREATEST(0, like_count - 1) WHERE id = ?',
        [contribute_id]
      );
    }
    
    // 获取最新点赞数
    const [result] = await db.query(
      'SELECT like_count FROM publish_content WHERE id = ?',
      [contribute_id]
    );
    
    res.json({
      code: 200,
      msg: '操作成功',
      data: { like_count: result[0].like_count },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('广场点赞操作失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 6.3 广场排名
router.get('/rank', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, like_count, student_id, create_time 
       FROM publish_content 
       WHERE is_down = 0 
       ORDER BY like_count DESC, create_time ASC`
    );
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: rows,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('获取广场排名失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 6.4 删除广场内容
router.delete('/delete/:id', auth, async (req, res) => {
  const { id } = req.params;
  const student_id = req.user.id;
  
  try {
    // 检查是否是内容作者
    const [content] = await db.query(
      'SELECT student_id FROM publish_content WHERE id = ?',
      [id]
    );
    
    if (content.length === 0) {
      return res.status(404).json({ code: 404, msg: '内容不存在', data: null, timestamp: Date.now() });
    }
    
    if (content[0].student_id !== student_id && !req.user.is_admin) {
      return res.status(403).json({ code: 403, msg: '无权限删除', data: null, timestamp: Date.now() });
    }
    
    // 删除相关的标签关联记录
    await db.query('DELETE FROM content_tag_relation WHERE publish_id = ?', [id]);
    
    // 删除相关的点赞记录
    await db.query('DELETE FROM user_like WHERE publish_id = ?', [id]);
    
    // 删除相关的收藏记录
    await db.query('DELETE FROM user_collect WHERE publish_id = ?', [id]);
    
    // 删除相关的评论记录
    await db.query('DELETE FROM comment WHERE publish_id = ?', [id]);
    
    // 删除内容
    await db.query('DELETE FROM publish_content WHERE id = ?', [id]);
    
    res.json({
      code: 200,
      msg: '删除成功',
      data: null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('删除广场内容失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

module.exports = router;