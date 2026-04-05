const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 上传目录
const uploadPath = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = Date.now() + '_' + Math.random().toString(36).slice(6) + ext;
    cb(null, fileName);
  }
});

// 图片过滤
const fileFilter = (req, file, cb) => {
  file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('只能上传图片'));
};

// 导出上传对象（给路由用）
module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});