import React, { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

type Tab = 'login' | 'register';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuthStore(
    useShallow((s) => ({
      isAuthModalOpen: s.isAuthModalOpen,
      closeAuthModal: s.closeAuthModal,
      login: s.login,
      register: s.register,
    })),
  );

  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
  }, []);

  const handleTabChange = useCallback(
    (next: Tab) => {
      setTab(next);
      resetForm();
    },
    [resetForm],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !email.includes('@')) {
        setError('Lütfen geçerli bir e-posta adresi girin.');
        return;
      }
      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.');
        return;
      }

      setLoading(true);
      try {
        if (tab === 'login') {
          await login(email.trim(), password);
        } else {
          if (!name.trim()) {
            setError('Lütfen adınızı girin.');
            setLoading(false);
            return;
          }
          await register(name.trim(), email.trim(), password);
        }
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir şeyler yanlış gitti.');
      } finally {
        setLoading(false);
      }
    },
    [tab, name, email, password, login, register, resetForm],
  );

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAuthModal}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
      >
        <button
          onClick={closeAuthModal}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-bold text-slate-900">Flowchart.</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none mb-2">
            {tab === 'login' ? 'Hoş Geldiniz.' : 'Hesap Oluştur.'}
          </h2>
          <p className="text-slate-500 font-medium lowercase">
            {tab === 'login'
              ? 'Diyagramlarınıza erişmek için giriş yapın.'
              : 'Diyagramlarınızı buluta kaydetmek için kaydolun.'}
          </p>
        </div>

        <div className="px-8 flex border-b border-slate-100">
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${
              tab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Giriş
          </button>
          <button
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${
              tab === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {tab === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative group"
                >
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Ad Soyad</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required={tab === 'register'}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                    />
                    <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="relative group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
            </div>

            <div className="relative group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Şifre</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                {tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={closeAuthModal}
            className="w-full py-2 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
          >
            Kayıt Olmadan Devam Et
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default React.memo(AuthModal);
