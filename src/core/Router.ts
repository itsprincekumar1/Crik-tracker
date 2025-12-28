import { Application, RequestHandler } from 'express'

type Route = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string
  middlewares: RequestHandler[]
  handler: RequestHandler
  docs: any | null
}

export class Router {
  private base: string
  private routes: Route[] = []
  private last = -1

  constructor(base = '') {
    this.base = base
  }

  private add(method: Route['method'], path: string, handlers: RequestHandler[]) {
    const flat = handlers.flat()
    const handler = flat[flat.length - 1]
    const middlewares = flat.slice(0, -1)
    this.routes.push({ method, path, middlewares, handler, docs: null })
    this.last = this.routes.length - 1
    return this
  }

  get(path: string, ...handlers: RequestHandler[]) {
    return this.add('get', path, handlers)
  }
  post(path: string, ...handlers: RequestHandler[]) {
    return this.add('post', path, handlers)
  }
  put(path: string, ...handlers: RequestHandler[]) {
    return this.add('put', path, handlers)
  }
  patch(path: string, ...handlers: RequestHandler[]) {
    return this.add('patch', path, handlers)
  }
  delete(path: string, ...handlers: RequestHandler[]) {
    return this.add('delete', path, handlers)
  }

  doc(spec: any) {
    if (this.last >= 0) this.routes[this.last].docs = spec
    return this
  }

  apply(app: Application, docsStore: { paths: Record<string, any> }, prefix = '') {
    const normalize = (p: string) => p.replace(/\/\/{2,}/g, '/').replace(/\/$/, '')
    this.routes.forEach((r) => {
      const full = normalize(`${prefix}${this.base}${r.path}`)
      if (r.middlewares.length) app[r.method](full, ...r.middlewares, r.handler)
      else app[r.method](full, r.handler)
      if (docsStore && r.docs) {
        const method = r.method.toLowerCase()
        docsStore.paths[full] = docsStore.paths[full] || {}
        docsStore.paths[full][method] = r.docs
      }
    })
  }
}
