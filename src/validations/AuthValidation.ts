import { z } from 'zod'
import { validate } from '../middlewares/validators/validate'

export function registerValidation() {
  return validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    }),
  })
}

export function loginValidation() {
  return validate({
    body: z.object({ email: z.string().email(), password: z.string().min(6) }),
  })
}
