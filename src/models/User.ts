import mongoose, { Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  compare(password: string): Promise<boolean>
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
)

UserSchema.pre('save', async function (next) {
  const self = this as IUser
  if (!self.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  self.password = await bcrypt.hash(self.password, salt)
  next()
})

UserSchema.methods.compare = function (password: string) {
  return bcrypt.compare(password, this.password)
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)
export default User
