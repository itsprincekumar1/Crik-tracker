import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config/env'
import { Match } from '../models/Match'

// Extend Socket interface to include user info
interface MatchSocket extends Socket {
  user?: {
    matchId: string
    username?: string
    id?: string // umpire id
    role: 'viewer' | 'umpire'
  }
}

export function init(io: Server) {
  // Middleware for Auth
  io.use(async (socket: MatchSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token

      if (!token) {
        return next(new Error('Authentication error'))
      }

      const decoded = jwt.verify(token as string, CONFIG.JWT_SECRET) as any

      // Check if it's a viewer token or full user token
      if (decoded.role === 'viewer') {
        socket.user = {
          matchId: decoded.matchId,
          username: decoded.username,
          role: 'viewer',
        }
      } else {
        // Assume Umpire (standard user token)
        // We might need matchId passed in query for Umpire to know which match context they are connecting to initially?
        // Or Umpire joins explicitly via event.
        // Let's allow generic auth here, and handle specific match join in 'join_match' event for Umpire,
        // BUT requirements say "socket.join(room)".
        // For Umpire, they might be handling multiple matches? unlikely.
        // Let's assume Umpire passes `matchId` in query too if they want to scope context, or we handle it in `join`.
        socket.user = {
          matchId: socket.handshake.query.matchId as string, // Optional for Umpire at connect
          id: decoded.id || decoded._id || decoded.sub,
          role: 'umpire',
        }
      }

      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket: MatchSocket) => {
    console.log(`Socket connected: ${socket.id}, Role: ${socket.user?.role}`)

    // Auto-join match room if viewer
    if (socket.user?.role === 'viewer' && socket.user.matchId) {
      socket.join(socket.user.matchId)
      // Notify others? Maybe not necessary for viewers to avoid noise
    }

    socket.on('join_match', async (matchId: string) => {
      // For Umpire or explicit join
      if (socket.user?.role === 'umpire') {
        // Verify Umpire owns this match
        const match = await Match.findOne({ matchId, umpireId: socket.user.id })
        if (match) {
          socket.join(matchId)
          socket.emit('joined_as_umpire', { matchId })
        } else {
          socket.emit('error', 'Not authorized as Umpire for this match')
        }
      }
    })

    // SCORE UPDATE (Umpire Only)
    socket.on('umpire_action', async (payload) => {
      try {
        if (socket.user?.role !== 'umpire') {
          return socket.emit('error', 'Unauthorized')
        }

        // We know which match they are in?
        // We should trust the payload matchId or the socket room?
        // Let's assume payload has matchId or we track it.
        // Ideally Umpire is only in one match context active.
        // Let's require matchId in payload or infer from room.
        const matchId = payload.matchId
        if (!matchId) return socket.emit('error', 'Match ID missing')

        // Verify again match ownership to be safe (or rely on join_match room)
        const match = await Match.findOne({ matchId, umpireId: socket.user.id })
        if (!match) return socket.emit('error', 'Match not found')

        if (match.status === 'COMPLETED') return socket.emit('error', 'Match ended')

        // UPDATE Logic
        // payload.type: 'UPDATE_SCORE' | 'WICKET' | 'OVER_COMPLETE'
        // payload.data: { ... }

        // For MVP: We accept the NEW STATE or Update Delta.
        // Requirements: "Score updates must be broadcast... Frontend should reflect changes"
        // Let's assume payload.newScore is sent or we update simple counters.
        // Implementation Plan said: "Umpire sends the *New State* or a *Delta*."
        // Let's accept a partial update for flexibility.

        const { action, data } = payload

        if (action === 'UPDATE_SCORE') {
          // data could be { runs: totalRuns, wickets: totalWickets } etc
          // OR { runs: +1 }
          // Let's stick to REPLACING the score object partially for robustness against de-sync
          if (data.score) {
            match.score = { ...match.score, ...data.score }
          }
          // Update batting/bowling state if provided
          if (data.batting) match.score.batting = data.batting
          if (data.bowling) match.score.bowling = data.bowling
          if (data.recentBalls) match.score.recentBalls = data.recentBalls
        }

        // Save
        await match.save()

        // Broadcast
        io.to(matchId).emit('score_updated', match.score)
      } catch (err) {
        console.error(err)
        socket.emit('error', 'Update failed')
      }
    })

    // COMMENT / CHAT
    socket.on('send_comment', async (payload) => {
      // payload: { matchId, message }
      const { matchId, message } = payload
      if (!matchId || !message) return

      // Verify user is in room
      if (!socket.rooms.has(matchId)) return

      const commentData = {
        id: Date.now().toString(), // simple ID
        user: socket.user?.username || 'Umpire',
        message,
        timestamp: new Date(),
      }

      try {
        // Save to DB (Temporary storage)
        await Match.updateOne({ matchId }, { $push: { comments: commentData } })
        io.to(matchId).emit('new_comment', commentData)
      } catch (e) {
        console.error('Failed to save comment', e)
      }
    })

    // END MATCH
    socket.on('end_match', async (payload) => {
      if (socket.user?.role !== 'umpire') return
      const { matchId } = payload

      const match = await Match.findOne({ matchId, umpireId: socket.user.id })
      if (!match) return

      // Broadcast
      io.to(matchId).emit('match_ended', { matchId })

      // CLEANUP
      // Delete data
      await Match.deleteOne({ matchId })

      // Disconnect all
      io.in(matchId).disconnectSockets(true)
    })

    socket.on('disconnect', () => {
      const user = socket.user
      if (user?.role === 'viewer' && user.matchId && user.username) {
        Match.updateOne(
          { matchId: user.matchId },
          { $pull: { viewers: { username: user.username } } }
        ).catch(() => {})
      }
    })
  })
}
