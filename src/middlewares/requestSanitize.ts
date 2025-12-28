import { Request, Response, NextFunction } from 'express'

function sanitizeValue(value: any): any {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') {
    const out: any = {}
    Object.keys(value).forEach((k) => {
      if (k.startsWith('$') || k.includes('.')) return
      out[k] = sanitizeValue(value[k])
    })
    return out
  }
  return value
}

export function requestSanitize(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeValue(req.body)
  if (req.query) req.query = sanitizeValue(req.query)
  next()
}
