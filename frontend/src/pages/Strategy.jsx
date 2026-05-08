import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';
import {
  PieChart, Plus, Trash2, ChevronLeft, ChevronRight,
  Edit3, AlertTriangle, CheckCircle, XCircle, Sparkles, Pencil
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: '50-30-20',
    icon: '⚖️',
    color: 'blue',
    name: { uz: '50/30/20 Qoidasi', ru: 'Правило 50/30/20', en: '50/30/20 Rule' },
    desc: {
      uz: 'Eng mashhur byudjet usuli. Zaruriy 50%, Ixtiyoriy 30%, Jamg\'arma 20%.',
      ru: 'Самый популярный метод: нужды 50%, желания 30%, сбережения 20%.',
      en: 'Most popular method: needs 50%, wants 30%, savings 20%.',
    },
    slots: [
      { label: { uz: 'Zaruriy xarajatlar (ijara, oziq-ovqat, transport)', ru: 'Необходимые расходы', en: 'Needs (rent, food, transport)' }, pct: 50 },
      { label: { uz: 'Ixtiyoriy xarajatlar (ko\'ngilochar, kiyim)', ru: 'Желания (развлечения, одежда)', en: 'Wants (entertainment, clothing)' }, pct: 30 },
      { label: { uz: 'Jamg\'arma va investitsiya', ru: 'Сбережения и инвестиции', en: 'Savings & investments' }, pct: 20 },
    ],
  },
  {
    id: 'moliyaviy-yostiq',
    icon: '🛡️',
    color: 'green',
    name: { uz: 'Moliyaviy Yostiq', ru: 'Финансовая подушка', en: 'Emergency Fund' },
    desc: {
      uz: 'Kutilmagan xarajatlar uchun zaxira. Kamida 3-6 oylik xarajatni to\'pla.',
      ru: 'Резерв на непредвиденные случаи. Накопи расходы на 3–6 месяцев.',
      en: 'Safety net for unexpected expenses. Build 3–6 months of expenses.',
    },
    slots: [
      { label: { uz: 'Moliyaviy yostiq (zaxira fond)', ru: 'Финансовая подушка (резервный фонд)', en: 'Emergency / safety reserve' }, pct: 30 },
      { label: { uz: 'Zaruriy turmush xarajatlari', ru: 'Базовые расходы на жизнь', en: 'Essential living costs' }, pct: 40 },
      { label: { uz: 'Kundalik xarajatlar', ru: 'Текущие расходы', en: 'Day-to-day expenses' }, pct: 20 },
      { label: { uz: 'Ko\'ngilochar / dam olish', ru: 'Досуг / отдых', en: 'Leisure / rest' }, pct: 10 },
    ],
  },
  {
    id: 'ehson',
    icon: '🤲',
    color: 'yellow',
    name: { uz: 'Ehson va Xayriya', ru: 'Пожертвования и благотворительность', en: 'Charity & Giving' },
    desc: {
      uz: 'Ehson, sadaqa va yaqinlarga yordam uchun byudjet ajratish.',
      ru: 'Выделяй бюджет на пожертвования, садака и помощь близким.',
      en: 'Budget for charity, sadaqa and helping loved ones.',
    },
    slots: [
      { label: { uz: 'Ehson / sadaqa / xayriya', ru: 'Садака / пожертвования / благотворительность', en: 'Charity / donations / sadaqa' }, pct: 10 },
      { label: { uz: 'Yaqinlarga yordam (oila, do\'stlar)', ru: 'Помощь близким (семья, друзья)', en: 'Helping family & friends' }, pct: 10 },
      { label: { uz: 'Zaruriy turmush xarajatlari', ru: 'Базовые расходы на жизнь', en: 'Essential living costs' }, pct: 45 },
      { label: { uz: 'Jamg\'arma / investitsiya', ru: 'Сбережения / инвестиции', en: 'Savings / investments' }, pct: 20 },
      { label: { uz: 'Ixtiyoriy xarajatlar', ru: 'Прочие расходы', en: 'Discretionary spending' }, pct: 15 },
    ],
  },
  {
    id: 'ota-ona',
    icon: '👨‍👩‍👧',
    color: 'purple',
    name: { uz: 'Ota-Ona Qo\'llab-quvvatlash', ru: 'Поддержка родителей', en: 'Parents Support' },
    desc: {
      uz: 'Ota-ona va katta yoshlilarni moddiy qo\'llash uchun maxsus byudjet.',
      ru: 'Бюджет для финансовой поддержки родителей и пожилых людей.',
      en: 'Dedicated budget for supporting parents and elders.',
    },
    slots: [
      { label: { uz: 'Ota-onaga yordamlik (pul o\'tkazma, sovg\'a)', ru: 'Поддержка родителей (переводы, подарки)', en: 'Parents support (transfers, gifts)' }, pct: 20 },
      { label: { uz: 'Ota-ona sog\'lig\'i (dori, shifokor)', ru: 'Здоровье родителей (лекарства, врач)', en: 'Parents health (medicine, doctor)' }, pct: 10 },
      { label: { uz: 'O\'z turmush xarajatlarim', ru: 'Мои расходы на жизнь', en: 'My living expenses' }, pct: 40 },
      { label: { uz: 'Jamg\'arma (kelajak uchun)', ru: 'Сбережения (на будущее)', en: 'Savings (for future)' }, pct: 20 },
      { label: { uz: 'Ko\'ngilochar / shaxsiy', ru: 'Досуг / личное', en: 'Leisure / personal' }, pct: 10 },
    ],
  },
  {
    id: 'kundalik-xarajat',
    icon: '🛒',
    color: 'orange',
    name: { uz: 'Kundalik Xarajatlar', ru: 'Повседневные расходы', en: 'Daily Expenses' },
    desc: {
      uz: 'Bozor, oziq-ovqat, transport va maishiy xarajatlarni tartibga solish.',
      ru: 'Упорядочи расходы на продукты, транспорт и бытовые нужды.',
      en: 'Organize groceries, transport and household spending.',
    },
    slots: [
      { label: { uz: 'Oziq-ovqat / bozor / supermarket', ru: 'Еда / рынок / супермаркет', en: 'Food / market / supermarket' }, pct: 30 },
      { label: { uz: 'Transport (marshrutka, taksi, benzin)', ru: 'Транспорт (такси, бензин)', en: 'Transport (taxi, fuel)' }, pct: 15 },
      { label: { uz: 'Kommunal to\'lovlar (gaz, svet, suv, internet)', ru: 'Коммунальные платежи', en: 'Utilities (gas, electricity, internet)' }, pct: 15 },
      { label: { uz: 'Kiyim va maishiy tovarlar', ru: 'Одежда и бытовые товары', en: 'Clothing & household goods' }, pct: 15 },
      { label: { uz: 'Ko\'ngilochar va restoranlar', ru: 'Развлечения и рестораны', en: 'Entertainment & dining out' }, pct: 10 },
      { label: { uz: 'Jamg\'arma', ru: 'Сбережения', en: 'Savings' }, pct: 15 },
    ],
  },
  {
    id: 'kapital',
    icon: '📈',
    color: 'cyan',
    name: { uz: 'Kapital Yaratish', ru: 'Создание капитала', en: 'Capital Building' },
    desc: {
      uz: 'Boylik to\'plash va investitsiya orqali moliyaviy mustaqillikka erishish.',
      ru: 'Накопление состояния и финансовая независимость через инвестиции.',
      en: 'Build wealth and reach financial independence through investing.',
    },
    slots: [
      { label: { uz: 'Investitsiya (aksiya, fond, ko\'chmas mulk)', ru: 'Инвестиции (акции, фонды, недвижимость)', en: 'Investments (stocks, funds, real estate)' }, pct: 30 },
      { label: { uz: 'Biznes xarajatlari / o\'z-o\'zini rivojlantirish', ru: 'Бизнес-расходы / саморазвитие', en: 'Business / self-development' }, pct: 15 },
      { label: { uz: 'Zaruriy turmush xarajatlari', ru: 'Базовые расходы на жизнь', en: 'Essential living costs' }, pct: 40 },
      { label: { uz: 'Favqulodda zaxira', ru: 'Аварийный резерв', en: 'Emergency reserve' }, pct: 10 },
      { label: { uz: 'Ko\'ngilochar / shaxsiy', ru: 'Досуг / личное', en: 'Leisure / personal' }, pct: 5 },
    ],
  },
  {
    id: 'orzu',
    icon: '✨',
    color: 'pink',
    name: { uz: 'Orzu va Maqsad', ru: 'Мечта и цель', en: 'Dreams & Goals' },
    desc: {
      uz: 'Katta maqsad (mashina, uy, sayohat) uchun tizimli jamg\'arish strategiyasi.',
      ru: 'Системное накопление на большую цель: машина, дом, путешествие.',
      en: 'Systematic saving for a big goal: car, home, travel.',
    },
    slots: [
      { label: { uz: 'Asosiy orzu / maqsad fondi', ru: 'Фонд мечты / главной цели', en: 'Dream / main goal fund' }, pct: 25 },
      { label: { uz: 'Zaruriy turmush xarajatlari', ru: 'Базовые расходы на жизнь', en: 'Essential living costs' }, pct: 45 },
      { label: { uz: 'Kichik quvonchlar (kafe, kino, sovg\'a)', ru: 'Маленькие радости (кафе, кино, подарки)', en: 'Small joys (cafe, cinema, gifts)' }, pct: 15 },
      { label: { uz: 'Moliyaviy yostiq (zaxira)', ru: 'Финансовая подушка', en: 'Emergency cushion' }, pct: 15 },
    ],
  },
  {
    id: 'talaba',
    icon: '🎓',
    color: 'indigo',
    name: { uz: 'Talaba Byudjeti', ru: 'Студенческий бюджет', en: 'Student Budget' },
    desc: {
      uz: 'Kam byudjetda ham tartibni saqlash — ta\'lim va oziq-ovqat ustuvor.',
      ru: 'Порядок при небольшом бюджете — учёба и еда в приоритете.',
      en: 'Stay organized on a tight budget — study and food first.',
    },
    slots: [
      { label: { uz: 'Oziq-ovqat / kafe', ru: 'Еда / кафе', en: 'Food / cafes' }, pct: 30 },
      { label: { uz: 'Ijara / yotoqxona', ru: 'Аренда / общежитие', en: 'Rent / dormitory' }, pct: 35 },
      { label: { uz: 'Ta\'lim (kitob, kurs, to\'lov)', ru: 'Учёба (книги, курсы, оплата)', en: 'Education (books, courses)' }, pct: 15 },
      { label: { uz: 'Transport', ru: 'Транспорт', en: 'Transport' }, pct: 10 },
      { label: { uz: 'Shaxsiy / ko\'ngilochar', ru: 'Личное / развлечения', en: 'Personal / entertainment' }, pct: 10 },
    ],
  },
  {
    id: 'freelancer',
    icon: '💻',
    color: 'teal',
    name: { uz: 'Freelancer / Tadbirkor', ru: 'Фрилансер / Предприниматель', en: 'Freelancer / Entrepreneur' },
    desc: {
      uz: 'O\'zgaruvchan daromad uchun: soliq, biznes va kelajak uchun zaxira.',
      ru: 'Нестабильный доход: налоги, бизнес-расходы и резерв на будущее.',
      en: 'Variable income: taxes, business costs and future reserve.',
    },
    slots: [
      { label: { uz: 'Soliq zaxirasi (daromaddan)', ru: 'Налоговый резерв', en: 'Tax reserve' }, pct: 20 },
      { label: { uz: 'Biznes xarajatlari (asbob, reklama, kurs)', ru: 'Бизнес-расходы (инструменты, реклама)', en: 'Business expenses (tools, ads, courses)' }, pct: 15 },
      { label: { uz: 'Yashash xarajatlari', ru: 'Расходы на жизнь', en: 'Living expenses' }, pct: 40 },
      { label: { uz: 'Investitsiya / jamg\'arma', ru: 'Инвестиции / сбережения', en: 'Investments / savings' }, pct: 25 },
    ],
  },
  {
    id: 'nikoh',
    icon: '💍',
    color: 'rose',
    name: { uz: 'To\'y va Oila Qurishga Tayyorgarlik', ru: 'Свадьба и создание семьи', en: 'Wedding & Family Planning' },
    desc: {
      uz: 'To\'y xarajatlari, yangi uy va oilaviy hayotni rejalashtirish.',
      ru: 'Планирование свадьбы, нового жилья и семейной жизни.',
      en: 'Plan your wedding, new home and family life.',
    },
    slots: [
      { label: { uz: 'To\'y fondi (zal, kiyim, taom)', ru: 'Свадебный фонд (зал, наряды, угощение)', en: 'Wedding fund (venue, outfit, catering)' }, pct: 25 },
      { label: { uz: 'Uy jihozlari / ko\'chmas mulk', ru: 'Мебель / недвижимость', en: 'Furniture / property' }, pct: 20 },
      { label: { uz: 'Zaruriy turmush xarajatlari', ru: 'Базовые расходы', en: 'Essential living costs' }, pct: 35 },
      { label: { uz: 'Jamg\'arma / zaxira', ru: 'Сбережения / резерв', en: 'Savings / reserve' }, pct: 15 },
      { label: { uz: 'Ko\'ngilochar / sayohat (honeymoon)', ru: 'Путешествие (медовый месяц)', en: 'Travel / honeymoon' }, pct: 5 },
    ],
  },
  {
    id: 'pensiya',
    icon: '🌅',
    color: 'amber',
    name: { uz: 'Pensiyaga Tayyorgarlik', ru: 'Подготовка к пенсии', en: 'Retirement Planning' },
    desc: {
      uz: 'Erta pensiya yoki keksalik uchun uzoq muddatli moliyaviy reja.',
      ru: 'Долгосрочный план для ранней пенсии или достойной старости.',
      en: 'Long-term plan for early retirement or a comfortable old age.',
    },
    slots: [
      { label: { uz: 'Pensiya fondi / uzoq muddatli jamg\'arma', ru: 'Пенсионный фонд / долгосрочные сбережения', en: 'Retirement fund / long-term savings' }, pct: 20 },
      { label: { uz: 'Investitsiya (dividendlar, ko\'chmas mulk)', ru: 'Инвестиции (дивиденды, недвижимость)', en: 'Investments (dividends, property)' }, pct: 15 },
      { label: { uz: 'Zaruriy turmush xarajatlari', ru: 'Базовые расходы на жизнь', en: 'Essential living costs' }, pct: 40 },
      { label: { uz: 'Sog\'liqni saqlash / tibbiy sug\'urta', ru: 'Здоровье / медстрахование', en: 'Health / medical insurance' }, pct: 10 },
      { label: { uz: 'Ixtiyoriy xarajatlar / dam olish', ru: 'Досуг / отдых', en: 'Leisure / rest' }, pct: 15 },
    ],
  },
];

const COLOR_MAP = {
  blue:   { card: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10',     badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',     bar: 'bg-blue-500' },
  green:  { card: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10', badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', bar: 'bg-green-500' },
  yellow: { card: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', bar: 'bg-yellow-400' },
  purple: { card: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300', bar: 'bg-purple-500' },
  orange: { card: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300', bar: 'bg-orange-500' },
  cyan:   { card: 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10',     badge: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',     bar: 'bg-cyan-500' },
  pink:   { card: 'border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-900/10',     badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',     bar: 'bg-pink-500' },
  indigo: { card: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300', bar: 'bg-indigo-500' },
  teal:   { card: 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10',     badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',     bar: 'bg-teal-500' },
  rose:   { card: 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10',     badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',     bar: 'bg-rose-500' },
  amber:  { card: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, t }) => {
  if (status === 'good') return (
    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium whitespace-nowrap">
      <CheckCircle size={13} /> {t('strategy.good')}
    </span>
  );
  if (status === 'warning') return (
    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-medium whitespace-nowrap">
      <AlertTriangle size={13} /> {t('strategy.warning')}
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap">
      <XCircle size={13} /> {t('strategy.danger')}
    </span>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Strategy() {
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useCurrency();
  const lang = (i18n.language || 'uz').slice(0, 2);

  const now = new Date();
  const [view, setView] = useState('report'); // 'report' | 'templates' | 'setup'
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [strategy, setStrategy] = useState(null);
  const [report, setReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [strategyName, setStrategyName] = useState('');
  const [formItems, setFormItems] = useState([{ category_id: '', target_percentage: '', hint: '' }]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => { fetchStrategy(); fetchCategories(); }, []);
  useEffect(() => { if (strategy) fetchReport(); }, [strategy, month, year]);

  const fetchStrategy = async () => {
    setLoading(true);
    try {
      const res = await api.get('/strategy');
      setStrategy(res.data.strategy);
      if (res.data.strategy) {
        setStrategyName(res.data.strategy.name);
        setFormItems(res.data.items.map(i => ({
          category_id: String(i.category_id),
          target_percentage: String(i.target_percentage),
          hint: '',
        })));
      }
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?type=expense');
      setCategories(res.data);
    } catch { /* ignore */ }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.get(`/strategy/report?month=${month}&year=${year}`);
      setReport(res.data);
    } catch { /* ignore */ }
    finally { setReportLoading(false); }
  };

  const applyTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setStrategyName(tpl.name[lang] || tpl.name.uz);
    setFormItems(tpl.slots.map(s => ({
      category_id: '',
      target_percentage: '',
      hint: s.label[lang] || s.label.uz,
    })));
    setView('setup');
  };

  const openCustomSetup = () => {
    setSelectedTemplate(null);
    setStrategyName(t('strategy.myStrategy'));
    setFormItems([{ category_id: '', target_percentage: '', hint: '' }]);
    setView('setup');
  };

  const handleSave = async () => {
    const items = formItems
      .filter(i => i.category_id && i.target_percentage)
      .map(i => ({ category_id: parseInt(i.category_id), target_percentage: parseFloat(i.target_percentage) }));
    if (items.length === 0) { toast.error(t('strategy.mustBe100')); return; }
    setSaving(true);
    try {
      await api.post('/strategy', { name: strategyName, items });
      toast.success(t('strategy.created'));
      await fetchStrategy();
      setView('report');
      setSelectedTemplate(null);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || t('strategy.error'));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(t('strategy.deleteConfirm'))) return;
    try {
      await api.delete('/strategy');
      setStrategy(null);
      setReport(null);
      setFormItems([{ category_id: '', target_percentage: '', hint: '' }]);
      setSelectedTemplate(null);
      toast.success(t('strategy.deleted'));
    } catch { toast.error(t('common.error')); }
  };

  const addFormItem = () => setFormItems([...formItems, { category_id: '', target_percentage: '', hint: '' }]);
  const removeFormItem = (idx) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateFormItem = (idx, field, value) => {
    const u = [...formItems]; u[idx] = { ...u[idx], [field]: value }; setFormItems(u);
  };

  const totalPercent = formItems.reduce((s, i) => s + (parseFloat(i.target_percentage) || 0), 0);
  const isValid = Math.abs(totalPercent - 100) <= 0.5;

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <PieChart className="text-blue-600" size={24} />
            {t('strategy.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('strategy.subtitle')}</p>
        </div>
        {strategy && view === 'report' && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setSelectedTemplate(null); setView('setup'); }}
              className="btn btn-secondary text-sm flex items-center gap-1"
            >
              <Edit3 size={14} /> {t('strategy.editStrategy')}
            </button>
            <button
              onClick={handleDelete}
              className="btn text-sm flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <Trash2 size={14} /> {t('strategy.deleteStrategy')}
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: TEMPLATES
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'templates' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('strategy.chooseTemplate')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('strategy.chooseTemplateDesc')}</p>
            </div>
            <button onClick={openCustomSetup} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <Pencil size={14} /> {t('strategy.customStrategy')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEMPLATES.map(tpl => {
              const c = COLOR_MAP[tpl.color] || COLOR_MAP.blue;
              return (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-md hover:scale-[1.015] active:scale-100 ${c.card}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl leading-none mt-0.5">{tpl.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{tpl.name[lang] || tpl.name.uz}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{tpl.desc[lang] || tpl.desc.uz}</p>
                    </div>
                  </div>
                  {/* Percentage pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tpl.slots.map((s, i) => (
                      <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                        {s.pct}%
                      </span>
                    ))}
                  </div>
                  {/* Mini stacked bar */}
                  <div className="flex h-2 rounded-full overflow-hidden gap-px">
                    {tpl.slots.map((s, i) => (
                      <div key={i} className={`h-full ${c.bar} opacity-${70 - i * 10 < 30 ? 30 : 70 - i * 10}`}
                        style={{ width: `${s.pct}%`, opacity: Math.max(0.3, 0.85 - i * 0.12) }} />
                    ))}
                  </div>
                </button>
              );
            })}

            {/* Custom card */}
            <button
              onClick={openCustomSetup}
              className="text-left p-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-md group"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none mt-0.5">✏️</span>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {t('strategy.customStrategy')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('strategy.customStrategyDesc')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: SETUP FORM
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'setup' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <div className="flex items-center gap-3">
            {selectedTemplate && <span className="text-4xl">{selectedTemplate.icon}</span>}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('strategy.setupTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('strategy.setupDescription')}</p>
            </div>
          </div>

          {/* Template info banner */}
          {selectedTemplate && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${COLOR_MAP[selectedTemplate.color]?.card || ''}`}>
              <Sparkles size={15} className="mt-0.5 flex-shrink-0 text-blue-500" />
              <div className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{selectedTemplate.name[lang] || selectedTemplate.name.uz}</span>
                {' — '}{selectedTemplate.desc[lang] || selectedTemplate.desc.uz}
              </div>
            </div>
          )}

          {/* Strategy name */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('strategy.strategyName')}</label>
            <input
              type="text"
              value={strategyName}
              onChange={e => setStrategyName(e.target.value)}
              className="input"
              maxLength={100}
            />
          </div>

          {/* Category rows */}
          <div className="space-y-3">
            {formItems.map((item, idx) => (
              <div key={idx}>
                {item.hint && (
                  <p className="text-xs text-blue-500 dark:text-blue-400 mb-1 pl-1">💡 {item.hint}</p>
                )}
                <div className="flex gap-3 items-center">
                  <select
                    value={item.category_id}
                    onChange={e => updateFormItem(idx, 'category_id', e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">{t('strategy.selectCategory')}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="relative w-28 flex-shrink-0">
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={item.target_percentage}
                      onChange={e => updateFormItem(idx, 'target_percentage', e.target.value)}
                      className="input pr-6"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                  <button
                    onClick={() => removeFormItem(idx)}
                    className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addFormItem} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm hover:underline">
            <Plus size={16} /> {t('strategy.addCategory')}
          </button>

          {/* Total bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm font-medium">
              <span className="dark:text-gray-300">{t('strategy.totalPercentage')}</span>
              <span className={isValid ? 'text-green-600' : totalPercent > 100 ? 'text-red-600' : 'text-yellow-600'}>
                {totalPercent.toFixed(1)}% / 100%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isValid ? 'bg-green-500' : totalPercent > 100 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(totalPercent, 100)}%` }}
              />
            </div>
            {!isValid && <p className="text-xs text-red-500">{t('strategy.mustBe100')}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => strategy ? setView('report') : setView('templates')}
              className="btn btn-secondary flex-1"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isValid}
              className="btn btn-primary flex-1"
            >
              {saving ? t('strategy.saving') : t('strategy.saveStrategy')}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: REPORT
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'report' && (
        <>
          {!strategy ? (
            /* No strategy empty state */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center space-y-5">
              <PieChart size={56} className="mx-auto text-gray-300 dark:text-gray-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('strategy.noStrategy')}</h3>
                <p className="text-sm text-gray-400 mt-1">{t('strategy.noStrategyDesc')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setView('templates')} className="btn btn-primary flex items-center gap-2 justify-center">
                  <Sparkles size={16} /> {t('strategy.chooseTemplate')}
                </button>
                <button onClick={openCustomSetup} className="btn btn-secondary flex items-center gap-2 justify-center">
                  <Pencil size={16} /> {t('strategy.customStrategy')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Month navigator */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{MONTH_NAMES[month - 1]} {year}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>

              {reportLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : !report?.hasStrategy ? (
                <p className="text-center py-10 text-gray-400">{t('strategy.noReport')}</p>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: t('strategy.income'),      value: formatCurrency(report.totalIncome),      color: 'text-green-600' },
                      { label: t('strategy.targetSpend'), value: formatCurrency(report.totalTargetSpend), color: 'text-blue-600' },
                      { label: t('strategy.actualSpend'), value: formatCurrency(report.totalActualSpend), color: 'text-gray-800 dark:text-gray-100' },
                      { label: t('strategy.compliance'),  value: `${report.overallCompliance}/${report.totalItems}`, color: 'text-purple-600', sub: t('strategy.categoriesOnTarget') },
                    ].map((c, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                        <p className={`text-lg font-bold mt-1 ${c.color}`}>{c.value}</p>
                        {c.sub && <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Per-category breakdown */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t('strategy.reportTitle')}</h2>
                      <span className="text-xs text-gray-400 truncate ml-2">{strategy.name}</span>
                    </div>

                    {report.totalIncome === 0 && (
                      <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
                        <AlertTriangle size={14} /> {t('strategy.noIncome')}
                      </div>
                    )}

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {report.items.map(item => {
                        const usedPct = item.target_amount > 0
                          ? Math.min((item.actual_amount / item.target_amount) * 100, 150)
                          : 0;
                        const barColor = item.status === 'good' ? 'bg-green-500' : item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
                        return (
                          <div key={item.category_id} className="px-6 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-xl flex-shrink-0">{item.icon || '📁'}</span>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{item.category_name}</p>
                                  <p className="text-xs text-gray-400">
                                    {item.target_percentage}%
                                    {report.totalIncome > 0 && ` · ${t('strategy.targetAmount')}: ${formatCurrency(item.target_amount)}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                <StatusBadge status={item.status} t={t} />
                              </div>
                            </div>
                            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                              <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${usedPct}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>
                                {t('strategy.actualAmount')}: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(item.actual_amount)}</span>
                              </span>
                              {report.totalIncome > 0 && (
                                <span className={item.diff > 0 ? 'text-red-500 font-semibold' : 'text-green-500 font-semibold'}>
                                  {item.diff > 0 ? '▲ +' : '▼ '}{formatCurrency(Math.abs(item.diff))}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {report.otherAmount > 0 && (
                      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/40 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('strategy.otherExpenses')}</span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(report.otherAmount)}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
