import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config/env'
import { Match } from '../models/Match'

export const requireMatchToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { matchId } = req.params as { matchId: string }
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.fail(401, 'unauthorized')
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any

    if (decoded.role === 'viewer') {
      if (decoded.matchId !== matchId) {
        return res.fail(403, 'Forbidden')
      }
      // ensure viewer is still registered
      const exists = await Match.findOne({
        matchId,
        viewers: { $elemMatch: { username: decoded.username, token } },
      })
      if (!exists) {
        return res.fail(403, 'Forbidden')
      }
      return next()
    }

    // Assume umpire token (standard user token)
    // For viewing, we only require valid user token; optionally ensure umpire owns the match to get privileged info
    // Here we allow any authenticated user to view details per original requirements
    return next()
  } catch (error) {
    return res.fail(401, 'invalid_token')
  }
}
