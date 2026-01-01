const SocketDoc = {
  emitDoc: {
    tags: ['socket'],
    summary: 'Emit Socket.IO event to a match room (Umpire only)',
    description:
      'Testing endpoint to emit Socket.IO events to a match room. Useful with Swagger to simulate real-time updates. For `score_updated`, server will also persist provided score fields before emission. For `new_comment`, server will append a comment and broadcast it.',
    security: [{ userAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              matchId: { type: 'string' },
              event: {
                type: 'string',
                enum: ['score_updated', 'new_comment', 'joined_as_umpire', 'match_ended', 'error'],
              },
              data: { type: 'object', additionalProperties: true },
            },
            required: ['matchId', 'event'],
          },
          examples: {
            scoreUpdate: {
              summary: 'Update score and broadcast',
              value: {
                matchId: 'abc123',
                event: 'score_updated',
                data: { score: { runs: 57, wickets: 2, overs: 7.4 } },
              },
            },
            comment: {
              summary: 'Broadcast new comment',
              value: {
                matchId: 'abc123',
                event: 'new_comment',
                data: { user: 'Swagger', message: 'What a shot!' },
              },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'Event emitted' }, 401: { description: 'Unauthorized' } },
  },
}

export default SocketDoc
