import { z } from 'zod'

const playerSchema = z.object({
  name: z.string().min(1),
})

const teamSchema = z.object({
  name: z.string().min(1),
  players: z.array(playerSchema).min(1),
})

export const createMatchSchema = z.object({
  teamA: teamSchema,
  teamB: teamSchema,
  rules: z.record(z.string(), z.any()).optional(),
})

export const joinMatchSchema = z.object({
  username: z.string().min(2).max(20),
})
