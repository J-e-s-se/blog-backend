const _ = require('lodash')
const dummy = (blogs) => {
  blogs
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }

  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if (0 === blogs.length) {
    return {}
  }
  const maxReducer = (prevBlog, newBlog) => {
    return newBlog.likes > prevBlog.likes ? newBlog : prevBlog
  }
  const blog =  blogs.reduce(maxReducer)
  const favBlog = { title: blog.title, author: blog.author, likes:blog.likes }
  return favBlog
}

const mostBlogs = (blogs) => {
  const blogsByAuthor = _.groupBy(blogs, 'author')
  const authorsBlogs = _.map(blogsByAuthor, (values, key) => {
    return {
      author: key,
      blogs: values.length
    }
  })

  return _.maxBy(authorsBlogs, 'blogs')
}

const mostLikes = (blogs) => {
  const blogsByAuthor = _.groupBy(blogs, 'author')
  const authorsLikes = _.map(blogsByAuthor, (values, key) => {
    return {
      author: key,
      likes: _.sumBy(values, 'likes')
    }
  })
  return _.maxBy(authorsLikes, 'likes')
}
module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes }