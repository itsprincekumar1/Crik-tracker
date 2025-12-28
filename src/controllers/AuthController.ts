import { Request, Response } from 'express'
import User from '../models/User'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config/env'

export class AuthController {
  register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body as { email: string; password: string; name: string }
    const exists = await User.findOne({ email })
    if (exists) return res.fail(409, 'Email is already registered')
    const user = await User.create({ email, password, name })
    return res.created({ id: user._id, email: user.email, name: user.name })
  }

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string }
    const user = await User.findOne({ email })
    if (!user) return res.unauthorized('Invalid email or password')
    const match = await user.compare(password)
    if (!match) return res.unauthorized('Invalid email or password')
    const token = jwt.sign({ id: user._id }, CONFIG.JWT_SECRET, { expiresIn: '24h' })
    return res.ok({ token })
  }
}
