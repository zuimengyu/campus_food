require('dotenv').config()
const { createClient } = require('redis')

const redis = createClient()
redis.connect()

module.exports = redis