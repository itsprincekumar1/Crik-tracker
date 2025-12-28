import { Request, Response } from 'express'
import { getIO } from '../core/Socket'
import { Match } from '../models/Match'

export class SocketTestController {
  emit = async (req: Request, res: Response) => {
    const { matchId, event, data } = req.body as { matchId: string; event: string; data: any }
    if (!matchId || !event) return res.fail(400, 'Invalid request: matchId and event are required')

    const match = await Match.findOne({ matchId })
    if (!match) return res.fail(404, 'Match not found')

    if (event === 'score_updated' && data?.score) {
      match.score = { ...match.score, ...data.score }
      if (data.batting) match.score.batting = data.batting
      if (data.bowling) match.score.bowling = data.bowling
      if (data.recentBalls) match.score.recentBalls = data.recentBalls
      await match.save()
    }

    if (event === 'new_comment' && data?.message) {
      const commentData = {
        user: data.user || 'Swagger',
        message: data.message,
        timestamp: new Date(),
      }
      await Match.updateOne({ matchId }, { $push: { comments: commentData } })
      getIO().to(matchId).emit('new_comment', commentData)
      return res.ok({ emitted: true })
    }

    getIO()
      .to(matchId)
      .emit(event, data || {})
    return res.ok({ emitted: true })
  }
}
