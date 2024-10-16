import type { NextApiResponse } from 'next'
import {LRUCache} from 'lru-cache'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: (res: Response, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit
        res.headers.set('X-RateLimit-Limit', limit as unknown as string)
        res.headers.set(
          'X-RateLimit-Remaining',
          isRateLimited ? "0" : (limit - currentUsage) as unknown as string
        )

        return isRateLimited ? reject() : resolve()
      }),
  }
}