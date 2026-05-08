import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();

// Vaqtinchalik kodlar: code -> { token, user, expiresAt }
// Har bir kod faqat 1 marta ishlatiladi va 5 daqiqa amal qiladi
const pendingAuthCodes = new Map();

// Muddati o'tgan kodlarni tozalash (har 10 daqiqada)
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingAuthCodes.entries()) {
    if (data.expiresAt < now) pendingAuthCodes.delete(code);
  }
}, 10 * 60 * 1000);

// Check if Google OAuth is configured
const isGoogleOAuthEnabled = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleOAuthEnabled) {
  // Google OAuth - Initiate
  router.get('/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false
    })
  );

  // Google OAuth - Callback
  router.get('/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    }),
    (req, res) => {
      try {
        const token = jwt.sign(
          { userId: req.user.id, id: req.user.id, email: req.user.email, role: req.user.role || 'user' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const userData = {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.full_name,
          role: req.user.role || 'user',
          oauth_provider: req.user.oauth_provider || 'google'
        };

        // Bir martalik, qisqa muddatli kod yaratish (URL da token o'rniga)
        const code = crypto.randomBytes(32).toString('hex');
        pendingAuthCodes.set(code, {
          token,
          user: userData,
          expiresAt: Date.now() + 5 * 60 * 1000 // 5 daqiqa
        });

        // Faqat kod URL ga kiritiladi — token emas
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${code}`);
      } catch (error) {
        console.error('Error creating token:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=token_creation_failed`);
      }
    }
  );
} else {
  router.get('/google', (req, res) => {
    res.status(503).json({
      error: 'Google OAuth is not configured on this server',
      message: 'Please use email/password authentication instead'
    });
  });

  router.get('/google/callback', (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_not_configured`);
  });
}

// Kod almashtirish endpoint: kod → token (POST, response body orqali)
router.post('/exchange', (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const data = pendingAuthCodes.get(code);

  if (!data) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }

  if (data.expiresAt < Date.now()) {
    pendingAuthCodes.delete(code);
    return res.status(401).json({ error: 'Invalid or expired code' });
  }

  // Bir martalik — ishlatilgandan keyin o'chir
  pendingAuthCodes.delete(code);

  res.json({ token: data.token, user: data.user });
});

export default router;

