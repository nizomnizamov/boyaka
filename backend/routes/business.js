import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// ─── Helper: check membership ───────────────────────────────────────────────
async function getMember(businessId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM business_members WHERE business_id=$1 AND user_id=$2`,
    [businessId, userId]
  );
  return rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  BUSINESS ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/business — list businesses for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ba.*, bm.role, bm.status, bm.profit_share,
              u.full_name as created_by_name,
              COUNT(DISTINCT bm2.id) FILTER (WHERE bm2.status='active') as member_count
       FROM business_accounts ba
       INNER JOIN business_members bm ON ba.id=bm.business_id AND bm.user_id=$1
       LEFT JOIN users u ON ba.created_by=u.id
       LEFT JOIN business_members bm2 ON ba.id=bm2.business_id
       GROUP BY ba.id, bm.role, bm.status, bm.profit_share, u.full_name
       ORDER BY ba.created_at DESC`,
      [req.user.id]
    );
    res.json({ businesses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// POST /api/business — create business
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, currency = 'UZS', profit_share = 50 } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const invite_code = crypto.randomBytes(5).toString('hex').toUpperCase();

    const { rows } = await client.query(
      `INSERT INTO business_accounts(name, description, currency, invite_code, created_by)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [name, description, currency, invite_code, req.user.id]
    );
    const biz = rows[0];

    await client.query(
      `INSERT INTO business_members(business_id, user_id, role, profit_share, status, joined_at)
       VALUES($1,$2,'owner',$3,'active',NOW())`,
      [biz.id, req.user.id, profit_share]
    );

    await client.query('COMMIT');
    res.json({ business: biz });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create business' });
  } finally {
    client.release();
  }
});

// GET /api/business/:id — full details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active')
      return res.status(403).json({ error: 'Access denied' });

    const { rows } = await pool.query(
      `SELECT ba.*, u.full_name as created_by_name
       FROM business_accounts ba
       LEFT JOIN users u ON ba.created_by=u.id
       WHERE ba.id=$1`, [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const { rows: members } = await pool.query(
      `SELECT bm.*, u.full_name, u.email, inv.full_name as invited_by_name
       FROM business_members bm
       INNER JOIN users u ON bm.user_id=u.id
       LEFT JOIN users inv ON bm.invited_by=inv.id
       WHERE bm.business_id=$1
       ORDER BY CASE bm.role WHEN 'owner' THEN 1 ELSE 2 END, bm.joined_at`,
      [id]
    );

    // Summary stats
    const { rows: stats } = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as total_expense,
         COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0) as balance
       FROM business_transactions WHERE business_id=$1`,
      [id]
    );

    res.json({ business: rows[0], members, stats: stats[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// PUT /api/business/:id — update
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.role !== 'owner')
      return res.status(403).json({ error: 'Only owner can update' });

    const { name, description, currency } = req.body;
    const { rows } = await pool.query(
      `UPDATE business_accounts SET name=COALESCE($1,name), description=COALESCE($2,description),
       currency=COALESCE($3,currency), updated_at=NOW() WHERE id=$4 RETURNING *`,
      [name, description, currency, id]
    );
    res.json({ business: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE /api/business/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.role !== 'owner')
      return res.status(403).json({ error: 'Only owner can delete' });
    await pool.query('DELETE FROM business_accounts WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  INVITATIONS
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/business/:id/invite — invite by email
router.post('/:id/invite', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { email, profit_share = 50 } = req.body;

    const member = await getMember(id, req.user.id);
    if (!member || member.role !== 'owner' || member.status !== 'active')
      return res.status(403).json({ error: 'Only owner can invite' });

    // Find user by email
    const { rows: users } = await client.query(
      'SELECT id, full_name, email FROM users WHERE email=$1', [email]
    );
    if (!users[0]) return res.status(404).json({ error: 'User not found with this email' });
    const invitee = users[0];

    if (invitee.id === req.user.id)
      return res.status(400).json({ error: 'Cannot invite yourself' });

    // Check already member
    const existing = await getMember(id, invitee.id);
    if (existing) return res.status(400).json({ error: 'User already invited or member' });

    await client.query('BEGIN');
    await client.query(
      `INSERT INTO business_members(business_id, user_id, role, profit_share, status, invited_by, invited_at)
       VALUES($1,$2,'partner',$3,'pending',$4,NOW())`,
      [id, invitee.id, profit_share, req.user.id]
    );
    await client.query('COMMIT');

    res.json({ success: true, message: `${invitee.full_name} invited successfully` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to invite' });
  } finally {
    client.release();
  }
});

// POST /api/business/join — join via invite code
router.post('/join/code', authMiddleware, async (req, res) => {
  try {
    const { invite_code } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM business_accounts WHERE invite_code=$1', [invite_code]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invalid invite code' });
    const biz = rows[0];

    const existing = await getMember(biz.id, req.user.id);
    if (existing && existing.status === 'active')
      return res.status(400).json({ error: 'Already a member' });

    if (existing && existing.status === 'pending') {
      await pool.query(
        `UPDATE business_members SET status='active', joined_at=NOW() WHERE business_id=$1 AND user_id=$2`,
        [biz.id, req.user.id]
      );
    } else {
      await pool.query(
        `INSERT INTO business_members(business_id, user_id, role, profit_share, status, joined_at)
         VALUES($1,$2,'partner',50,'active',NOW())`,
        [biz.id, req.user.id]
      );
    }

    res.json({ success: true, business: biz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join' });
  }
});

// POST /api/business/:id/respond — accept/decline invitation
router.post('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'decline'

    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'pending')
      return res.status(400).json({ error: 'No pending invitation found' });

    if (action === 'accept') {
      await pool.query(
        `UPDATE business_members SET status='active', joined_at=NOW() WHERE business_id=$1 AND user_id=$2`,
        [id, req.user.id]
      );
      res.json({ success: true, status: 'active' });
    } else {
      await pool.query(
        `DELETE FROM business_members WHERE business_id=$1 AND user_id=$2`,
        [id, req.user.id]
      );
      res.json({ success: true, status: 'declined' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to respond' });
  }
});

// PUT /api/business/:id/members/:uid/share — update profit share
router.put('/:id/members/:uid/share', authMiddleware, async (req, res) => {
  try {
    const { id, uid } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.role !== 'owner')
      return res.status(403).json({ error: 'Only owner can change shares' });

    const { profit_share } = req.body;
    await pool.query(
      `UPDATE business_members SET profit_share=$1 WHERE business_id=$2 AND user_id=$3`,
      [profit_share, id, uid]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update share' });
  }
});

// DELETE /api/business/:id/members/:uid — remove member
router.delete('/:id/members/:uid', authMiddleware, async (req, res) => {
  try {
    const { id, uid } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || (member.role !== 'owner' && String(req.user.id) !== uid))
      return res.status(403).json({ error: 'Access denied' });

    await pool.query(
      `UPDATE business_members SET status='left' WHERE business_id=$1 AND user_id=$2`,
      [id, uid]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:id/projects', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    const { rows } = await pool.query(
      `SELECT bp.*,
              COALESCE(SUM(CASE WHEN bt.type='income' THEN bt.amount ELSE 0 END),0) as earned,
              COALESCE(SUM(CASE WHEN bt.type='expense' THEN bt.amount ELSE 0 END),0) as spent,
              COUNT(bt.id) as tx_count
       FROM business_projects bp
       LEFT JOIN business_transactions bt ON bp.id=bt.project_id
       WHERE bp.business_id=$1
       GROUP BY bp.id ORDER BY bp.created_at DESC`,
      [id]
    );
    res.json({ projects: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/:id/projects', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    const { name, client_name, description, budget, currency, start_date, end_date, color, status } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO business_projects(business_id, name, client_name, description, budget, currency, start_date, end_date, color, status, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, name, client_name, description, budget || 0, currency || 'UZS', start_date, end_date, color || '#3B82F6', status || 'active', req.user.id]
    );
    res.json({ project: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id/projects/:pid', authMiddleware, async (req, res) => {
  try {
    const { id, pid } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    const { name, client_name, description, budget, currency, start_date, end_date, color, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE business_projects SET
         name=COALESCE($1,name), client_name=COALESCE($2,client_name),
         description=COALESCE($3,description), budget=COALESCE($4,budget),
         currency=COALESCE($5,currency), start_date=COALESCE($6,start_date),
         end_date=COALESCE($7,end_date), color=COALESCE($8,color),
         status=COALESCE($9,status)
       WHERE id=$10 AND business_id=$11 RETURNING *`,
      [name, client_name, description, budget, currency, start_date, end_date, color, status, pid, id]
    );
    res.json({ project: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id/projects/:pid', authMiddleware, async (req, res) => {
  try {
    const { id, pid } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    await pool.query('DELETE FROM business_projects WHERE id=$1 AND business_id=$2', [pid, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    const { project_id, type, limit = 50, offset = 0 } = req.query;
    let where = 'WHERE bt.business_id=$1';
    const params = [id];
    let pIdx = 2;

    if (project_id) { where += ` AND bt.project_id=$${pIdx++}`; params.push(project_id); }
    if (type) { where += ` AND bt.type=$${pIdx++}`; params.push(type); }

    const { rows } = await pool.query(
      `SELECT bt.*, bp.name as project_name, bp.color as project_color,
              u.full_name as added_by_name
       FROM business_transactions bt
       LEFT JOIN business_projects bp ON bt.project_id=bp.id
       LEFT JOIN users u ON bt.user_id=u.id
       ${where}
       ORDER BY bt.date DESC, bt.created_at DESC
       LIMIT $${pIdx} OFFSET $${pIdx+1}`,
      [...params, limit, offset]
    );

    // Summary
    const { rows: summary } = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as total_expense
       FROM business_transactions WHERE business_id=$1`,
      [id]
    );

    res.json({ transactions: rows, summary: summary[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    const { project_id, type, amount, currency, description, category, date } = req.body;
    if (!type || !amount) return res.status(400).json({ error: 'type and amount are required' });

    const { rows } = await pool.query(
      `INSERT INTO business_transactions(business_id, project_id, user_id, type, amount, currency, description, category, date)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, project_id || null, req.user.id, type, amount, currency || 'UZS', description, category, date || new Date().toISOString().split('T')[0]]
    );
    res.json({ transaction: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/:id/transactions/:tid', authMiddleware, async (req, res) => {
  try {
    const { id, tid } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    const { project_id, type, amount, currency, description, category, date } = req.body;
    const { rows } = await pool.query(
      `UPDATE business_transactions SET
         project_id=COALESCE($1,project_id), type=COALESCE($2,type),
         amount=COALESCE($3,amount), currency=COALESCE($4,currency),
         description=COALESCE($5,description), category=COALESCE($6,category),
         date=COALESCE($7,date)
       WHERE id=$8 AND business_id=$9 RETURNING *`,
      [project_id, type, amount, currency, description, category, date, tid, id]
    );
    res.json({ transaction: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id/transactions/:tid', authMiddleware, async (req, res) => {
  try {
    const { id, tid } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    await pool.query('DELETE FROM business_transactions WHERE id=$1 AND business_id=$2', [tid, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  PROFIT DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:id/distributions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    const { rows } = await pool.query(
      `SELECT pd.*, u.full_name as created_by_name,
              json_agg(json_build_object(
                'user_id', pds.user_id,
                'full_name', usr.full_name,
                'profit_share', pds.profit_share,
                'amount', pds.amount,
                'paid', pds.paid
              )) as shares
       FROM profit_distributions pd
       LEFT JOIN users u ON pd.created_by=u.id
       LEFT JOIN profit_distribution_shares pds ON pd.id=pds.distribution_id
       LEFT JOIN users usr ON pds.user_id=usr.id
       WHERE pd.business_id=$1
       GROUP BY pd.id, u.full_name
       ORDER BY pd.created_at DESC`,
      [id]
    );
    res.json({ distributions: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
});

router.post('/:id/distribute', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { period_start, period_end, note } = req.body;

    const member = await getMember(id, req.user.id);
    if (!member || member.status !== 'active') return res.status(403).json({ error: 'Access denied' });

    // Get business currency
    const { rows: bizRows } = await client.query('SELECT currency FROM business_accounts WHERE id=$1', [id]);
    const currency = bizRows[0]?.currency || 'UZS';

    // Calculate totals for period
    const { rows: totals } = await client.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as total_expense
       FROM business_transactions
       WHERE business_id=$1 AND date BETWEEN $2 AND $3`,
      [id, period_start, period_end]
    );
    const { total_income, total_expense } = totals[0];
    const net_profit = parseFloat(total_income) - parseFloat(total_expense);

    // Get active members with their shares
    const { rows: members } = await client.query(
      `SELECT user_id, profit_share FROM business_members WHERE business_id=$1 AND status='active'`,
      [id]
    );

    await client.query('BEGIN');

    const { rows: distRows } = await client.query(
      `INSERT INTO profit_distributions(business_id, period_start, period_end, total_income, total_expense, net_profit, currency, note, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, period_start, period_end, total_income, total_expense, net_profit, currency, note, req.user.id]
    );
    const dist = distRows[0];

    // Create per-member shares
    const totalShare = members.reduce((s, m) => s + parseFloat(m.profit_share), 0);
    for (const m of members) {
      const share = parseFloat(m.profit_share);
      const amount = totalShare > 0 ? (net_profit * share / totalShare) : 0;
      await client.query(
        `INSERT INTO profit_distribution_shares(distribution_id, user_id, profit_share, amount, currency)
         VALUES($1,$2,$3,$4,$5)`,
        [dist.id, m.user_id, share, amount, currency]
      );
    }

    await client.query('COMMIT');
    res.json({ distribution: dist });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create distribution' });
  } finally {
    client.release();
  }
});

// Mark share as paid
router.put('/:id/distributions/:did/shares/:uid/paid', authMiddleware, async (req, res) => {
  try {
    const { id, did, uid } = req.params;
    const member = await getMember(id, req.user.id);
    if (!member || member.role !== 'owner') return res.status(403).json({ error: 'Only owner can mark paid' });

    await pool.query(
      `UPDATE profit_distribution_shares SET paid=$1
       WHERE distribution_id=$2 AND user_id=$3`,
      [req.body.paid, did, uid]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

export default router;
