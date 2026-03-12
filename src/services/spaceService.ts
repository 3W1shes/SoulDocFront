import { request } from './api'
import type { 
  Space,
  CreateSpaceRequest,
  ApiResponse,
  SpaceListResponse
} from '@/types'
import type { AxiosRequestConfig } from 'axios'

export interface SpaceQuery {
  page?: number
  limit?: number
  search?: string
  is_public?: boolean
  sort_by?: 'created_at' | 'updated_at' | 'name'
  sort_order?: 'asc' | 'desc'
}

export interface SpaceStats {
  total_documents: number
  total_members: number
  total_views: number
  last_activity: string
}

export const spaceService = {
  // 获取空间列表
  getSpaces: (query?: SpaceQuery): Promise<ApiResponse<SpaceListResponse>> => {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.search) params.append('search', query.search)
    if (query?.is_public !== undefined) params.append('is_public', query.is_public.toString())
    if (query?.sort_by) params.append('sort_by', query.sort_by)
    if (query?.sort_order) params.append('sort_order', query.sort_order)
    
    const queryString = params.toString()
    return request.get(`/docs/spaces${queryString ? `?${queryString}` : ''}`)
  },

  // 获取空间详情
  getSpace: (slug: string): Promise<ApiResponse<Space>> =>
    request.get(`/docs/spaces/${slug}`),

  // 创建空间
  createSpace: (data: CreateSpaceRequest): Promise<ApiResponse<Space>> =>
    request.post('/docs/spaces', data),

  // 更新空间
  updateSpace: (slug: string, data: Partial<CreateSpaceRequest>): Promise<ApiResponse<Space>> =>
    request.put(`/docs/spaces/${slug}`, data),

  // 删除空间
  deleteSpace: (slug: string): Promise<ApiResponse<null>> =>
    request.delete(`/docs/spaces/${slug}`),

  // 获取空间统计
  getSpaceStats: (slug: string, config?: AxiosRequestConfig & { silent?: boolean }): Promise<ApiResponse<SpaceStats>> =>
    request.get(`/docs/spaces/${slug}/stats`, config),

  // 检查空间slug是否可用
  checkSlugAvailability: (slug: string): Promise<ApiResponse<{ available: boolean }>> =>
    request.get(`/docs/spaces/check-slug?slug=${slug}`),
}
