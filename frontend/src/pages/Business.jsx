import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Building2, Plus, Users, TrendingUp, TrendingDown, Wallet,
  FolderOpen, ArrowLeftRight, PieChart, Copy, Check, X,
  ChevronDown, ChevronUp, Edit2, Trash2, UserPlus, LogIn,
  Calendar, Tag, DollarSign, BarChart3, CheckCircle, Clock,
  Crown, User, AlertCircle
} from 'lucide-react';

// ─── Utility ──────────────────────────────────────────────────────────────
const fmt = (n, currency = 'UZS') =>
  new Intl.NumberFormat('uz-UZ', { style: 'decimal', maximumFractionDigits: 0 }).format(n || 0) + ' ' + currency;

const EXPENSE_CATS = ['Reklama','Dizayn','Dasturiy ta\'minot','Transport','Ofis','Qurilma','Xodimlar','Boshqa'];
const INCOME_CATS  = ['Loyiha to\'lovi','Avans','Bonus','Maslahат','Boshqa'];
const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

// ─── Create/Edit Business Modal ────────────────────────────────────────────
const BizModal = ({ onClose, onSave, initial }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    currency: initial?.currency || 'UZS',
    profit_share: 50,
  });

  const save = async () => {
    if (!form.name.trim()) return toast.error('Nomi kerak');
    try {
      if (initial) {
        await api.put(`/business/${initial.id}`, form);
        toast.success('Yangilandi');
      } else {
        const { data } = await api.post('/business', form);
        toast.success('Biznes yaratildi!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">{initial ? 'Biznesni tahrirlash' : 'Yangi biznes'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Biznes nomi *</label>
            <input className="input" placeholder="Marketing agentligi..." value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Tavsif</label>
            <textarea className="input" rows={2} placeholder="Qisqacha tavsif..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Asosiy valyuta</label>
            <select className="input" value={form.currency}
              onChange={e => setForm({ ...form, currency: e.target.value })}>
              {['UZS','USD','EUR','RUB'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {!initial && (
            <div>
              <label className="label">Sizning ulushingiz (%)</label>
              <input type="number" className="input" min={1} max={99} value={form.profit_share}
                onChange={e => setForm({ ...form, profit_share: e.target.value })} />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Bekor</button>
          <button onClick={save} className="btn btn-primary flex-1">
            {initial ? 'Saqlash' : 'Yaratish'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Invite Modal ──────────────────────────────────────────────────────────
const InviteModal = ({ biz, onClose, onSave }) => {
  const [email, setEmail] = useState('');
  const [share, setShare] = useState(50);
  const [copied, setCopied] = useState(false);

  const invite = async () => {
    if (!email.trim()) return toast.error('Email kerak');
    try {
      const { data } = await api.post(`/business/${biz.id}/invite`, { email, profit_share: share });
      toast.success(data.message);
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(biz.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Sherik taklif qilish</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Invite code */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-5">
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-medium">Taklif kodi (ulashing)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg font-mono text-lg font-bold tracking-widest text-center">
              {biz.invite_code}
            </code>
            <button onClick={copyCode}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className="relative flex items-center mb-5">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          <span className="mx-3 text-sm text-gray-500">yoki email orqali</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Sherik emaili</label>
            <input className="input" type="email" placeholder="sherik@email.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Sherik ulushi (%)</label>
            <input type="number" className="input" min={1} max={99} value={share}
              onChange={e => setShare(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Sizniki: {100 - share}%</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Bekor</button>
          <button onClick={invite} className="btn btn-primary flex-1">Taklif yuborish</button>
        </div>
      </div>
    </div>
  );
};

// ─── Join Modal ────────────────────────────────────────────────────────────
const JoinModal = ({ onClose, onSave }) => {
  const [code, setCode] = useState('');

  const join = async () => {
    if (!code.trim()) return toast.error('Kod kerak');
    try {
      const { data } = await api.post('/business/join/code', { invite_code: code.toUpperCase() });
      toast.success(`"${data.business.name}" ga qo'shildingiz!`);
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Noto\'g\'ri kod');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Biznesga kirish</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div>
          <label className="label">Taklif kodi</label>
          <input className="input text-center font-mono text-xl tracking-widest uppercase"
            placeholder="XXXXXXXXXX" value={code}
            onChange={e => setCode(e.target.value)} />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Bekor</button>
          <button onClick={join} className="btn btn-primary flex-1">Kirish</button>
        </div>
      </div>
    </div>
  );
};

// ─── Transaction Modal ─────────────────────────────────────────────────────
const TxModal = ({ biz, projects, onClose, onSave, initial }) => {
  const [form, setForm] = useState({
    type: initial?.type || 'income',
    amount: initial?.amount || '',
    currency: initial?.currency || biz.currency || 'UZS',
    description: initial?.description || '',
    category: initial?.category || '',
    project_id: initial?.project_id || '',
    date: initial?.date?.slice(0,10) || new Date().toISOString().slice(0,10),
  });

  const save = async () => {
    if (!form.amount) return toast.error('Miqdor kerak');
    try {
      if (initial) {
        await api.put(`/business/${biz.id}/transactions/${initial.id}`, form);
      } else {
        await api.post(`/business/${biz.id}/transactions`, form);
      }
      toast.success('Saqlandi');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    }
  };

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">{initial ? 'Tahrirlash' : 'Yangi tranzaksiya'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
          {['income','expense'].map(tp => (
            <button key={tp}
              onClick={() => setForm({ ...form, type: tp, category: '' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                form.type === tp
                  ? tp === 'income' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
              {tp === 'income' ? '⬆️ Daromad' : '⬇️ Xarajat'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Miqdor *</label>
              <input type="number" className="input" placeholder="0" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Valyuta</label>
              <select className="input" value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}>
                {['UZS','USD','EUR','RUB'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tavsif</label>
            <input className="input" placeholder="Nima uchun..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kategoriya</label>
              <select className="input" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Tanlang...</option>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Loyiha</label>
              <select className="input" value={form.project_id}
                onChange={e => setForm({ ...form, project_id: e.target.value })}>
                <option value="">—</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Sana</label>
            <input type="date" className="input" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Bekor</button>
          <button onClick={save} className="btn btn-primary flex-1">Saqlash</button>
        </div>
      </div>
    </div>
  );
};

// ─── Project Modal ─────────────────────────────────────────────────────────
const ProjectModal = ({ biz, onClose, onSave, initial }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    client_name: initial?.client_name || '',
    description: initial?.description || '',
    budget: initial?.budget || '',
    currency: initial?.currency || biz.currency || 'UZS',
    start_date: initial?.start_date?.slice(0,10) || '',
    end_date: initial?.end_date?.slice(0,10) || '',
    status: initial?.status || 'active',
    color: initial?.color || '#3B82F6',
  });

  const save = async () => {
    if (!form.name.trim()) return toast.error('Nomi kerak');
    try {
      if (initial) {
        await api.put(`/business/${biz.id}/projects/${initial.id}`, form);
      } else {
        await api.post(`/business/${biz.id}/projects`, form);
      }
      toast.success('Saqlandi');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">{initial ? 'Loyihani tahrirlash' : 'Yangi loyiha'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Loyiha nomi *</label>
            <input className="input" placeholder="SMM xizmati..." value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Mijoz</label>
            <input className="input" placeholder="Kompaniya nomi..." value={form.client_name}
              onChange={e => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Byudjet</label>
              <input type="number" className="input" placeholder="0" value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <label className="label">Valyuta</label>
              <select className="input" value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}>
                {['UZS','USD','EUR','RUB'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Boshlanish</label>
              <input type="date" className="input" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Tugash</label>
              <input type="date" className="input" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Holat</label>
              <select className="input" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Faol</option>
                <option value="completed">Tugagan</option>
                <option value="paused">To'xtatilgan</option>
              </select>
            </div>
            <div>
              <label className="label">Rang</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Bekor</button>
          <button onClick={save} className="btn btn-primary flex-1">Saqlash</button>
        </div>
      </div>
    </div>
  );
};

// ─── Distribute Modal ──────────────────────────────────────────────────────
const DistributeModal = ({ biz, onClose, onSave }) => {
  const now = new Date();
  const [form, setForm] = useState({
    period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10),
    period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10),
    note: '',
  });

  const distribute = async () => {
    try {
      await api.post(`/business/${biz.id}/distribute`, form);
      toast.success('Foyda taqsimlandi!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Foydani taqsimlash</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Davr boshlanishi</label>
            <input type="date" className="input" value={form.period_start}
              onChange={e => setForm({ ...form, period_start: e.target.value })} />
          </div>
          <div>
            <label className="label">Davr tugashi</label>
            <input type="date" className="input" value={form.period_end}
              onChange={e => setForm({ ...form, period_end: e.target.value })} />
          </div>
          <div>
            <label className="label">Izoh</label>
            <input className="input" placeholder="Oy yakuni..." value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary flex-1">Bekor</button>
          <button onClick={distribute} className="btn btn-primary flex-1">Hisoblash</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  BUSINESS DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════
const BusinessDetail = ({ biz, currentUserId, onBack, onRefresh }) => {
  const [tab, setTab] = useState('overview');
  const [detail, setDetail] = useState(null);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txSummary, setTxSummary] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'invite'|'tx'|'project'|'distribute'|'editBiz'
  const [editTx, setEditTx] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const [txFilter, setTxFilter] = useState('all');

  const isOwner = biz.role === 'owner';

  const load = async () => {
    setLoading(true);
    try {
      const [detRes, projRes, txRes, distRes] = await Promise.all([
        api.get(`/business/${biz.id}`),
        api.get(`/business/${biz.id}/projects`),
        api.get(`/business/${biz.id}/transactions`),
        api.get(`/business/${biz.id}/distributions`),
      ]);
      setDetail(detRes.data);
      setProjects(projRes.data.projects || []);
      setTransactions(txRes.data.transactions || []);
      setTxSummary(txRes.data.summary);
      setDistributions(distRes.data.distributions || []);
    } catch {
      toast.error('Ma\'lumot yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [biz.id]);

  const deleteTx = async (id) => {
    if (!confirm('O\'chirilsinmi?')) return;
    await api.delete(`/business/${biz.id}/transactions/${id}`);
    toast.success('O\'chirildi');
    load();
  };

  const deleteProj = async (id) => {
    if (!confirm('Loyiha o\'chirilsinmi?')) return;
    await api.delete(`/business/${biz.id}/projects/${id}`);
    toast.success('O\'chirildi');
    load();
  };

  const markPaid = async (distId, userId, paid) => {
    await api.put(`/business/${biz.id}/distributions/${distId}/shares/${userId}/paid`, { paid });
    load();
  };

  const stats = detail?.stats;
  const balance = parseFloat(stats?.balance || 0);
  const currency = biz.currency || 'UZS';

  const filteredTx = txFilter === 'all' ? transactions
    : transactions.filter(t => t.type === txFilter);

  const TABS = [
    { id: 'overview', label: 'Umumiy', icon: BarChart3 },
    { id: 'projects', label: 'Loyihalar', icon: FolderOpen },
    { id: 'transactions', label: 'Tranzaksiyalar', icon: ArrowLeftRight },
    { id: 'members', label: 'Sheriklar', icon: Users },
    { id: 'distribution', label: 'Taqsimlash', icon: PieChart },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ChevronDown size={20} className="rotate-90" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{biz.name}</h2>
          {biz.description && <p className="text-sm text-gray-500">{biz.description}</p>}
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <button onClick={() => setModal('invite')}
              className="btn btn-secondary flex items-center gap-2 text-sm">
              <UserPlus size={16} /> Taklif
            </button>
          )}
          <button onClick={() => setModal('tx')}
            className="btn btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Tranzaksiya
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <TrendingUp className="mx-auto text-green-500 mb-1" size={22} />
          <p className="text-xs text-gray-500">Daromad</p>
          <p className="font-bold text-green-600 text-sm">{fmt(stats?.total_income, currency)}</p>
        </div>
        <div className="card text-center py-4">
          <TrendingDown className="mx-auto text-red-500 mb-1" size={22} />
          <p className="text-xs text-gray-500">Xarajat</p>
          <p className="font-bold text-red-600 text-sm">{fmt(stats?.total_expense, currency)}</p>
        </div>
        <div className={`card text-center py-4 ${balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          <Wallet className={`mx-auto mb-1 ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} size={22} />
          <p className="text-xs text-gray-500">Balans</p>
          <p className={`font-bold text-sm ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{fmt(balance, currency)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Per-member balances */}
          <div className="card">
            <h3 className="font-semibold mb-3">Sheriklar ulushi</h3>
            <div className="space-y-2">
              {detail?.members?.filter(m => m.status === 'active').map(m => {
                const share = parseFloat(m.profit_share);
                const myAmount = balance * share / 100;
                return (
                  <div key={m.user_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      {m.role === 'owner' ? <Crown size={16} className="text-yellow-500" /> : <User size={16} className="text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{m.full_name} {m.user_id === currentUserId && <span className="text-xs text-blue-500">(Siz)</span>}</p>
                      <p className="text-xs text-gray-500">{m.profit_share}% ulush</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${myAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(myAmount, currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">So'nggi tranzaksiyalar</h3>
              <button onClick={() => setTab('transactions')} className="text-sm text-blue-600">Hammasi →</button>
            </div>
            {transactions.slice(0,5).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b dark:border-gray-700 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {tx.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description || tx.category || '—'}</p>
                  <p className="text-xs text-gray-500">{tx.added_by_name} · {tx.date?.slice(0,10)}</p>
                </div>
                <p className={`font-semibold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, tx.currency)}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-6">Tranzaksiyalar yo'q</p>
            )}
          </div>
        </div>
      )}

      {/* ── PROJECTS ── */}
      {tab === 'projects' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => { setEditProj(null); setModal('project'); }}
              className="btn btn-primary flex items-center gap-2">
              <Plus size={16} /> Loyiha qo'shish
            </button>
          </div>
          {projects.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-3 h-10 rounded-full mt-0.5" style={{ backgroundColor: p.color }} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.client_name && <p className="text-xs text-gray-500">{p.client_name}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : p.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {p.status === 'active' ? 'Faol' : p.status === 'completed' ? 'Tugagan' : 'To\'xtatilgan'}
                      </span>
                      <button onClick={() => { setEditProj(p); setModal('project'); }}
                        className="p-1 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => deleteProj(p.id)}
                        className="p-1 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Byudjet</p>
                      <p className="text-sm font-medium">{fmt(p.budget, p.currency)}</p>
                    </div>
                    <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Tushgan</p>
                      <p className="text-sm font-medium text-green-600">{fmt(p.earned, p.currency)}</p>
                    </div>
                    <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Sarflangan</p>
                      <p className="text-sm font-medium text-red-600">{fmt(p.spent, p.currency)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="card text-center py-12 text-gray-500">
              <FolderOpen className="mx-auto mb-2 opacity-40" size={36} />
              <p>Loyihalar yo'q. Birinchisini qo'shing!</p>
            </div>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {tab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            {/* Filter */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {[['all','Hammasi'],['income','Daromad'],['expense','Xarajat']].map(([v,l]) => (
                <button key={v} onClick={() => setTxFilter(v)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${txFilter === v ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => { setEditTx(null); setModal('tx'); }}
              className="btn btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Qo'shish
            </button>
          </div>

          {filteredTx.map(tx => (
            <div key={tx.id} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                tx.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
              }`}>
                {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{tx.description || tx.category || '—'}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {tx.category && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{tx.category}</span>}
                  {tx.project_name && <span className="text-xs px-2 py-0.5 rounded-full text-white text-opacity-90" style={{ backgroundColor: tx.project_color || '#6B7280' }}>{tx.project_name}</span>}
                  <span className="text-xs text-gray-500">{tx.added_by_name} · {tx.date?.slice(0,10)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, tx.currency)}
                </p>
                <button onClick={() => { setEditTx(tx); setModal('tx'); }}
                  className="p-1 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => deleteTx(tx.id)}
                  className="p-1 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {filteredTx.length === 0 && (
            <div className="card text-center py-12 text-gray-500">
              <ArrowLeftRight className="mx-auto mb-2 opacity-40" size={36} />
              <p>Tranzaksiyalar yo'q</p>
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERS ── */}
      {tab === 'members' && (
        <div className="space-y-3">
          {isOwner && (
            <div className="flex justify-end">
              <button onClick={() => setModal('invite')}
                className="btn btn-primary flex items-center gap-2">
                <UserPlus size={16} /> Sherik taklif qilish
              </button>
            </div>
          )}
          {detail?.members?.map(m => (
            <div key={m.id} className="card flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {m.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{m.full_name}</p>
                  {m.user_id === currentUserId && <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">Siz</span>}
                  {m.role === 'owner' && <Crown size={14} className="text-yellow-500" />}
                </div>
                <p className="text-sm text-gray-500">{m.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {m.status === 'active' ? `${m.profit_share}% ulush` : m.status === 'pending' ? '⏳ Kutilmoqda' : 'Chiqib ketgan'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.status === 'active' && isOwner && m.user_id !== currentUserId && (
                  <button onClick={async () => {
                    const share = prompt('Yangi ulush foizi:', m.profit_share);
                    if (!share) return;
                    await api.put(`/business/${biz.id}/members/${m.user_id}/share`, { profit_share: share });
                    toast.success('Yangilandi'); load();
                  }} className="p-1.5 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                )}
                {m.status === 'active' && m.user_id === currentUserId && !isOwner && (
                  <button onClick={async () => {
                    if (!confirm('Biznesdan chiqmoqchimisiz?')) return;
                    await api.delete(`/business/${biz.id}/members/${m.user_id}`);
                    toast.success('Chiqib ketdingiz'); onBack(); onRefresh();
                  }} className="text-red-500 text-sm hover:text-red-700">Chiqish</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DISTRIBUTION ── */}
      {tab === 'distribution' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setModal('distribute')}
              className="btn btn-primary flex items-center gap-2">
              <PieChart size={16} /> Foydani taqsimlash
            </button>
          </div>
          {distributions.map(d => (
            <div key={d.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">{d.period_start?.slice(0,7)} → {d.period_end?.slice(0,7)}</p>
                  {d.note && <p className="text-sm text-gray-500">{d.note}</p>}
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${parseFloat(d.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(d.net_profit, d.currency)}
                  </p>
                  <p className="text-xs text-gray-500">Sof foyda</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Daromad</p>
                  <p className="font-medium text-green-600">{fmt(d.total_income, d.currency)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Xarajat</p>
                  <p className="font-medium text-red-600">{fmt(d.total_expense, d.currency)}</p>
                </div>
              </div>
              <div className="space-y-2">
                {d.shares?.filter(Boolean).map(s => s && (
                  <div key={s.user_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{s.full_name}</p>
                      <p className="text-xs text-gray-500">{s.profit_share}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${parseFloat(s.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(s.amount, d.currency)}
                      </p>
                      {isOwner && (
                        <button onClick={() => markPaid(d.id, s.user_id, !s.paid)}
                          className={`p-1.5 rounded-full transition-colors ${s.paid ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {!isOwner && s.paid && <CheckCircle size={14} className="text-green-600" />}
                      {!isOwner && !s.paid && <Clock size={14} className="text-gray-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {distributions.length === 0 && (
            <div className="card text-center py-12 text-gray-500">
              <PieChart className="mx-auto mb-2 opacity-40" size={36} />
              <p>Hali taqsimlash qilinmagan</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal === 'invite' && <InviteModal biz={biz} onClose={() => setModal(null)} onSave={load} />}
      {modal === 'tx' && <TxModal biz={biz} projects={projects} onClose={() => { setModal(null); setEditTx(null); }} onSave={load} initial={editTx} />}
      {modal === 'project' && <ProjectModal biz={biz} onClose={() => { setModal(null); setEditProj(null); }} onSave={load} initial={editProj} />}
      {modal === 'distribute' && <DistributeModal biz={biz} onClose={() => setModal(null)} onSave={load} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN BUSINESS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const Business = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create'|'join'
  const [selected, setSelected] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bizRes, profileRes] = await Promise.all([
        api.get('/business'),
        api.get('/profile'),
      ]);
      setBusinesses(bizRes.data.businesses || []);
      setCurrentUserId(profileRes.data.id || profileRes.data.user?.id);
    } catch {
      toast.error('Yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Handle pending invitations
  const pending = businesses.filter(b => b.status === 'pending');

  const respond = async (biz, action) => {
    try {
      await api.post(`/business/${biz.id}/respond`, { action });
      toast.success(action === 'accept' ? 'Qabul qilindi!' : 'Rad etildi');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik');
    }
  };

  if (selected) {
    return (
      <BusinessDetail
        biz={selected}
        currentUserId={currentUserId}
        onBack={() => setSelected(null)}
        onRefresh={load}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Biznes</h1>
          <p className="text-gray-500 text-sm mt-1">Sheriklik hisoblari va loyihalar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('join')}
            className="btn btn-secondary flex items-center gap-2">
            <LogIn size={18} /> Kirish
          </button>
          <button onClick={() => setModal('create')}
            className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Yaratish
          </button>
        </div>
      </div>

      {/* Pending Invitations */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" /> Taklif kutilmoqda
          </h2>
          {pending.map(b => (
            <div key={b.id} className="card border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Building2 size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-sm text-gray-500">{b.profit_share}% ulush taklif qilingan</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(b, 'decline')}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Rad
                  </button>
                  <button onClick={() => respond(b, 'accept')}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                    Qabul
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Business list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : businesses.filter(b => b.status === 'active').length === 0 ? (
        <div className="card text-center py-16">
          <Building2 className="mx-auto mb-3 opacity-30" size={48} />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1">Biznes hisobi yo'q</p>
          <p className="text-gray-500 mb-6">Sheriklik biznesini yarating yoki taklifni qabul qiling</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setModal('join')} className="btn btn-secondary flex items-center gap-2">
              <LogIn size={18} /> Koddan kirish
            </button>
            <button onClick={() => setModal('create')} className="btn btn-primary flex items-center gap-2">
              <Plus size={18} /> Biznes yaratish
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {businesses.filter(b => b.status === 'active').map(b => (
            <button key={b.id} onClick={() => setSelected(b)}
              className="card text-left hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Building2 size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{b.name}</h3>
                    {b.role === 'owner' && <Crown size={13} className="text-yellow-500 flex-shrink-0" />}
                  </div>
                  {b.description && <p className="text-sm text-gray-500 truncate">{b.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users size={12} /> {b.member_count} a'zo
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {b.profit_share}% ulush
                    </span>
                    <span className="text-xs text-gray-400">{b.currency}</span>
                  </div>
                </div>
                <ChevronDown size={18} className="text-gray-400 -rotate-90 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'create' && <BizModal onClose={() => setModal(null)} onSave={load} />}
      {modal === 'join' && <JoinModal onClose={() => setModal(null)} onSave={load} />}
    </div>
  );
};

export default Business;
