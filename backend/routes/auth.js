import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';

const router = express.Router();

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('full_name').trim().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, full_name } = req.body;

      // Check if user exists
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
        [email, hashedPassword, full_name]
      );

      const user = result.rows[0];

      // Create default categories for new user
      const defaultCategories = [
        // === DAROMAD ===
        { name: 'Oylik',        type: 'income',  icon: 'briefcase',    color: '#10B981' },
        { name: 'Biznes',       type: 'income',  icon: 'trending-up',  color: '#3B82F6' },
        { name: 'Investitsiya', type: 'income',  icon: 'bar-chart-2',  color: '#8B5CF6' },
        { name: 'Boshqa',       type: 'income',  icon: 'plus-circle',  color: '#64748B' },

        // === XARAJAT ===
        { name: 'Oziq-ovqat',  type: 'expense', icon: 'shopping-cart', color: '#EF4444' },
        { name: 'Zapravka',    type: 'expense', icon: 'truck',          color: '#D97706' },
        { name: 'Sport',       type: 'expense', icon: 'activity',       color: '#059669' },
        { name: 'Kurs',        type: 'expense', icon: 'book-open',      color: '#3B82F6' },
        { name: 'Onam',        type: 'expense', icon: 'users',          color: '#7C3AED' },
        { name: 'Kiyim',       type: 'expense', icon: 'shopping-bag',   color: '#EC4899' },
        { name: 'Dam olish',   type: 'expense', icon: 'smile',          color: '#F43F5E' },
        { name: 'Boshqa',      type: 'expense', icon: 'more-horizontal',color: '#94A3B8' },
      ];

      for (const cat of defaultCategories) {
        await pool.query(
          'INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5)',
          [user.id, cat.name, cat.type, cat.icon, cat.color]
        );
      }

      // Generate JWT with userId for consistency
      const token = jwt.sign(
        { userId: user.id, id: user.id, email: user.email, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: 'user'
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const result = await pool.query('SELECT id, email, password, full_name, role FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT with userId and role for middleware
      const token = jwt.sign(
        { userId: user.id, id: user.id, email: user.email, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role || 'user'
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;

