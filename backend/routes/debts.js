import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { convertCurrency, getExchangeRate } from '../utils/currency.js';

const router = express.Router();
router.use(authMiddleware);

// ── GET /api/debts — barcha qarzlar ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    let where = 'WHERE d.user_id = $1';
    const params = [userId];

    if (status) { params.push(status); where += ` AND d.status = $${params.length}`; }
    if (type)   { params.push(type);   where += ` AND d.type = $${params.length}`; }

    const result = await pool.query(
      `SELECT d.*,
        COALESCE(
          (SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id), 0
        ) AS total_paid
       FROM debts d
       ${where}
       ORDER BY d.status ASC, d.date DESC`,
      params
    );

    // Summary — batch fetch rates once (avoids N+1)
    const userCurrency = (await pool.query('SELECT currency FROM users WHERE id=$1', [userId])).rows[0]?.currency || 'UZS';
    const uniqueCurs = [...new Set(result.rows.map(d => d.currency))].filter(c => c !== userCurrency);
    const rateMap = { [userCurrency]: 1 };
    await Promise.all(uniqueCurs.map(async (c) => {
      try { rateMap[c] = await getExchangeRate(c, userCurrency); }
      catch { rateMap[c] = 1; }
    }));

    let totalLent = 0, totalBorrowed = 0, totalLentPaid = 0, totalBorrowedPaid = 0;
    for (const d of result.rows) {
      const rate = rateMap[d.currency] ?? 1;
      const amt  = parseFloat(d.amount) * rate;
      const paid = parseFloat(d.total_paid) * rate;
      if (d.type === 'lent') { totalLent += amt;     totalLentPaid += paid; }
      else                   { totalBorrowed += amt; totalBorrowedPaid += paid; }
    }

    res.json({
      debts: result.rows,
      summary: {
        currency: userCurrency,
        totalLent,
        totalBorrowed,
        remainingLent:     totalLent     - totalLentPaid,
        remainingBorrowed: totalBorrowed - totalBorrowedPaid,
        netBalance:        (totalLent - totalLentPaid) - (totalBorrowed - totalBorrowedPaid),
      }
    });
  } catch (err) {
    console.error('Debts GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/debts/:id — bitta qarz (to'lovlar bilan) ───────────────────────
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const debtRes = await pool.query(
      'SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, userId]
    );
    if (!debtRes.rows.length) return res.status(404).json({ error: 'Not found' });

    const paymentsRes = await pool.query(
      'SELECT * FROM debt_payments WHERE debt_id=$1 ORDER BY date DESC', [id]
    );

    res.json({ debt: debtRes.rows[0], payments: paymentsRes.rows });
  } catch (err) {
    console.error('Debt GET/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/debts — yangi qarz ────────────────────────────────────────────
router.post('/',
  [
    body('type').isIn(['lent', 'borrowed']),
    body('person_name').trim().isLength({ min: 1, max: 100 }),
    body('amount').isFloat({ min: 0.01 }),
    body('currency').isIn(['UZS', 'USD', 'RUB', 'JPY', 'CNY', 'EUR']),
    body('date').isDate(),
    body('due_date').optional({ nullable: true }).isDate(),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { type, person_name, amount, currency, date, due_date, description } = req.body;
    const userId = req.user.id;

    try {
      const result = await pool.query(
        `INSERT INTO debts (user_id, type, person_name, contact_name, amount, currency, date, due_date, description)
         VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [userId, type, person_name, amount, currency, date, due_date || null, description || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Debt POST error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── PUT /api/debts/:id — tahrirlash ─────────────────────────────────────────
router.put('/:id',
  [
    body('person_name').optional().trim().isLength({ min: 1, max: 100 }),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('currency').optional().isIn(['UZS', 'USD', 'RUB', 'JPY', 'CNY', 'EUR']),
    body('date').optional().isDate(),
    body('due_date').optional({ nullable: true }).isDate(),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status').optional().isIn(['active', 'settled']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.user.id;
    const { id } = req.params;
    const { person_name, amount, currency, date, due_date, description, status } = req.body;

    try {
      const existing = await pool.query('SELECT * FROM debts WHERE id=$1 AND user_id=$2', [id, userId]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });

      const d = existing.rows[0];
      const result = await pool.query(
        `UPDATE debts SET
          person_name=$1, amount=$2, currency=$3, date=$4,
          due_date=$5, description=$6, status=$7, updated_at=NOW()
         WHERE id=$8 AND user_id=$9 RETURNING *`,
        [
          person_name  ?? d.person_name,
          amount       ?? d.amount,
          currency     ?? d.currency,
          date         ?? d.date,
          due_date !== undefined ? due_date : d.due_date,
          description  !== undefined ? description : d.description,
          status       ?? d.status,
          id, userId
        ]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Debt PUT error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ── DELETE /api/debts/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM debts WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Debt DELETE error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/debts/:id/payments — to'lov qo'shish ─────────────────────────
router.post('/:id/payments',
  [
    body('amount').isFloat({ min: 0.01 }),
    body('currency').isIn(['UZS', 'USD', 'RUB', 'JPY', 'CNY', 'EUR']),
    body('date').isDate(),
    body('note').optional().trim().isLength({ max: 300 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = req.user.id;
    const { id } = req.params;
    const { amount, currency, date, note } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const debtRes = await client.query(
        'SELECT * FROM debts WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, userId]
      );
      if (!debtRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Not found' });
      }
      const debt = debtRes.rows[0];

      // To'lovni qo'shish
      await client.query(
        `INSERT INTO debt_payments (debt_id, amount, currency, date, note)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, amount, currency, date, note || null]
      );

      // paid_amount yangilash (bir xil valyutada hisob)
      const convertedPayment = await convertCurrency(parseFloat(amount), currency, debt.currency);
      const newPaid = parseFloat(debt.paid_amount) + convertedPayment;
      const newStatus = newPaid >= parseFloat(debt.amount) ? 'settled' : 'active';

      await client.query(
        'UPDATE debts SET paid_amount=$1, status=$2, updated_at=NOW() WHERE id=$3',
        [Math.min(newPaid, parseFloat(debt.amount)), newStatus, id]
      );

      await client.query('COMMIT');

      const updatedDebt = (await pool.query('SELECT * FROM debts WHERE id=$1', [id])).rows[0];
      const payments = (await pool.query('SELECT * FROM debt_payments WHERE debt_id=$1 ORDER BY date DESC', [id])).rows;

      res.json({ debt: updatedDebt, payments });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Debt payment POST error:', err);
      res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  }
);

// ── DELETE /api/debts/:id/payments/:pid ─────────────────────────────────────
router.delete('/:id/payments/:pid', async (req, res) => {
  const userId = req.user.id;
  const { id, pid } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const debtRes = await client.query(
      'SELECT * FROM debts WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, userId]
    );
    if (!debtRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const debt = debtRes.rows[0];

    const payRes = await client.query('SELECT * FROM debt_payments WHERE id=$1 AND debt_id=$2', [pid, id]);
    if (!payRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment not found' });
    }
    const pay = payRes.rows[0];

    await client.query('DELETE FROM debt_payments WHERE id=$1', [pid]);

    const converted = await convertCurrency(parseFloat(pay.amount), pay.currency, debt.currency);
    const newPaid = Math.max(0, parseFloat(debt.paid_amount) - converted);
    const newStatus = newPaid >= parseFloat(debt.amount) ? 'settled' : 'active';

    await client.query(
      'UPDATE debts SET paid_amount=$1, status=$2, updated_at=NOW() WHERE id=$3',
      [newPaid, newStatus, id]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Debt payment DELETE error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
