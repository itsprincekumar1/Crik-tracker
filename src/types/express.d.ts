import 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface Request {
    clientIp?: string
    user?: any // Using any to avoid circular dependency issues for now, or import IUser if safe
  }
  interface Response {
    sendResponse: (status: number, payload: unknown) => void
    ok: (payload?: unknown) => void
    created: (payload?: unknown) => void
    unauthorized: (message?: string) => void
    fail: (status: number, message?: string, errors?: unknown) => void
  }
}
