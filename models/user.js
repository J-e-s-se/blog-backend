const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  passwordHash: String,

  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog'
    }
  ]
})

userSchema.set('toJSON', {
  transform: (doc,  ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.passwordHash
    delete ret.__v
  }
})

module.exports = mongoose.model('User', userSchema)