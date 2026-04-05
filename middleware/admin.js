const adminAuth = (req, res, next) => {
  if (req.user.is_admin !== 1) {
    return res.json({ 
      code: 403, 
      msg: '无管理员权限', 
      data: null, 
      timestamp: Date.now() 
    });
  }
  next();
};
module.exports = adminAuth;