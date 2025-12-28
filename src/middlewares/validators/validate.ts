import { Request, Response, NextFunction } from 'express'
import { ZodError, ZodTypeAny } from 'zod'

type Parts = Partial<{ body: ZodTypeAny; query: ZodTypeAny; params: ZodTypeAny }>

export function validate(parts: Parts) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (parts.body) req.body = parts.body.parse(req.body)
      if (parts.query) req.query = parts.query.parse(req.query) as any
      if (parts.params) req.params = parts.params.parse(req.params) as any
      return next()
    } catch (e) {
      if (e instanceof ZodError) return res.fail(400, 'validation_error', e.flatten())
      return res.fail(400, 'invalid_request')
    }
  }
}
