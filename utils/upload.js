const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 头像上传配置
const avatarUploadPath = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarUploadPath)) fs.mkdirSync(avatarUploadPath, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarUploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = Date.now() + '_' + Math.random().toString(36).slice(6) + ext;
    cb(null, fileName);
  }
});

// 发布内容上传配置
const publishUploadPath = path.join(__dirname, '../../uploads/publish');
if (!fs.existsSync(publishUploadPath)) fs.mkdirSync(publishUploadPath, { recursive: true });

const publishStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, publishUploadPath),
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
module.exports = {
  avatarUpload: multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
  }),
  publishUpload: multer({
    storage: publishStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
  })
};