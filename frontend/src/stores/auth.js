import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)

  // Инициализация из localStorage
  const initialize = () => {
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('user')
    
    console.log('Initializing auth store from localStorage:')
    console.log('Stored token:', storedToken ? storedToken.substring(0, 20) + '...' : 'No token')
    console.log('Stored user:', storedUser)
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
        console.log('Parsed user:', user.value)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
      }
    }
  }

  const isAuthenticated = computed(() => {
    const hasToken = !!token.value
    console.log('isAuthenticated computed:', hasToken)
    return hasToken
  })

  const isAdmin = computed(() => {
    const userIsAdmin = user.value?.role === 'admin'
    console.log('isAdmin computed:', userIsAdmin, 'User role:', user.value?.role)
    return userIsAdmin
  })

  // Регистрация
  const register = async (userData) => {
    try {
      console.log('Starting registration process...', userData)
      const response = await api.post('/auth/register', userData)
      console.log('Registration response:', response.data)
      
      if (response.data.token && response.data.user) {
        token.value = response.data.token
        user.value = response.data.user
        
        // Сохраняем в localStorage
        localStorage.setItem('authToken', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        console.log('Registration successful - stored data:')
        console.log('Token in localStorage:', localStorage.getItem('authToken')?.substring(0, 20) + '...')
        console.log('User in localStorage:', localStorage.getItem('user'))
        
        return { success: true }
      } else {
        console.error('No token or user in response')
        return { success: false, error: 'Invalid response from server' }
      }
    } catch (error) {
      console.error('Registration store error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      }
    }
  }

  // Логин
  const login = async (credentials) => {
    try {
      console.log('Starting login process...')
      const response = await api.post('/auth/login', credentials)
      console.log('Login response:', response.data)
      
      if (response.data.token && response.data.user) {
        token.value = response.data.token
        user.value = response.data.user
        
        // Сохраняем в localStorage
        localStorage.setItem('authToken', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        console.log('Login successful - stored data:')
        console.log('Token in localStorage:', localStorage.getItem('authToken')?.substring(0, 20) + '...')
        console.log('User in localStorage:', localStorage.getItem('user'))
        console.log('Store state - user:', user.value)
        console.log('Store state - isAdmin:', isAdmin.value)
        
        return { success: true }
      } else {
        console.error('No token or user in response')
        return { success: false, error: 'Invalid response from server' }
      }
    } catch (error) {
      console.error('Login store error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const logout = () => {
    console.log('Logging out...')
    token.value = null
    user.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  // Получение текущего пользователя (для использования в других хранилищах)
  const getCurrentUser = () => {
    return user.value;
  };

  // Инициализируем при создании хранилища
  initialize()

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    initialize,
    getCurrentUser
  }
})