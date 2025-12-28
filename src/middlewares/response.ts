import { Request, Response, NextFunction } from 'express'

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
  res.sendResponse = (status, payload) => {
    res.status(status).json(payload ?? null)
  }
  res.ok = (payload) => {
    res.sendResponse(200, { success: true, data: payload ?? null })
  }
  res.created = (payload) => {
    res.sendResponse(201, { success: true, data: payload ?? null })
  }
  res.unauthorized = (message) => {
    res.sendResponse(401, { success: false, message: message ?? 'unauthorized' })
  }
  res.fail = (status, message, errors) => {
    res.sendResponse(status, {
      success: false,
      message: message ?? 'error',
      errors: errors ?? null,
    })
  }
  next()
}
