const app = require('../app')
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')

const api = supertest(app)

let userAuth

beforeEach(async () => {
  await User.deleteMany({})
  const username = 'falzbadman98'
  const name = 'Falz Man'
  const password = '298ei09{fz}'
  const passwordHash = await bcrypt.hash(password, 10)
  const user = new User({ username, name, passwordHash })
  await user.save()

  const response = await api
    .post('/api/login')
    .send({ username, password })

  userAuth = response.body.token
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
}, 100000)

describe('when blogs are initially saved to database', () => {
  test('blogs are returned in JSON format', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('content-type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('the unique identifier property of the blog posts is named id', async() => {
    const response = await api.get('/api/blogs')
    expect(response.body[0].id).toBeDefined()
  })
})

describe('creating a new blog post', () => {
  test('succeeds with 201 when request data is valid', async () => {
    await api
      .post('/api/blogs')
      .set({ 'Authorization': `Bearer ${userAuth}` })
      .send(helper.validBlog)
      .expect(201)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const blogTitles = blogsAtEnd.map(blog => blog.title)
    expect(blogTitles).toContain(helper.validBlog.title)
  })

  test('defaults the likes property to zero if it is not included in the post data', async () => {
    const blogWithNoLikes = {
      title: 'Python the hard way',
      author: 'Benn Ten',
      url: 'www.cn.com',
    }

    const response = await api
      .post('/api/blogs')
      .set({ 'Authorization': `Bearer ${userAuth}` })
      .send(blogWithNoLikes)
      .expect(201)

    expect(response.body.likes).toBe(0)
  })

  test ('fails with 400 when request data is invalid', async () => {
    const blogWithNoUrl = {
      title: 'How to become Invisible',
      author: 'Mister Nobody',
      likes: 7
    }

    await api
      .post('/api/blogs')
      .set({ 'Authorization': `Bearer ${userAuth}` })
      .send(blogWithNoUrl)
      .expect(400)

    const blogWithNoTitle = {
      url: 'www.fish.com',
      author: 'Bob Fisher',
      likes: 10
    }

    await api
      .post('/api/blogs')
      .set({ 'Authorization': `Bearer ${userAuth}` })
      .send(blogWithNoTitle)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('fails with status code 401 if token is not provided', async () => {
    const response = await api
      .post('/api/blogs')
      .send(helper.validBlog)
      .expect(401)

    expect(response.body).toEqual({ error: 'missing token' })
  })
})

describe('deletion of a blog', () => {
  beforeEach(async () => {
    await api
      .post('/api/blogs')
      .set({ 'Authorization': `Bearer ${userAuth}` })
      .send(helper.validBlog)

  })

  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = await Blog.findOne({ title: helper.validBlog.title })

    await api
      .delete(`/api/blogs/${blogToDelete._id}`)
      .set({ 'Authorization': `Bearer ${userAuth}` })
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

    const blogTitles = blogsAtEnd.map(blog => blog.title)
    expect(blogTitles).not.toContain(blogToDelete.title)
  })
})

describe('updating a blog post', () => {
  test('succeeds with status code 200 if likes property is included', async () => {
    const blogs = await helper.blogsInDb()
    const blogToBeUpdated = blogs[0]

    const blogUpdate = {
      likes: 99
    }

    await api
      .put(`/api/blogs/${blogToBeUpdated.id}`)
      .send(blogUpdate)
      .expect(200)

    const updatedBlogs = await helper.blogsInDb()

    expect(updatedBlogs[0]).toEqual({ ...blogToBeUpdated , likes: blogUpdate.likes })
  })
})

describe('creating a new user', () => {

  test('fails with status code 400 when username is not given', async () => {
    const invalidUser = {
      name: 'Jim Ben',
      password: 'w28o292II'
    }

    const response = await api
      .post('/api/users')
      .send(invalidUser)
      .expect(400)

    expect(response.body).toContain('username not given')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(1)
  })

  test('fails with status code 400 when password is not given', async () => {
    const invalidUser = {
      username: 'indiesman98',
      name: 'Jim Ben',
    }

    const response = await api
      .post('/api/users')
      .send(invalidUser)
      .expect(400)

    expect(response.body).toContain('password not given')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(1)
  })

  test('fails with status code 400 when username is shorter than 3 characters', async () => {
    const invalidUser = {
      username: 'Me',
      name: 'Ben Ten',
      password: 'weshallseetomorrow398#'
    }

    const response = await api
      .post('/api/users')
      .send(invalidUser)
      .expect(400)

    expect(response.body).toContain('username must be at least 3 characters long')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(1)
  })

  test('fails with status code 400 when password is shorter than 3 characters', async () => {
    const invalidUser = {
      name: 'Mr John',
      username: 'indiesman98',
      password: 'we'
    }

    const response = await api
      .post('/api/users')
      .send(invalidUser)
      .expect(400)

    expect(response.body).toContain('password must be at least 3 characters long')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(1)
  })

  test('fails with status code 400 when username is not unique', async () => {
    const invalidUser = {
      username: 'falzbadman98',
      name: 'Bin Zip',
      password: '2938[li**9]',
    }

    const response = await api
      .post('/api/users')
      .send(invalidUser)
      .expect(400)

    expect(response.body).toContain('username must be unique')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(1)
  })

})

afterAll(() => {
  mongoose.connection.close()
})