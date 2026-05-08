import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { convertCurrency } from '../utils/currency.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/strategy — faol strategiyani olish (elementlar bilan)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const strategyResult = await pool.query(
      `SELECT * FROM financial_strategies WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (strategyResult.rows.length === 0) {
      return res.json({ strategy: null, items: [] });
    }

    const strategy = strategyResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT si.id, si.category_id, si.target_percentage,
              c.name AS category_name, c.color, c.icon
       FROM strategy_items si
       JOIN categories c ON c.id = si.category_id
       WHERE si.strategy_id = $1
       ORDER BY si.target_percentage DESC`,
      [strategy.id]
    );

    res.json({ strategy, items: itemsResult.rows });
  } catch (err) {
    console.error('Strategy GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/strategy — yaratish yoki yangilash
router.post('/',
  [
    body('name').optional().trim().isLength({ max: 100 }),
    body('items').isArray({ min: 1 }).withMessage('Kamida 1 ta element kerak'),
    body('items.*.category_id').isInt({ min: 1 }),
    body('items.*.target_percentage').isFloat({ min: 0.1, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name = 'Mening strategiyam', items } = req.body;
    const userId = req.user.id;

    // Foizlar yig'indisi 100 bo'lishi kerak (±0.5 tolerans)
    const total = items.reduce((sum, i) => sum + parseFloat(i.target_percentage), 0);
    if (Math.abs(total - 100) > 0.5) {
      return res.status(400).json({ error: `Foizlar yig'indisi 100% bo'lishi kerak. Hozir: ${total.toFixed(1)}%` });
    }

    // Kategoriyalar foydalanuvchiga tegishli ekanligini tekshirish
    const catIds = items.map(i => i.category_id);
    const catCheck = await pool.query(
      `SELECT id FROM categories WHERE id = ANY($1) AND user_id = $2`,
      [catIds, userId]
    );
    if (catCheck.rows.length !== catIds.length) {
      return res.status(400).json({ error: 'Noto\'g\'ri kategoriya' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Eski strategiyani o'chirish
      await client.query(
        `DELETE FROM financial_strategies WHERE user_id = $1`,
        [userId]
      );

      // Yangi strategiya yaratish
      const stratResult = await client.query(
        `INSERT INTO financial_strategies (user_id, name) VALUES ($1, $2) RETURNING *`,
        [userId, name]
      );
      const strategy = stratResult.rows[0];

      // Elementlarni qo'shish
      for (const item of items) {
        await client.query(
          `INSERT INTO strategy_items (strategy_id, category_id, target_percentage)
           VALUES ($1, $2, $3)`,
          [strategy.id, item.category_id, item.target_percentage]
        );
      }

      await client.query('COMMIT');

      const itemsResult = await pool.query(
        `SELECT si.id, si.category_id, si.target_percentage,
                c.name AS category_name, c.color, c.icon
         FROM strategy_items si
         JOIN categories c ON c.id = si.category_id
         WHERE si.strategy_id = $1
         ORDER BY si.target_percentage DESC`,
        [strategy.id]
      );

      res.json({ strategy, items: itemsResult.rows });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Strategy POST error:', err);
      res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  }
);

// DELETE /api/strategy — strategiyani o'chirish
router.delete('/', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM financial_strategies WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Strategy DELETE error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/strategy/report?month=5&year=2026 — oylik hisobot
router.get('/report', async (req, res) => {
  try {
    const userId = req.user.id;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Strategiyani olish
    const stratResult = await pool.query(
      `SELECT fs.*, si.id AS item_id, si.category_id, si.target_percentage,
              c.name AS category_name, c.color, c.icon
       FROM financial_strategies fs
       JOIN strategy_items si ON si.strategy_id = fs.id
       JOIN categories c ON c.id = si.category_id
       WHERE fs.user_id = $1 AND fs.is_active = true
       ORDER BY si.target_percentage DESC`,
      [userId]
    );

    if (stratResult.rows.length === 0) {
      return res.json({ hasStrategy: false });
    }

    const userCurrency = (
      await pool.query('SELECT currency FROM users WHERE id = $1', [userId])
    ).rows[0]?.currency || 'USD';

    // O'sha oyning daromadi (display valyutasida)
    const incomeResult = await pool.query(
      `SELECT amount, currency FROM transactions
       WHERE user_id = $1 AND type = 'income'
       AND EXTRACT(MONTH FROM transaction_date) = $2
       AND EXTRACT(YEAR FROM transaction_date) = $3`,
      [userId, month, year]
    );

    let totalIncome = 0;
    for (const t of incomeResult.rows) {
      totalIncome += await convertCurrency(parseFloat(t.amount), t.currency, userCurrency);
    }

    // Har bir kategoriya uchun haqiqiy xarajat
    const strategy = stratResult.rows[0];
    const items = stratResult.rows;

    const reportItems = await Promise.all(items.map(async (item) => {
      const expResult = await pool.query(
        `SELECT amount, currency FROM transactions
         WHERE user_id = $1 AND category_id = $2 AND type = 'expense'
         AND EXTRACT(MONTH FROM transaction_date) = $3
         AND EXTRACT(YEAR FROM transaction_date) = $4`,
        [userId, item.category_id, month, year]
      );

      let actualAmount = 0;
      for (const t of expResult.rows) {
        actualAmount += await convertCurrency(parseFloat(t.amount), t.currency, userCurrency);
      }

      const targetAmount = totalIncome > 0 ? (totalIncome * parseFloat(item.target_percentage)) / 100 : 0;
      const actualPercentage = totalIncome > 0 ? (actualAmount / totalIncome) * 100 : 0;
      const diff = actualAmount - targetAmount;

      // Status: good (<=100% of target), warning (100-120%), danger (>120%)
      let status = 'good';
      if (targetAmount > 0) {
        const ratio = actualAmount / targetAmount;
        if (ratio > 1.2) status = 'danger';
        else if (ratio > 1.0) status = 'warning';
      } else if (actualAmount > 0) {
        status = 'warning';
      }

      return {
        category_id: item.category_id,
        category_name: item.category_name,
        color: item.color,
        icon: item.icon,
        target_percentage: parseFloat(item.target_percentage),
        target_amount: targetAmount,
        actual_amount: actualAmount,
        actual_percentage: actualPercentage,
        diff,             // musbat = oshdi, manfiy = tejaldi
        status,
      };
    }));

    // Strategiyadagi kategoriyalarga kirmagan xarajatlar
    const coveredCatIds = items.map(i => i.category_id);
    const otherResult = await pool.query(
      `SELECT SUM(amount) AS total, currency
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       AND (category_id IS NULL OR category_id != ALL($2))
       AND EXTRACT(MONTH FROM transaction_date) = $3
       AND EXTRACT(YEAR FROM transaction_date) = $4
       GROUP BY currency`,
      [userId, coveredCatIds, month, year]
    );

    let otherAmount = 0;
    for (const r of otherResult.rows) {
      otherAmount += await convertCurrency(parseFloat(r.total), r.currency, userCurrency);
    }

    // Umumiy ko'rsatkichlar
    const totalTargetSpend = reportItems.reduce((s, i) => s + i.target_amount, 0);
    const totalActualSpend = reportItems.reduce((s, i) => s + i.actual_amount, 0) + otherAmount;
    const overallCompliance = reportItems.filter(i => i.status === 'good').length;

    res.json({
      hasStrategy: true,
      strategy: { id: strategy.id, name: strategy.name },
      month, year,
      totalIncome,
      totalActualSpend,
      totalTargetSpend,
      otherAmount,
      currency: userCurrency,
      overallCompliance,
      totalItems: reportItems.length,
      items: reportItems,
    });
  } catch (err) {
    console.error('Strategy report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
