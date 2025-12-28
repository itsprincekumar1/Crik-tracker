import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config/env'
import User from '../models/User'

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.fail(401, 'unauthorized')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any

    const user = await User.findById(decoded.id || decoded._id || decoded.userId || decoded.sub)
    if (!user) {
      return res.fail(401, 'user_not_found')
    }

    req.user = user // Add user to request
    next()
  } catch (error) {
    return res.fail(401, 'invalid_token')
  }
}
