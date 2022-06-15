const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1, id:1 })
  response.status(200).json(users)
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  if (!username) {
    return response.status(400).json('username not given')
  }
  if (!password) {
    return response.status(400).json('password not given')
  }
  if (username.length < 3) {
    return response.status(400).json('username must be at least 3 characters long')
  }
  if (password.length < 3) {
    return response.status(400).json('password must be at least 3 characters long')
  }

  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return response.status(400).json('username must be unique')
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash
  })

  const savedUser = await user.save()
  response.status(201).json(savedUser)
})

module.exports = usersRouter