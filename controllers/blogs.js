const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1, id: 1 })
  response.json(blogs)
})

blogsRouter.post('/', userExtractor, async (request, response) => {
  const user = request.user

  if (!request.body.title) {
    return response.status(400).json('title must be included')
  }

  if (!request.body.url) {
    return response.status(400).json('url must be included')
  }

  const { title, url, author, likes } = request.body
  const blog = new Blog({ title, url, author, likes })
  if (!blog.likes) {
    blog.likes = 0
  }

  blog.user = user._id

  console.log('creating blog', blog)

  const result = await blog.save()
  console.log('saved result', result)

  user.blogs = user.blogs.concat(result._id)
  await user.save()

  response.status(201).json(result)
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  if (!body.likes) {
    return response.status(400).json('likes property is not included')
  }

  const blog = {
    likes: body.likes
  }

  const result = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.status(200).json(result)
})

blogsRouter.delete('/:id', userExtractor, async (request, response) => {
  const user = request.user
  const blog = await Blog.findById(request.params.id)
  const blogsList = await Blog.find({})
  console.log('blogsList', blogsList)
  console.log('id', request.params.id)
  console.log('blog', blog)
  console.log('user', user)

  if (!blog) {
    return response.status(404).json({ error: 'blog not found' })
  }

  if (blog.user.toString() === user._id.toString()) {
    await Blog.findByIdAndDelete(request.params.id)
  }
  else {
    return response.status(401).json({ error: 'not allowed to delete this blog' })
  }
  const blogafter = await Blog.find({})
  console.log('blogsList after deletion', blogafter)
  return response.status(204).end()
})

module.exports = blogsRouter