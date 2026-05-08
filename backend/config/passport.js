import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './database.js';
import bcrypt from 'bcrypt';

// Google OAuth Strategy - Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Check if user exists
        const userCheck = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (userCheck.rows.length > 0) {
          // User exists, return user
          return done(null, userCheck.rows[0]);
        } else {
          // Create new user
          const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
          const newUser = await pool.query(
            'INSERT INTO users (full_name, email, password, currency) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, randomPassword, 'USD']
          );
          
          // Create default categories for new user
          const defaultCategories = [
            { name: 'Oylik',        type: 'income',  icon: 'briefcase',     color: '#10B981' },
            { name: 'Biznes',       type: 'income',  icon: 'trending-up',   color: '#3B82F6' },
            { name: 'Investitsiya', type: 'income',  icon: 'bar-chart-2',   color: '#8B5CF6' },
            { name: 'Boshqa',       type: 'income',  icon: 'plus-circle',   color: '#64748B' },
            { name: 'Oziq-ovqat',  type: 'expense', icon: 'shopping-cart',  color: '#EF4444' },
            { name: 'Zapravka',    type: 'expense', icon: 'truck',           color: '#D97706' },
            { name: 'Sport',       type: 'expense', icon: 'activity',        color: '#059669' },
            { name: 'Kurs',        type: 'expense', icon: 'book-open',       color: '#3B82F6' },
            { name: 'Onam',        type: 'expense', icon: 'users',           color: '#7C3AED' },
            { name: 'Kiyim',       type: 'expense', icon: 'shopping-bag',    color: '#EC4899' },
            { name: 'Dam olish',   type: 'expense', icon: 'smile',           color: '#F43F5E' },
            { name: 'Boshqa',      type: 'expense', icon: 'more-horizontal', color: '#94A3B8' },
          ];

          for (const cat of defaultCategories) {
            await pool.query(
              'INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5)',
              [newUser.rows[0].id, cat.name, cat.type, cat.icon, cat.color]
            );
          }
          
          return done(null, newUser.rows[0]);
        }
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  ));
  console.log('✅ Google OAuth Strategy initialized');
} else {
  console.log('⚠️  Google OAuth disabled - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not configured');
}

export default passport;

