const crypto = require('crypto')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const ALG = 'aes-128-cbc'
const key = Buffer.from(process.env.AES_KEY, 'utf8')
const iv = Buffer.from(process.env.AES_IV.slice(0,16), 'utf8')

// 学号 AES 加密
exports.encryptStuId = (text) => {
  const c = crypto.createCipheriv(ALG, key, iv)
  let r = c.update(text, 'utf8', 'hex')
  r += c.final('hex')
  return r
}

// 学号 AES 解密
exports.decryptStuId = (hex) => {
  const d = crypto.createDecipheriv(ALG, key, iv)
  let r = d.update(hex, 'hex', 'utf8')
  r += d.final('utf8')
  return r
}

// 密码哈希
exports.hashPwd = (pwd) => bcrypt.hashSync(pwd, 10)

// 密码校验
exports.comparePwd = (pwd, hash) => bcrypt.compareSync(pwd, hash)