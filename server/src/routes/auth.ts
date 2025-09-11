import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

const router = Router()

// Login with username
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() })
    
    if (!user) {
      // For demo purposes, create default users if none exists
      if (username === 'admin' && password === 'password123') {
        const newUser = new User({
          name: 'Administrator',
          username: 'admin',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin'
        })
        await newUser.save()
        
        const token = jwt.sign(
          { id: newUser._id, username: newUser.username, role: newUser.role },
          process.env.JWT_SECRET || 'secret-key',
          { expiresIn: '7d' }
        )

        return res.json({
          token,
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        })
      }
      
      // Create default employee user
      if (username === 'employee' && password === 'emp123') {
        const newUser = new User({
          name: 'Employee User',
          username: 'employee',
          email: 'employee@example.com',
          password: 'emp123',
          role: 'employee'
        })
        await newUser.save()
        
        const token = jwt.sign(
          { id: newUser._id, username: newUser.username, role: newUser.role },
          process.env.JWT_SECRET || 'secret-key',
          { expiresIn: '7d' }
        )

        return res.json({
          token,
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        })
      }
      
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, role = 'employee' } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] 
    })
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Create new user
    const user = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role
    })

    await user.save()

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ valid: false })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    res.json({ valid: true, decoded })
  } catch (error) {
    res.status(401).json({ valid: false })
  }
})

export default router