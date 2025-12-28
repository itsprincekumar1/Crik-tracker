import mongoose, { Schema, Document } from 'mongoose'

export interface IPlayer {
  name: string
  // Extendable for future (runs, balls, etc.)
}

export interface ITeam {
  name: string
  players: IPlayer[]
}

export interface IScore {
  runs: number
  wickets: number
  overs: number
  currentInnings: string
  batting: {
    striker: string
    nonStriker: string
  }
  bowling: {
    bowler: string
  }
  recentBalls: string[] // List of outcomes e.g. ["1", "W", "6"]
}

export interface IMatch extends Document {
  matchId: string
  umpireId: mongoose.Types.ObjectId
  teamA: ITeam
  teamB: ITeam
  score: IScore
  status: 'LIVE' | 'COMPLETED'
  viewers: { username: string; token?: string; socketId?: string }[]
  comments: { user: string; message: string; timestamp: Date }[]
  rules: Record<string, any>
  connectedUsers: number // optimization for quick counts
  createdAt: Date
}

const PlayerSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { _id: false }
)

const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    players: [PlayerSchema],
  },
  { _id: false }
)

const ScoreSchema = new Schema(
  {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0.0 }, // using float notation specifically for balls? Or just string? keeping number for now.
    currentInnings: { type: String, default: '1st Innings' },
    batting: {
      striker: String,
      nonStriker: String,
    },
    bowling: {
      bowler: String,
    },
    recentBalls: [String],
  },
  { _id: false }
)

const MatchSchema = new Schema<IMatch>(
  {
    matchId: { type: String, required: true, unique: true, index: true },
    umpireId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamA: { type: TeamSchema, required: true },
    teamB: { type: TeamSchema, required: true },
    score: {
      type: ScoreSchema,
      default: () => ({ runs: 0, wickets: 0, overs: 0, recentBalls: [] }),
    },
    status: { type: String, enum: ['LIVE', 'COMPLETED'], default: 'LIVE' },
    viewers: [
      {
        username: { type: String, required: true },
        token: String,
        socketId: String,
      },
    ],
    comments: [
      {
        user: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    rules: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

// Ensure matchId is indexed for fast lookups
MatchSchema.index({ matchId: 1 })

export const Match = mongoose.model<IMatch>('Match', MatchSchema)
