import type { NextFunction, Request, Response } from 'express'
import { ZodError, type ZodSchema } from 'zod'
import { logger } from '../logger'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

type MaybeAsync = (req: Request, res: Response, next: NextFunction) => unknown

export function asyncHandler(fn: MaybeAsync) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next)
  }
}

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ApiError(400, formatZodError(result.error))
  }
  return result.data
}

export function parseQuery<T>(schema: ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query)
  if (!result.success) {
    throw new ApiError(400, formatZodError(result.error))
  }
  return result.data
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '参数'}: ${issue.message}`)
    .join('；')
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `接口不存在：${req.method} ${req.path}` })
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = error instanceof ApiError ? error.status : 500
  const message = error instanceof Error ? error.message : '服务器内部错误'
  if (status >= 500) logger.error({ err: message }, '请求处理失败')
  else logger.warn({ status, err: message }, '请求被拒绝')
  res.status(status).json({ error: message })
}

export function parseIntParam(value: unknown, name: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${name} 必须是正整数`)
  }
  return parsed
}

export function toBoolParam(value: unknown): boolean | undefined {
  if (value === undefined || value === '' ) return undefined
  return value === '1' || value === 'true'
}
