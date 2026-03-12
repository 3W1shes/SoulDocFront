import { create } from 'zustand'
import type { 
  Document, 
  DocumentTreeNode, 
  Space, 
  CreateDocumentRequest,
  UpdateDocumentRequest 
} from '@/types'
import { documentService } from '@/services/documentService'

interface DocumentState {
  // 当前文档
  currentDocument: Document | null
  currentSpace: Space | null
  documentTree: DocumentTreeNode[]
  
  // 编辑状态
  isEditing: boolean
  hasUnsavedChanges: boolean
  editingContent: string
  
  // 加载状态
  loading: boolean
  saving: boolean
  error: string | null
  
  // Actions
  setCurrentDocument: (doc: Document | null) => void
  setCurrentSpace: (space: Space | null) => void
  setDocumentTree: (tree: DocumentTreeNode[]) => void
  loadDocumentTree: (spaceSlug: string) => Promise<void>
  loadDocument: (spaceSlug: string, docSlug: string) => Promise<void>
  loadDocumentById: (docId: string) => Promise<void>
  createDocument: (spaceSlug: string, data: CreateDocumentRequest) => Promise<Document>
  updateDocument: (spaceSlug: string, docSlug: string, data: UpdateDocumentRequest) => Promise<void>
  updateDocumentById: (docId: string, data: UpdateDocumentRequest) => Promise<void>
  deleteDocument: (spaceSlug: string, docSlug: string) => Promise<void>
  deleteDocumentById: (docId: string, spaceSlug?: string) => Promise<void>
  
  // 编辑相关
  startEditing: () => void
  stopEditing: () => void
  updateEditingContent: (content: string) => void
  saveDocument: () => Promise<void>
  
  // 工具方法
  clearError: () => void
  reset: () => void
}

export const useDocStore = create<DocumentState>((set, get) => ({
  // 初始状态
  currentDocument: null,
  currentSpace: null,
  documentTree: [],
  isEditing: false,
  hasUnsavedChanges: false,
  editingContent: '',
  loading: false,
  saving: false,
  error: null,

  // Actions
  setCurrentDocument: (doc) => {
    set({ 
      currentDocument: doc,
      editingContent: doc?.content || '',
      hasUnsavedChanges: false
    })
  },

  setCurrentSpace: (space) => {
    set({ currentSpace: space })
  },

  setDocumentTree: (tree) => {
    set({ documentTree: tree })
  },

  loadDocumentTree: async (spaceSlug: string) => {
    set({ loading: true, error: null })
    try {
      const response = await documentService.getDocumentTree(spaceSlug)
      set({ 
        documentTree: response?.data || [],
        loading: false 
      })
    } catch (error: any) {
      set({ 
        loading: false,
        error: error.response?.data?.message || '加载文档树失败'
      })
    }
  },

  loadDocument: async (spaceSlug: string, docSlug: string) => {
    set({ loading: true, error: null })
    try {
      const response = await documentService.getDocument(spaceSlug, docSlug)
      set({ 
        currentDocument: response?.data,
        editingContent: response?.data?.content || '',
        hasUnsavedChanges: false,
        loading: false
      })
    } catch (error: any) {
      set({ 
        loading: false,
        error: error.response?.data?.message || '加载文档失败'
      })
    }
  },

  loadDocumentById: async (docId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await documentService.getDocumentById(docId)
      set({ 
        currentDocument: response?.data,
        editingContent: response?.data?.content || '',
        hasUnsavedChanges: false,
        loading: false
      })
    } catch (error: any) {
      set({ 
        loading: false,
        error: error.response?.data?.message || '加载文档失败'
      })
    }
  },

  createDocument: async (spaceSlug: string, data: CreateDocumentRequest) => {
    set({ saving: true, error: null })
    try {
      const response = await documentService.createDocument(spaceSlug, data)
      
      // 重新加载文档树
      await get().loadDocumentTree(spaceSlug)
      
      set({ saving: false })
      return response?.data
    } catch (error: any) {
      set({ 
        saving: false,
        error: error.response?.data?.message || '创建文档失败'
      })
      throw error
    }
  },

  updateDocument: async (spaceSlug: string, docSlug: string, data: UpdateDocumentRequest) => {
    set({ saving: true, error: null })
    try {
      await documentService.updateDocument(spaceSlug, docSlug, data)
      
      // 更新当前文档
      const { currentDocument } = get()
      if (currentDocument) {
        set({ 
          currentDocument: {
            ...currentDocument,
            ...data,
            updated_at: new Date().toISOString()
          },
          hasUnsavedChanges: false,
          saving: false
        })
      }
    } catch (error: any) {
      set({ 
        saving: false,
        error: error.response?.data?.message || '更新文档失败'
      })
      throw error
    }
  },

  updateDocumentById: async (docId: string, data: UpdateDocumentRequest) => {
    set({ saving: true, error: null })
    try {
      await documentService.updateDocumentById(docId, data)
      
      // 更新当前文档
      const { currentDocument } = get()
      if (currentDocument && currentDocument.id === docId) {
        set({ 
          currentDocument: {
            ...currentDocument,
            ...data,
            updated_at: new Date().toISOString()
          },
          hasUnsavedChanges: false,
          saving: false
        })
      }
    } catch (error: any) {
      set({ 
        saving: false,
        error: error.response?.data?.message || '更新文档失败'
      })
      throw error
    }
  },

  deleteDocument: async (spaceSlug: string, docSlug: string) => {
    set({ loading: true, error: null })
    try {
      await documentService.deleteDocument(spaceSlug, docSlug)
      
      // 重新加载文档树
      await get().loadDocumentTree(spaceSlug)
      
      // 如果删除的是当前文档，清空当前文档
      const { currentDocument } = get()
      if (currentDocument?.slug === docSlug) {
        set({ currentDocument: null, editingContent: '' })
      }
      
      set({ loading: false })
    } catch (error: any) {
      set({ 
        loading: false,
        error: error.response?.data?.message || '删除文档失败'
      })
      throw error
    }
  },

  deleteDocumentById: async (docId: string, spaceSlug?: string) => {
    set({ loading: true, error: null })
    try {
      await documentService.deleteDocumentById(docId)

      // 删除后立即刷新当前空间文档树，确保前端显示最新列表
      if (spaceSlug) {
        await get().loadDocumentTree(spaceSlug)
      }
      
      // 如果删除的是当前文档，清空当前文档
      const { currentDocument } = get()
      if (currentDocument?.id === docId) {
        set({ currentDocument: null, editingContent: '' })
      }
      
      set({ loading: false })
    } catch (error: any) {
      set({ 
        loading: false,
        error: error.response?.data?.message || '删除文档失败'
      })
      throw error
    }
  },

  startEditing: () => {
    const { currentDocument } = get()
    set({ 
      isEditing: true,
      editingContent: currentDocument?.content || ''
    })
  },

  stopEditing: () => {
    set({ 
      isEditing: false,
      hasUnsavedChanges: false
    })
  },

  updateEditingContent: (content: string) => {
    const { currentDocument } = get()
    set({ 
      editingContent: content,
      hasUnsavedChanges: content !== (currentDocument?.content || '')
    })
  },

  saveDocument: async () => {
    const { 
      currentDocument, 
      currentSpace, 
      editingContent, 
      hasUnsavedChanges 
    } = get()
    
    if (!currentDocument || !currentSpace || !hasUnsavedChanges) {
      return
    }

    try {
      await get().updateDocument(
        currentSpace.slug, 
        currentDocument.slug, 
        { content: editingContent }
      )
    } catch (error) {
      // 错误已在updateDocument中处理
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      currentDocument: null,
      currentSpace: null,
      documentTree: [],
      isEditing: false,
      hasUnsavedChanges: false,
      editingContent: '',
      loading: false,
      saving: false,
      error: null
    })
  }
}))
