import { useInfiniteQuery } from '@tanstack/react-query'
import { api, type QueryValue } from '../api/client'
import type { PhotoListResponse } from '../api/types'
import type { PhotoFilters } from '../api/hooks'

const PAGE_SIZE = 36

/** 拍摄日志流：按页加载照片，供瀑布流无限滚动使用 */
export function useInfinitePhotos(filters: PhotoFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['photos', 'stream', filters] as const,
    queryFn: ({ pageParam }) =>
      api.get<PhotoListResponse>('/photos', {
        ...(filters as Record<string, QueryValue>),
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.items.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE,
    staleTime: 20_000,
  })
}

export const PHOTO_STREAM_PAGE_SIZE = PAGE_SIZE
