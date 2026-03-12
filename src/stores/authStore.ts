import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { authService } from '@/services/authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  clearError: () => void
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  setAuth: (user: User, token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ loading: true, error: null })
        try {
          const response = await authService.login(credentials)
          const { user, token } = response.data || response
          
          // 存储token到localStorage
          localStorage.setItem('auth_token', token)
          
          set({ 
            user, 
            isAuthenticated: true, 
            loading: false,
            error: null 
          })
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.response?.data?.message || error.response?.data?.error || '登录失败' 
          })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ loading: true, error: null })
        try {
          await authService.register(data)
          set({ loading: false, error: null })
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.response?.data?.message || error.response?.data?.error || '注册失败' 
          })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token')
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        })
      },

      clearError: () => {
        set({ error: null })
      },

      refreshUser: async () => {
        let token = localStorage.getItem('auth_token')
        if (!token) {
          const forumToken = localStorage.getItem('jwt_token')
          if (forumToken) {
            localStorage.setItem('auth_token', forumToken)
            token = forumToken
          }
        }
        if (!token) {
          set({ user: null, isAuthenticated: false })
          return
        }

        try {
          const response = await authService.getCurrentUser()
          const user = (response as any)?.data ?? response
          set({ 
            user, 
            isAuthenticated: true 
          })
        } catch (error) {
          // Token无效，清除认证状态
          localStorage.removeItem('auth_token')
          set({ 
            user: null, 
            isAuthenticated: false 
          })
        }
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },

      setAuth: (user: User, token: string) => {
        // 存储token到localStorage
        localStorage.setItem('auth_token', token)
        
        set({ 
          user, 
          isAuthenticated: true,
          error: null 
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
