import { Shield, Lock, Database, Mail, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
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
          Maxfiylik siyosati
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 mb-nav lg:mb-0">
        {/* Hero */}
        <div className="card text-center py-8">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
            Boyaka Maxfiylik Siyosati
          </h2>
          <p className="text-sm text-text-muted dark:text-dark-text-muted">
            So'nggi yangilanish: 2025-yil
          </p>
        </div>

        {/* Section: Ma'lumotlar */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Database size={20} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Ma'lumotlarni to'plash
            </h3>
          </div>
          <div className="space-y-3 text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            <p>
              Boyaka foydalanuvchi moliyaviy ma'lumotlarini (daromad, xarajat, byudjet, maqsadlar) boshqarish
              uchun ishlatiladi. Biz faqat ilovani to'g'ri ishlashi uchun zarur bo'lgan ma'lumotlarni to'playmiz.
            </p>
            <p>
              To'planadigan ma'lumotlar:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ro'yxatdan o'tish ma'lumotlari (ism, email)</li>
              <li>Moliyaviy operatsiya ma'lumotlari (tranzaksiyalar, kategoriyalar)</li>
              <li>Ilova sozlamalari va afzalliklari</li>
            </ul>
          </div>
        </div>

        {/* Section: Xavfsizlik */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Lock size={20} className="text-primary" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Ma'lumotlar xavfsizligi
            </h3>
          </div>
          <div className="space-y-3 text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            <p>
              Sizning moliyaviy ma'lumotlaringiz xavfsizligi bizning ustuvor vazifamiz. Barcha ma'lumotlar
              shifrlangan kanallar orqali uzatiladi (HTTPS) va xavfsiz serverda saqlanadi.
            </p>
            <p>
              Parollar bcrypt bilan shifrlanadi. Tokenlar JWT formatida saqlanadi va muddati cheklangan.
            </p>
          </div>
        </div>

        {/* Section: Uchinchi tomon */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Shield size={20} className="text-violet-600" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Uchinchi tomon xizmatlar
            </h3>
          </div>
          <div className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            <p>
              Boyaka sizning shaxsiy moliyaviy ma'lumotlaringizni uchinchi tomonlarga sotmaydi yoki bermaydi.
              Ma'lumotlar faqat ilovani ishlatish uchun xizmat qiladi.
            </p>
          </div>
        </div>

        {/* Section: Aloqa */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Mail size={20} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-text-primary dark:text-dark-text-primary">
              Bog'lanish
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Maxfiylik bo'yicha savollar yoki shikoyatlar uchun bizga murojaat qiling:
            <br />
            <span className="text-primary font-medium">support@boyaka.app</span>
          </p>
        </div>

        {/* Legal notice */}
        <p className="text-xs text-text-muted dark:text-dark-text-muted text-center px-4 pb-4">
          ⚠️ Bu maxfiylik siyosati vaqtinchalik placeholder hisoblanadi.
          To'liq yuridik matn keyinroq qo'shiladi.
        </p>
      </div>
    </div>
  );
}
