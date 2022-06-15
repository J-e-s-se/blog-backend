const jwt = require('jsonwebtoken')
const User = require('../models/user')

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7)
  }
  next()
}

const userExtractor = async (request, response, next) => {
  if (!request.token) {
    return response.status(401).json({ error: 'missing token' })
  }

  let decodedToken

  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET)
  }
  catch {
    return response.status(401).json({ error: 'invalid token' })
  }

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'invalid token' })
  }

  request.user = await User.findById(decodedToken.id)

  if (!request.user) {
    return response.status(401).json({ error: 'invalid user' })
  }
  next()
}

module.exports = { tokenExtractor, userExtractor }