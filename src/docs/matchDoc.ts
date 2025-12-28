const MatchDoc = {
  createMatchDoc: {
    tags: ['match'],
    summary: 'Create a new match (Umpire only)',
    description:
      'Creates a match with Team A and Team B. The authenticated user becomes the Umpire. Returns unique `matchId` and a shareable join link.',
    parameters: [
      {
        name: 'Authorization',
        in: 'header',
        required: true,
        description: 'Bearer token of authenticated umpire user',
        schema: { type: 'string', example: 'Bearer <jwt>' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              teamA: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  players: {
                    type: 'array',
                    items: { type: 'object', properties: { name: { type: 'string' } } },
                  },
                },
                required: ['name', 'players'],
              },
              teamB: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  players: {
                    type: 'array',
                    items: { type: 'object', properties: { name: { type: 'string' } } },
                  },
                },
                required: ['name', 'players'],
              },
              rules: { type: 'object', additionalProperties: true },
            },
            required: ['teamA', 'teamB'],
          },
          example: {
            teamA: { name: 'Warriors', players: [{ name: 'Alice' }, { name: 'Bob' }] },
            teamB: { name: 'Titans', players: [{ name: 'Eve' }, { name: 'Mallory' }] },
            rules: { overs: 20, powerplayOvers: 6 },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Match created',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                matchId: 'abc123',
                matchLink: 'https://api.example.com/api/v1/matches/abc123/join',
                teamA: { name: 'Warriors' },
                teamB: { name: 'Titans' },
              },
            },
          },
        },
      },
      401: { description: 'Unauthorized' },
      400: { description: 'Validation error' },
    },
  },

  getMatchDoc: {
    tags: ['match'],
    summary: 'Get match details (Viewer or Umpire token required)',
    description:
      'Returns current match state including teams, score, status, and rules. Requires either a valid viewer token for the match or a valid umpire JWT.',
    parameters: [
      { name: 'matchId', in: 'path', required: true, schema: { type: 'string' } },
      {
        name: 'Authorization',
        in: 'header',
        required: true,
        description: 'Bearer viewer token for this match or umpire JWT',
        schema: { type: 'string', example: 'Bearer <jwt>' },
      },
    ],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                matchId: 'abc123',
                teamA: { name: 'Warriors', players: [{ name: 'Alice' }, { name: 'Bob' }] },
                teamB: { name: 'Titans', players: [{ name: 'Eve' }, { name: 'Mallory' }] },
                score: {
                  runs: 56,
                  wickets: 2,
                  overs: 7.3,
                  batting: { striker: 'Alice', nonStriker: 'Bob' },
                  bowling: { bowler: 'Trudy' },
                  recentBalls: ['1', '4', 'W', '0'],
                },
                status: 'LIVE',
                rules: { overs: 20 },
              },
            },
          },
        },
      },
      401: { description: 'Unauthorized' },
      404: { description: 'Match not found' },
    },
  },

  joinMatchDoc: {
    tags: ['match'],
    summary: 'Join a match (public)',
    description:
      'Reserves a unique username for the specified match and returns a viewer token for Socket.IO and authenticated GET requests. If the username is already reserved for this match, returns the same existing token.',
    parameters: [{ name: 'matchId', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { username: { type: 'string' } },
            required: ['username'],
          },
          example: { username: 'fan_123' },
        },
      },
    },
    responses: {
      200: {
        description: 'Joined, returns viewer token and match snapshot',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                token: '<viewer-jwt>',
                match: {
                  teamA: { name: 'Warriors' },
                  teamB: { name: 'Titans' },
                  score: { runs: 0, wickets: 0, overs: 0 },
                  status: 'LIVE',
                  rules: { overs: 20 },
                },
              },
            },
          },
        },
      },
      409: { description: 'Username already taken' },
      404: { description: 'Match not found' },
      400: { description: 'Validation error' },
    },
  },

  endMatchDoc: {
    tags: ['match'],
    summary: 'End match (Umpire only)',
    description:
      'Ends the match, deletes its data, disconnects all sockets in the room, and invalidates the join link.',
    parameters: [
      { name: 'matchId', in: 'path', required: true, schema: { type: 'string' } },
      {
        name: 'Authorization',
        in: 'header',
        required: true,
        description: 'Bearer token of authenticated umpire user',
        schema: { type: 'string', example: 'Bearer <jwt>' },
      },
    ],
    responses: {
      200: { description: 'Match ended' },
      401: { description: 'Unauthorized' },
      404: { description: 'Match not found' },
    },
  },

  leaveMatchDoc: {
    tags: ['match'],
    summary: 'Leave match (viewer)',
    description:
      'Removes the viewer username reservation from the match. Requires a valid viewer token for this match.',
    parameters: [
      { name: 'matchId', in: 'path', required: true, schema: { type: 'string' } },
      {
        name: 'Authorization',
        in: 'header',
        required: true,
        description: 'Bearer viewer token for this match',
        schema: { type: 'string', example: 'Bearer <viewer-jwt>' },
      },
    ],
    responses: {
      200: { description: 'Left match' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
    },
  },
}

export default MatchDoc
