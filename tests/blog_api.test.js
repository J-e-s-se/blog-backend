const app = require('../app')
const Blog = require('../models/blog')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
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
      .send(blogWithNoUrl)
      .expect(400)

    const blogWithNoTitle = {
      url: 'www.fish.com',
      author: 'Bob Fisher',
      likes: 10
    }

    await api
      .post('/api/blogs')
      .send(blogWithNoTitle)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

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

afterAll(() => {
  mongoose.connection.close()
})