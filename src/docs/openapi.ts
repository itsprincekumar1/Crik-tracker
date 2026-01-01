import { CONFIG } from '../config/env'

export function build(docsStore: { paths: Record<string, any> }) {
  const spec: any = {
    openapi: '3.0.0',
    info: { title: 'Match API', version: '1.0.0' },
    servers: [
      { url: 'https://crik-tracker.onrender.com', description: 'Production Server' },
      { url: 'http://localhost:3000', description: 'Local Server' },
    ],
    paths: {},
    components: {
      securitySchemes: {
        userAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Standard User Token (Login Token). Required for Umpire actions (Create/End match, Update score).',
        },
        matchAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Match/Viewer Token. Obtained after joining a match. Also accepts User Token.',
        },
      },
    },
  }
  Object.keys(docsStore.paths).forEach((p) => {
    spec.paths[p] = docsStore.paths[p]
  })
  return spec
}
