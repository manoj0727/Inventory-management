import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'employee' | 'manager'
    avatar?: string
  }
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  async register(data: {
    name: string
    email: string
    password: string
    role?: string
  }): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth-storage')
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.valid
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()