const AuthDoc = {
  registerDoc: {
    tags: ['auth'],
    summary: 'Register umpire user',
    description: 'Creates a user account for an umpire. Returns basic user details.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 6 },
              name: { type: 'string' },
            },
            required: ['email', 'password', 'name'],
          },
          example: { email: 'u1@example.com', password: 'secret123', name: 'Umpire One' },
        },
      },
    },
    responses: { 201: { description: 'created' }, 409: { description: 'Email exists' } },
  },
  loginDoc: {
    tags: ['auth'],
    summary: 'Login umpire user',
    description: 'Authenticates umpire and returns a JWT token.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 6 },
            },
            required: ['email', 'password'],
          },
          example: { email: 'u1@example.com', password: 'secret123' },
        },
      },
    },
    responses: { 200: { description: 'ok' }, 401: { description: 'invalid credentials' } },
  },
}

export default AuthDoc
