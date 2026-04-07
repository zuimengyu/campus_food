const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// 7.1 内容点赞/取消
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
    console.error('点赞操作失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 7.2 我的点赞
router.get('/my-like', auth, async (req, res) => {
  const { pageNum = 1, pageSize = 10 } = req.query;
  const student_id = req.user.id;
  const offset = (pageNum - 1) * pageSize;
  
  try {
    // 获取点赞列表
    const [rows] = await db.query(
      `SELECT ul.id, ul.publish_id as contribute_id, pc.title, ul.create_time 
       FROM user_like ul 
       JOIN publish_content pc ON ul.publish_id = pc.id 
       WHERE ul.student_id = ? 
       ORDER BY ul.create_time DESC 
       LIMIT ? OFFSET ?`,
      [student_id, parseInt(pageSize), parseInt(offset)]
    );
    
    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM user_like WHERE student_id = ?',
      [student_id]
    );
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total: countResult[0].total,
        list: rows
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('获取我的点赞失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 7.3 收藏/取消收藏
router.post('/collect', auth, async (req, res) => {
  const { contribute_id, action } = req.body;
  const student_id = req.user.id;
  
  try {
    if (action === 'collect') {
      // 检查是否已收藏
      const [existingCollect] = await db.query(
        'SELECT * FROM user_collect WHERE student_id = ? AND publish_id = ?',
        [student_id, contribute_id]
      );
      
      if (existingCollect.length === 0) {
        // 插入收藏记录
        await db.query(
          'INSERT INTO user_collect (student_id, publish_id) VALUES (?, ?)',
          [student_id, contribute_id]
        );
        // 更新收藏数
        await db.query(
          'UPDATE publish_content SET collect_count = collect_count + 1 WHERE id = ?',
          [contribute_id]
        );
      }
    } else if (action === 'cancel') {
      // 删除收藏记录
      await db.query(
        'DELETE FROM user_collect WHERE student_id = ? AND publish_id = ?',
        [student_id, contribute_id]
      );
      // 更新收藏数
      await db.query(
        'UPDATE publish_content SET collect_count = GREATEST(0, collect_count - 1) WHERE id = ?',
        [contribute_id]
      );
    }
    
    // 获取最新收藏数
    const [result] = await db.query(
      'SELECT collect_count FROM publish_content WHERE id = ?',
      [contribute_id]
    );
    
    res.json({
      code: 200,
      msg: '操作成功',
      data: { collect_count: result[0].collect_count },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 7.4 我的收藏
router.get('/my-collect', auth, async (req, res) => {
  const student_id = req.user.id;
  
  try {
    // 获取收藏列表
    const [rows] = await db.query(
      `SELECT uc.id, uc.publish_id as contribute_id, pc.title, uc.create_time 
       FROM user_collect uc 
       JOIN publish_content pc ON uc.publish_id = pc.id 
       WHERE uc.student_id = ? 
       ORDER BY uc.create_time DESC`,
      [student_id]
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
    console.error('获取我的收藏失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 7.5 发布评论
router.post('/comment', auth, async (req, res) => {
  const { contribute_id, content, comment_type } = req.body;
  const student_id = req.user.id;
  
  try {
    // 插入评论
    const [result] = await db.query(
      'INSERT INTO comment (publish_id, student_id, content, comment_type) VALUES (?, ?, ?, ?)',
      [contribute_id, student_id, content, comment_type || 0]
    );
    
    // 更新评论数
    await db.query(
      'UPDATE publish_content SET comment_count = comment_count + 1 WHERE id = ?',
      [contribute_id]
    );
    
    res.json({
      code: 200,
      msg: '发布成功',
      data: {
        id: result.insertId,
        contribute_id,
        content,
        create_time: new Date().toISOString()
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('发布评论失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 7.6 评论列表
router.get('/comment/list/:contribute_id', async (req, res) => {
  const { contribute_id } = req.params;
  
  try {
    // 获取评论列表
    const [rows] = await db.query(
      `SELECT id, student_id, content, create_time 
       FROM comment 
       WHERE publish_id = ? 
       ORDER BY create_time ASC`,
      [contribute_id]
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
    console.error('获取评论列表失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

// 7.7 删除评论
router.delete('/comment/:id', auth, async (req, res) => {
  const { id } = req.params;
  const student_id = req.user.id;
  
  try {
    // 检查评论是否存在
    const [comment] = await db.query(
      'SELECT student_id, publish_id FROM comment WHERE id = ?',
      [id]
    );
    
    if (comment.length === 0) {
      return res.status(404).json({ code: 404, msg: '评论不存在', data: null, timestamp: Date.now() });
    }
    
    // 检查是否是评论作者或管理员
    if (comment[0].student_id !== student_id && !req.user.is_admin) {
      return res.status(403).json({ code: 403, msg: '无权限删除', data: null, timestamp: Date.now() });
    }
    
    // 删除评论
    await db.query('DELETE FROM comment WHERE id = ?', [id]);
    
    // 更新评论数
    await db.query(
      'UPDATE publish_content SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ?',
      [comment[0].publish_id]
    );
    
    res.json({
      code: 200,
      msg: '删除成功',
      data: null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误', data: null, timestamp: Date.now() });
  }
});

module.exports = router;