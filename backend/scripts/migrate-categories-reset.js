/**
 * migrate-categories-reset.js
 * Barcha foydalanuvchilarning kategoriyalarini yangi soddalashtirilgan ro'yxat bilan almashtiradi.
 * Tranzaksiyalarga ulangan kategoriyalar NULL ga o'tkaziladi (avval), keyin eski kategoriyalar o'chiriladi.
 */

import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

const NEW_CATEGORIES = [
  // DAROMAD
  { name: 'Oylik',        type: 'income',  icon: 'briefcase',     color: '#10B981' },
  { name: 'Biznes',       type: 'income',  icon: 'trending-up',   color: '#3B82F6' },
  { name: 'Investitsiya', type: 'income',  icon: 'bar-chart-2',   color: '#8B5CF6' },
  { name: 'Boshqa',       type: 'income',  icon: 'plus-circle',   color: '#64748B' },
  // XARAJAT
  { name: 'Oziq-ovqat',  type: 'expense', icon: 'shopping-cart',  color: '#EF4444' },
  { name: 'Zapravka',    type: 'expense', icon: 'truck',           color: '#D97706' },
  { name: 'Sport',       type: 'expense', icon: 'activity',        color: '#059669' },
  { name: 'Kurs',        type: 'expense', icon: 'book-open',       color: '#3B82F6' },
  { name: 'Onam',        type: 'expense', icon: 'users',           color: '#7C3AED' },
  { name: 'Kiyim',       type: 'expense', icon: 'shopping-bag',    color: '#EC4899' },
  { name: 'Dam olish',   type: 'expense', icon: 'smile',           color: '#F43F5E' },
  { name: 'Boshqa',      type: 'expense', icon: 'more-horizontal', color: '#94A3B8' },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Barcha foydalanuvchilarni ol
    const users = await client.query('SELECT id FROM users');
    console.log(`👥 ${users.rows.length} ta foydalanuvchi topildi`);

    for (const { id: userId } of users.rows) {
      // 1. Eski kategoriyalarga bog'liq tranzaksiyalarni NULL ga o'tkaz
      await client.query(
        `UPDATE transactions SET category_id = NULL
         WHERE user_id = $1 AND category_id IN (
           SELECT id FROM categories WHERE user_id = $1
         )`,
        [userId]
      );

      // 2. Eski kategoriyalarga bog'liq budjetlarni o'chir
      await client.query(
        `DELETE FROM budgets WHERE user_id = $1 AND category_id IN (
           SELECT id FROM categories WHERE user_id = $1
         )`,
        [userId]
      );

      // 3. Barcha eski kategoriyalarni o'chir
      await client.query('DELETE FROM categories WHERE user_id = $1', [userId]);

      // 4. Yangi kategoriyalarni qo'sh
      for (const cat of NEW_CATEGORIES) {
        await client.query(
          'INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5)',
          [userId, cat.name, cat.type, cat.icon, cat.color]
        );
      }

      console.log(`  ✅ User ${userId}: kategoriyalar yangilandi`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Migration muvaffaqiyatli yakunlandi!');
    console.log(`   ${NEW_CATEGORIES.length} ta yangi kategoriya har bir foydalanuvchiga qo'shildi.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Xatolik:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
