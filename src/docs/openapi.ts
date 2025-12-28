import { CONFIG } from '../config/env'

export function build(docsStore: { paths: Record<string, any> }) {
  const spec: any = {
    openapi: '3.0.0',
    info: { title: 'Match API', version: '1.0.0' },
    servers: [{ url: CONFIG.API_URL }],
    paths: {},
  }
  Object.keys(docsStore.paths).forEach((p) => {
    spec.paths[p] = docsStore.paths[p]
  })
  return spec
}
