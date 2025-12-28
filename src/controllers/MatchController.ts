import { Request, Response, NextFunction } from 'express'
import { Match } from '../models/Match'
import { generateMatchId } from '../utils/idGenerator'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config/env'

// Use a URL-safe alphabet for match IDs (short and readable)
// const generateMatchId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6) // Removed in favor of utils/idGenerator

export class MatchController {
  /**
   * Create a new match
   * Protected route: req.user should exist (Umpire)
   */
  public createMatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamA, teamB, rules } = req.body
      const umpireId = req.user?._id

      if (!umpireId) {
        return res.fail(401, 'You must be logged in to create a match')
      }

      // Basic validation
      if (!teamA?.name || !teamB?.name) {
        return res.fail(400, 'Team A and Team B names are required')
      }

      const matchId = generateMatchId()

      const match = await Match.create({
        matchId,
        umpireId,
        teamA,
        teamB,
        rules: rules || {},
        viewers: [],
      })

      const matchLink = `${CONFIG.API_URL}${CONFIG.API_PREFIX}/matches/${matchId}/join`

      res.status(201).json({
        success: true,
        data: {
          matchId: match.matchId,
          matchLink,
          teamA: match.teamA,
          teamB: match.teamB,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Join a match by ID
   * Public route
   * Returns: User Token (JWT) for Socket.IO
   */
  public joinMatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { matchId } = req.params
      const { username } = req.body

      if (!username) {
        return res.fail(400, 'Username is required')
      }

      const match = await Match.findOne({ matchId })
      if (!match) {
        return res.fail(404, 'Match not found')
      }

      // Try atomic reservation: only push if username not exists
      const viewerToken = jwt.sign({ matchId, username, role: 'viewer' }, CONFIG.JWT_SECRET, {
        expiresIn: '24h',
      })
      const result = await Match.updateOne(
        { matchId, 'viewers.username': { $ne: username } },
        { $push: { viewers: { username, token: viewerToken } } }
      )
      if (result.modifiedCount === 0) {
        // Already joined – return existing token
        const existing = match.viewers.find((v) => v.username === username)
        if (!existing?.token) {
          // Backfill token if missing
          await Match.updateOne(
            { matchId, 'viewers.username': username },
            { $set: { 'viewers.$.token': viewerToken } }
          )
        }
      }

      // Generate a temporary join token
      const token =
        result.modifiedCount === 0
          ? (match.viewers.find((v) => v.username === username)?.token as string)
          : viewerToken

      res.status(200).json({
        success: true,
        data: {
          token,
          match: {
            teamA: match.teamA,
            teamB: match.teamB,
            score: match.score,
            status: match.status,
            rules: match.rules,
          },
        },
      })
    } catch (error) {
      // If race condition on updateOne fails (if we had unique constraint), separate catch.
      // Current array push logic won't fail on race but might allow duplicates if parallel reads passed.
      // For MVP, acceptable.
      next(error)
    }
  }

  /**
   * Get current match details
   * Public route
   */
  public getMatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { matchId } = req.params
      const match = await Match.findOne({ matchId })
      if (!match) {
        return res.fail(404, 'Match not found')
      }
      res.status(200).json({
        success: true,
        data: {
          matchId: match.matchId,
          teamA: match.teamA,
          teamB: match.teamB,
          score: match.score,
          status: match.status,
          rules: match.rules,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * End the match (Umpire only)
   */
  public endMatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { matchId } = req.params
      const umpireId = req.user?._id
      if (!umpireId) {
        return res.fail(401, 'You must be logged in as the umpire to end the match')
      }
      const match = await Match.findOne({ matchId, umpireId })
      if (!match) {
        return res.fail(404, 'Match not found')
      }
      await Match.deleteOne({ matchId })
      // Socket cleanup is handled in socket channel; here we just respond
      res.status(200).json({ success: true, message: 'Match ended' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Leave match (Viewer)
   * Requires viewer token matching the match
   */
  public leaveMatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { matchId } = req.params
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.fail(401, 'Missing or invalid Authorization header')
      }
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any
      if (decoded.role !== 'viewer' || decoded.matchId !== matchId) {
        return res.fail(403, 'Viewer token does not belong to this match')
      }
      await Match.updateOne({ matchId }, { $pull: { viewers: { username: decoded.username } } })
      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }
}
