import { FileText, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur border-b border-border dark:border-dark-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn-icon-sm btn-ghost"
          aria-label="Orqaga"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">
          Foydalanish shartlari
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 mb-nav lg:mb-0">
        {/* Hero */}
        <div className="card text-center py-8">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
            Foydalanish shartlari
          </h2>
          <p className="text-sm text-text-muted dark:text-dark-text-muted">
            So'nggi yangilanish: 2025-yil
          </p>
        </div>

        {/* Section: Qabul */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Shartlarni qabul qilish
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Boyaka ilovasidan foydalanish orqali siz ushbu foydalanish shartlarini qabul qilar ekansiz.
            Agar siz bu shartlarga rozi bo'lmasangiz, ilovadan foydalanmang.
          </p>
        </div>

        {/* Section: Xizmat */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Xizmat haqida
            </h3>
          </div>
          <div className="space-y-2 text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            <p>Boyaka shaxsiy moliyaviy boshqaruv ilovasidir. Ilova quyidagi imkoniyatlarni taqdim etadi:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Daromad va xarajatlarni kuzatish</li>
              <li>Byudjet rejalashtirish</li>
              <li>Moliyaviy maqsadlar belgilash</li>
              <li>Qarz daftarini boshqarish</li>
              <li>Moliyaviy hisobotlar</li>
            </ul>
          </div>
        </div>

        {/* Section: Mas'uliyat */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Mas'uliyat chegarasi
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Boyaka moliyaviy maslahat xizmati emas. Ilova faqat ma'lumotlarni kuzatish va
            vizualizatsiya qilish uchun mo'ljallangan. Moliyaviy qarorlar uchun mutaxassis maslahatiga
            murojaat qiling. Boyaka hech qanday moliyaviy yo'qotish uchun javobgar emas.
          </p>
        </div>

        {/* Section: Hisobni o'chirish */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Hisobni o'chirish
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Istalgan vaqtda hisobingizni o'chirishingiz mumkin. Hisobni o'chirish barcha
            ma'lumotlaringizni doimiy ravishda o'chiradi.
          </p>
        </div>

        {/* Legal notice */}
        <p className="text-xs text-text-muted dark:text-dark-text-muted text-center px-4 pb-4">
          ⚠️ Bu foydalanish shartlari vaqtinchalik placeholder hisoblanadi.
          To'liq yuridik matn keyinroq qo'shiladi.
        </p>
      </div>
    </div>
  );
}
