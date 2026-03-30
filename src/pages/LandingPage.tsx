import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  ArrowRight, 
  Users, 
  Zap, 
  Globe, 
  Layout, 
  MousePointer2, 
  Share2, 
  Layers,
  Sparkles,
  Play,
  Shield,
  Clock,
  Component,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  MoreHorizontal,
  MessageCircle
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import AuthModal from '../components/AuthModal';


// --- Reusable Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-6 py-3 rounded-full font-semibold inline-flex items-center gap-2 relative overflow-hidden group";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
    secondary: "bg-slate-900 text-white",
    outline: "border-2 border-slate-200 text-slate-900 hover:border-slate-800",
    ghost: "text-slate-600 hover:bg-slate-100",
    white: "bg-white text-slate-900 shadow-xl",
  };
  return (
    <motion.button 
      whileHover={{ 
        scale: 1.05, 
        y: -4,
        boxShadow: variant === 'primary' ? "0 20px 40px rgba(37, 99, 235, 0.4)" : "0 20px 40px rgba(0,0,0,0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants[variant]} ${className}`} 
      {...props}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300" />
      {/* Shine effect on hover */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      {children}
    </motion.button>
  );
};

const Reveal = ({ children, delay = 0, y = 30, x = 0 }: { children: React.ReactNode, delay?: number, y?: number, x?: number }) => (
  <motion.div
    initial={{ opacity: 0, y, x }}
    whileInView={{ opacity: 1, y: 0, x: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

const Float = ({ children, duration = 4, delay = 0, y = 15, x = 0, rotate = 0 }: { children: React.ReactNode, duration?: number, delay?: number, y?: number, x?: number, rotate?: number }) => (
  <motion.div
    animate={{ y: [0, -y, 0], x: [0, x, 0], rotate: [0, rotate, 0] }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
  >
    {children}
  </motion.div>
);

const CollaborativeCursor = ({ name, color, x, y, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, left: `calc(${x} - 20px)`, top: `calc(${y} - 20px)` }}
    whileInView={{ opacity: 1, left: x, top: y }}
    viewport={{ once: true }}
    transition={{ duration: 1, delay, ease: "easeOut" }}
    className="absolute z-50 pointer-events-none"
  >
    <MousePointer2 className={`${color} fill-current rotate-[-15deg] drop-shadow-md`} size={24} />
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: delay + 0.5 }}
      className={`${color.replace('text-', 'bg-')} text-white text-[10px] font-bold px-2 py-0.5 rounded-full rounded-tl-none ml-4 -mt-1 shadow-lg whitespace-nowrap`}
    >
      {name}
    </motion.div>
  </motion.div>
);

const StickyNote = ({ color, text, author, x, y, rotate = 0, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, rotate: rotate - 10 }}
    whileInView={{ opacity: 1, scale: 1, rotate }}
    viewport={{ once: true }}
    transition={{ type: "spring", damping: 12, delay }}
    style={{ left: x, top: y }}
    className={`absolute w-32 h-32 ${color} p-4 shadow-xl flex flex-col justify-between cursor-default group hover:scale-110 transition-transform z-10`}
  >
    <p className="text-xs font-medium text-slate-800 leading-tight">{text}</p>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{author}</span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <MessageCircle size={10} className="text-slate-400" />
      </div>
    </div>
  </motion.div>
);

const FloatingToolbar = ({ activeIndex = 0 }: { activeIndex?: number }) => (
  <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-2 rounded-2xl shadow-2xl flex flex-col gap-2 z-40">
    {[
      { icon: MousePointer2, id: 0 },
      { icon: Square, id: 1 },
      { icon: Circle, id: 2 },
      { icon: Type, id: 3 },
      { icon: ImageIcon, id: 4 },
      { icon: Layers, id: 5 },
      { icon: MoreHorizontal, id: 6 },
    ].map((item, i) => (
      <motion.button 
        key={i} 
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.9 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeIndex === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 translate-x-1' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <item.icon size={20} />
      </motion.button>
    ))}
  </div>
);

const LiveProductPreview = () => {
  return (
    <div className="relative w-full aspect-[16/10] lg:aspect-[16/9] bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-200 shadow-[0_40px_80px_rgba(0,0,0,0.1)] overflow-hidden group/canvas">
      {/* Canvas Dot Grid */}
      <motion.div 
        animate={{ 
          backgroundPosition: ["0px 0px", "32px 32px"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-[0.4] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:32px_32px]" 
      />

      {/* Toolbar Layer */}
      <div className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30">
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <FloatingToolbar activeIndex={0} />
        </motion.div>
      </div>

      {/* Properties Panel Layer */}
      <div className="absolute right-4 lg:right-8 top-8 z-30 hidden md:block">
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 1 }}
           className="bg-white/95 backdrop-blur-md border border-slate-200 p-5 rounded-3xl shadow-2xl w-64"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Düzenle: Akış_01</span>
            <div className="flex gap-1.5">
               <div className="w-2 h-2 rounded-full bg-slate-200" />
               <div className="w-2 h-2 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-3 tracking-tighter">Arkaplan Rengi</div>
              <div className="flex gap-2">
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} className="w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/20 cursor-pointer" />
                 <div className="w-8 h-8 rounded-lg bg-slate-100" />
                 <div className="w-8 h-8 rounded-lg bg-slate-100" />
                 <div className="w-8 h-8 rounded-lg bg-slate-100" />
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-3 tracking-tighter">Metin Hizalama</div>
              <div className="grid grid-cols-3 gap-2">
                 <div className="h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><Layout size={14} /></div>
                 <div className="h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100"><Layout size={14} /></div>
                 <div className="h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><Layout size={14} /></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Animated Elements Canvas */}
      <div className="absolute inset-0 m-20 lg:m-32">
        {/* Connection Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-500/40 stroke-[4] fill-none">
          <motion.path 
            d="M 100 100 C 200 100, 200 300, 300 300" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 1],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              times: [0, 0.4, 0.8, 1],
              ease: "easeInOut"
            }}
          />
          {/* Animated Glow on path */}
          <motion.path 
            d="M 100 100 C 200 100, 200 300, 300 300" 
            className="stroke-blue-400/20 stroke-[12] blur-md"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 1],
              opacity: [0, 0.5, 0.5, 0],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              times: [0, 0.4, 0.8, 1],
              ease: "easeInOut"
            }}
          />
        </svg>

        {/* Node 1: Start (Static reference) */}
        <motion.div 
          initial={{ x: 50, y: 50 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute w-32 h-20 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shadow-xl z-10"
        >
          <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">BAŞLAT</span>
          <div className="absolute -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
        </motion.div>

        {/* Node 2: Dragging Process Node */}
        <motion.div 
          animate={{ 
            x: [400, 450, 400],
            y: [200, 250, 200],
            rotate: [0, 2, 0],
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute w-48 h-28 bg-blue-600 border-2 border-blue-700 rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(37,99,235,0.3)] z-20"
        >
          <div className="text-white text-center">
            <div className="text-[10px] font-bold uppercase opacity-60 mb-1">PROSES_02</div>
            <div className="text-sm font-bold">Kullanıcı Doğrulama</div>
          </div>
          {/* Handles */}
          <div className="absolute -left-1 w-4 h-4 bg-white rounded-full border-2 border-blue-500 shadow-sm" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-500 shadow-sm" />
        </motion.div>

        {/* Node 3: Micro Animation Dropdown */}
        <motion.div 
          initial={{ x: 100, y: 350, opacity: 0 }}
          animate={{ opacity: 1, y: 330 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute w-40 h-16 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-center shadow-lg z-10"
        >
          <span className="text-emerald-700 font-bold text-xs uppercase tracking-widest">Onaylandı</span>
          <Sparkles className="absolute -top-2 -right-2 text-emerald-500" size={16} />
        </motion.div>
      </div>

      {/* The Master Cursor - The character doing the work */}
      <motion.div 
        animate={{ 
          x: [100, 420, 420, 800, 100],
          y: [100, 220, 220, 100, 100],
          scale: [1, 1, 0.9, 1, 1],
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut",
          times: [0, 0.3, 0.4, 0.7, 1]
        }}
        className="absolute z-50 pointer-events-none drop-shadow-2xl"
      >
        <MousePointer2 className="text-blue-600 fill-blue-600 rotate-[-15deg] stroke-[3]" size={32} />
        <motion.div 
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 10, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
          className="ml-6 py-1 px-3 bg-blue-600 text-white text-[10px] font-black rounded-full rounded-tl-none uppercase tracking-widest shadow-lg"
        >
          Sen (Düzenliyor)
        </motion.div>
      </motion.div>

      {/* Collaboration Indicator Floating */}
      <div className="absolute bottom-8 right-8 z-30">
        <Reveal delay={1.5}>
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="flex -space-x-3">
               <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900" />
               <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-slate-900" />
               <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-slate-900" />
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">12 Aktif Kişi</span>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

const AnimatedCounter = ({ value, suffix = "", duration = 2 }: { value: number, suffix?: string, duration?: number }) => {
  const [count, setCount] = useState(0);
  const nodeRef = React.useRef(null);
  const isInView = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      let totalMiliseconds = duration * 1000;
      let incrementTime = (totalMiliseconds / end);
      
      // For large numbers, adjust increment to be faster
      let step = 1;
      if (end > 1000) {
        step = Math.ceil(end / 100);
        incrementTime = duration * 10;
      }

      let timer = setInterval(() => {
        start += step;
        setCount(start);
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={nodeRef}>{count.toLocaleString()}{suffix}</span>;
};

const SectionHeading = ({ title, subtitle, centered = true, dark = false, highlightWord }: { title: string, subtitle: string, centered?: boolean, dark?: boolean, highlightWord?: string }) => {
  const words = title.split(' ');
  return (
    <div className={`mb-12 md:mb-16 ${centered ? 'text-center' : ''}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50/50 text-blue-600 text-[10px] font-black tracking-[0.25em] uppercase border border-blue-100/50"
      >
        Platform Özellikleri
      </motion.div>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`text-4xl md:text-6xl font-black mb-6 tracking-tight leading-[1.05] ${dark ? 'text-white' : 'text-slate-900'}`}
      >
        {words.map((word, i) => (
          <span key={i} className={word === highlightWord ? "bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600" : ""}>
            {word}{" "}
          </span>
        ))}
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${dark ? 'text-slate-400/80' : 'text-slate-500/90 font-medium'}`}
      >
        {subtitle}
      </motion.p>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, gradient, delay }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -15, scale: 1.02 }}
      className="relative group h-full cursor-default"
    >
      {/* Outer Glow on hover */}
      <div className={`absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500`} />
      
      {/* Animated Border Beam */}
      <div className={`absolute inset-0 rounded-[2.5rem] p-[1px] bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden`}>
         <div className="absolute inset-0 bg-white rounded-[2.5rem]" />
      </div>

      <div className="relative h-full bg-gradient-to-b from-white to-slate-50/50 border border-slate-100 p-10 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden">
        {/* Decorative corner accent */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-15 blur-3xl transition-opacity duration-700`} />
        
        {/* Icon Container with levitation */}
        <div className="relative mb-10">
           <motion.div 
             animate={{ y: [0, -5, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() }}
             className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-all duration-500`}
           >
             <Icon size={32} strokeWidth={1.5} />
           </motion.div>
           
           <div className={`absolute -inset-3 rounded-[2rem] border-2 border-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 scale-75 group-hover:scale-100 transition-all duration-500`} />
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        
        <p className="text-slate-500/80 text-[17px] leading-relaxed font-medium mb-8">
          {desc}
        </p>

        {/* Action link */}
        <div className="flex items-center gap-2 text-blue-600 font-black text-xs tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 transition-all duration-300">
           Sistemi Keşfet <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialCard = ({ quote, author, role, avatar, delay }: any) => (
  <Reveal delay={delay}>
    <motion.div 
      whileHover={{ y: -15, scale: 1.02 }}
      className="p-10 bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 relative group h-full flex flex-col"
    >
      {/* Premium Glow */}
      <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500" />
      
      <div className="absolute top-8 left-8 text-7xl text-slate-100 group-hover:text-blue-100 transition-colors pointer-events-none select-none font-serif leading-none italic opacity-50">“</div>
      
      <p className="text-lg text-slate-700 font-medium leading-relaxed relative z-10 italic mb-10 flex-1">
        "{quote}"
      </p>
      
      <div className="flex items-center gap-5 border-t border-slate-100 pt-8 relative z-10">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className={`w-14 h-14 rounded-2xl ${avatar} flex-shrink-0 shadow-lg border-2 border-white`} 
        />
        <div>
          <div className="font-black text-slate-900 uppercase text-xs tracking-widest mb-1">{author}</div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{role}</div>
        </div>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="flex gap-0.5">
             {[1,2,3,4,5].map(i => <Sparkles key={i} size={10} className="text-amber-400 fill-amber-400" />)}
           </div>
        </div>
      </div>
    </motion.div>
  </Reveal>
);

const CTASection = ({ title, subtitle, buttonText, onButtonClick, colors = "from-blue-600 via-indigo-600 to-purple-600", dark = true, delay = 0, className = "" }: any) => (
  <section className={`py-20 lg:py-24 relative overflow-hidden ${dark ? 'text-white' : 'text-slate-900'} ${!dark ? 'bg-slate-50 border-y border-slate-100' : ''} ${className}`}>
    {/* Complex Layered Background */}
    {dark && (
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${colors}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.3)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.2)_0%,transparent_50%)]" />
        <div className="noise-texture absolute inset-0" />
      </div>
    )}
    
    {!dark && <div className="noise-texture absolute inset-0 opacity-[0.02]" />}
    <div className="absolute inset-0 opacity-20 pointer-events-none">
       <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] ${dark ? 'bg-white' : 'bg-blue-400'} rounded-full blur-[120px]`} />
       <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] ${dark ? 'bg-white' : 'bg-purple-400'} rounded-full blur-[120px]`} />
    </div>

    <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
      >
        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase leading-[0.95] drop-shadow-sm">
          {title}
        </h2>
        <p className={`text-lg mb-10 max-w-xl mx-auto font-medium ${dark ? 'text-blue-100/70' : 'text-slate-500/90'}`}>
          {subtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Button 
            variant={dark ? "white" : "primary"} 
            className="px-12 py-5 text-xl font-black uppercase shadow-2xl"
            onClick={onButtonClick}
          >
            {buttonText} <ArrowRight size={24} />
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

// --- Sections ---

const Navbar = ({ scrolled, onOpenAuth }: any) => {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform-gpu ${
      scrolled 
        ? 'bg-white/80 backdrop-blur-xl py-3 border-b border-slate-200/60 shadow-sm' 
        : 'bg-white/0 py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">

      <div className="flex items-center gap-10">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl group-hover:rotate-12 transition-transform">
            <Layout size={26} />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">Flowchart.</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {['Ürün', 'Çözümler', 'Şablonlar', 'Fiyatlandırma'].map((item) => (
            <a key={item} href="#" className="font-medium text-slate-600 hover:text-blue-600 transition-colors uppercase text-xs tracking-widest">{item}</a>
          ))}
        </div>
      </div>
        <div className="flex items-center gap-4">
          <button onClick={onOpenAuth} className="font-semibold text-slate-900 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">Giriş Yap</button>
          <Button onClick={onOpenAuth} className="py-2.5">Kaydol</Button>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onOpenAuth }: any) => {
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], [0, 200]);
  const yContent = useTransform(scrollY, [0, 1000], [0, -100]);
  const rotateHero = useTransform(scrollY, [0, 1000], [0, 5]);

  return (
    <section className="relative pt-24 lg:pt-36 pb-20 overflow-hidden bg-white min-h-[85vh] flex items-center">
      {/* Canvas Dot Grid Background - with Parallax */}
      <motion.div 
        style={{ y: yBg }}
        className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:32px_32px]" 
      />
      
      {/* Immersive Floating Elements - Ambient motion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <Float duration={6} y={40} x={20}>
          <CollaborativeCursor name="Sarah" color="text-purple-500" x="15%" y="25%" delay={1} />
        </Float>
        <Float duration={8} y={-30} x={-10} delay={1}>
          <CollaborativeCursor name="Mike" color="text-emerald-500" x="80%" y="40%" delay={1.5} />
        </Float>
        <Float duration={5} y={20} x={30} delay={0.5}>
          <CollaborativeCursor name="Alex (Sen)" color="text-blue-500" x="30%" y="70%" delay={0.5} />
        </Float>

        <Float duration={10} y={15} rotate={-2}>
          <StickyNote color="bg-amber-100" text="Harika bir fikir! Bunu detaylandıralım." author="Sarah" x="10%" y="60%" rotate={-5} delay={1.2} />
        </Float>
        <Float duration={12} y={-15} rotate={2} delay={2}>
          <StickyNote color="bg-blue-100" text="Protokolleri buraya ekledim." author="Mike" x="85%" y="20%" rotate={3} delay={1.8} />
        </Float>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
        <motion.div style={{ y: yContent }} className="max-w-4xl mx-auto text-center mb-12 lg:mb-20">
          <Reveal delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs sm:text-sm font-bold mb-8 shadow-sm border border-blue-100/50">
              <Sparkles size={16} className="text-blue-500" />
              <span>YENİ: Gerçek Zamanlı İşbirliği 2.0</span>
            </div>
          </Reveal>
          
          <Reveal delay={0.2} y={50}>
            <h1 className="text-6xl sm:text-8xl lg:text-[10rem] font-black text-slate-900 leading-[0.85] mb-12 tracking-tighter uppercase relative">
              Birlikte <br />
              <motion.span 
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] drop-shadow-[0_10px_10px_rgba(59,130,246,0.1)]"
              >
                Görselleştirin.
              </motion.span>
              <div className="noise-texture absolute inset-0 mix-blend-soft-light opacity-[0.05]" />
            </h1>
          </Reveal>

          <Reveal delay={0.3}>
            <p className="text-xl sm:text-2xl lg:text-3xl text-slate-500/90 max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
              Ekipleriniz için sınırsız bir tuval. İş akışlarınızı, fikirlerinizi ve süreçlerinizi Miro esnekliğinde tasarlayın.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Button variant="primary" className="px-14 py-7 text-2xl font-black rounded-[2rem] shadow-2xl shadow-blue-500/30" onClick={onOpenAuth}>
                Hemen Başlayın <ArrowRight size={28} />
              </Button>
              <Button variant="outline" className="px-12 py-7 text-xl font-bold rounded-[2rem] border-slate-200 hover:bg-slate-50">
                <Play size={24} fill="currentColor" /> Demoyu İzle
              </Button>
            </div>
          </Reveal>
        </motion.div>

        {/* Live Product Preview Component replaces the static image visual */}
        <div className="relative max-w-6xl mx-auto perspective-1000">
          <Reveal delay={0.6} y={100}>
            <motion.div 
               style={{ rotateX: rotateHero }}
               className="w-full"
            >
              <LiveProductPreview />
            </motion.div>
          </Reveal>
          
          {/* Reflective shadow - enhanced */}
          <div className="absolute top-[80%] left-1/2 -translate-x-1/2 w-[80%] h-24 bg-blue-600/10 blur-[100px] rounded-[100%] -mt-10 pointer-events-none -z-10" />
        </div>
      </div>
    </section>
  );
};

const SocialProof = () => (
  <motion.section 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    className="py-20 lg:py-24 bg-slate-50 relative overflow-hidden"
  >
    {/* Decorative background label */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black text-slate-100/50 select-none pointer-events-none whitespace-nowrap tracking-tighter">
      TRUSTED BY TEAMS
    </div>

    <div className="max-w-7xl mx-auto px-4 relative z-10">
      <div className="grid md:grid-cols-3 gap-12 mb-16">
        {[
          { label: "Aktif Kullanıcı", value: 12000, suffix: "+" },
          { label: "Oluşturulan Diyagram", value: 540000, suffix: "+" },
          { label: "Müşteri Memnuniyeti", value: 99, suffix: "%" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="text-5xl md:text-7xl font-black text-slate-900 mb-2 tracking-tighter">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-slate-500 font-bold uppercase tracking-widest text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto text-center mb-16">
        <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight uppercase tracking-tighter">
          Dünyanın En Hızlı Büyüyen <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Ekipleri</span> <br />
          Flowchart'a Güveniyor.
        </h3>
        <p className="text-lg text-slate-500/80 font-medium leading-relaxed max-w-2xl mx-auto">
          Girişimlerden Fortune 500 şirketlerine kadar, karmaşıklığı görselleştirmek ve fikir birliğine varmak için bizi tercih ediyorlar.
        </p>
      </div>

      <div className="flex gap-20 whitespace-nowrap animate-marquee mb-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.1, y: -5 }}
            className="flex items-center gap-4 text-2xl font-black text-slate-400 grayscale hover:text-slate-900 hover:grayscale-0 transition-all cursor-default uppercase tracking-tighter"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-200" />
            <span>COMPANY {i}</span>
          </motion.div>
        ))}
        {/* Duplicate for seamless scroll */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <motion.div 
            key={i + 10} 
            whileHover={{ scale: 1.1, y: -5 }}
            className="flex items-center gap-4 text-2xl font-black text-slate-400 grayscale hover:text-slate-900 hover:grayscale-0 transition-all cursor-default uppercase tracking-tighter"
          >
             <div className="w-10 h-10 rounded-lg bg-slate-200" />
             <span>COMPANY {i}</span>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            quote: "Flowchart ile iş akışlarımızı tasarlamak artık bir angarya değil, yaratıcı bir süreç.",
            author: "Deniz Yılmaz",
            role: "Ürün Direktörü @ TechFlow",
            avatar: "bg-blue-100"
          },
          {
            quote: "Miro'dan geçiş yaptık ve hız farkı inanılmaz. Ekibimiz anında adapte oldu.",
            author: "Caner Aydın",
            role: "CTO @ InnovateApp",
            avatar: "bg-indigo-100"
          },
          {
            quote: "Karmaşık sistem mimarilerini anlatmak hiç bu kadar kolay olmamıştı. Harika bir araç.",
            author: "Selin Kaya",
            role: "Yazılım Mimarı @ GlobalSoft",
            avatar: "bg-purple-100"
          }
        ].map((t, i) => (
          <TestimonialCard key={i} {...t} delay={0.2 + i * 0.1} />
        ))}
      </div>
    </div>
  </motion.section>
);

const ProductInAction = () => {
  const scrollRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"]
  });

  const step1Opacity = useTransform(scrollYProgress, [0, 0.25, 0.3], [1, 1, 0]);
  const step2Opacity = useTransform(scrollYProgress, [0.3, 0.35, 0.6, 0.65], [0, 1, 1, 0]);
  const step3Opacity = useTransform(scrollYProgress, [0.65, 0.7, 1], [0, 1, 1]);

  // Main Cursor movement
  // Step 1: Sidebar -> Canvas
  // Step 2: Handle 1 -> Handle 2
  // Step 3: Hover over collaborative element
  const cursorX = useTransform(scrollYProgress, [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1], ["5%", "55%", "45%", "60%", "72%", "50%", "30%"]);
  const cursorY = useTransform(scrollYProgress, [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1], ["15%", "45%", "40%", "42%", "72%", "60%", "40%"]);
  
  // Step 1: Create Process Node
  const node1Opacity = useTransform(scrollYProgress, [0.05, 0.15], [0, 1]);
  const node1Scale = useTransform(scrollYProgress, [0.05, 0.15, 0.2], [0.8, 1.1, 1]);

  // Step 2: Create Decision Node & Connect
  const node2Opacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);
  const lineProgress = useTransform(scrollYProgress, [0.45, 0.6], [0, 1]);

  // Step 3: Collaboration Indicators
  const teamIndicatorOpacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1]);
  const typingOpacity = useTransform(scrollYProgress, [0.8, 0.9, 1], [0, 1, 1]);

  return (
    <section ref={scrollRef} className="relative h-[350vh] bg-white">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-24 items-center w-full">
          
          {/* Left Side: Step-by-Step Narrative */}
          <div className="relative h-[450px]">
            <motion.div style={{ opacity: step1Opacity }} className="absolute inset-0 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 w-fit">
                 Adım 01: Fikir
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 uppercase leading-[0.95] tracking-tighter">
                Fikirlerini <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Tek Tıkla</span> <br />Hayata Geçir.
              </h2>
              <p className="text-lg text-slate-500/80 leading-relaxed max-w-md font-medium">Sürükle-bırak arayüzü ile saniyeler içinde yeni nodlar ekleyin. Düşünme hızınızda tasarım yapın.</p>
            </motion.div>

            <motion.div style={{ opacity: step2Opacity }} className="absolute inset-0 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100 w-fit">
                 Adım 02: Bağlantı
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 uppercase leading-[0.95] tracking-tighter">
                Nodları <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Zekice</span> <br />Konuşturun.
              </h2>
              <p className="text-lg text-slate-500/80 leading-relaxed max-w-md font-medium">Otomatik hizalama ve akıllı bağlantılar ile süreçlerinizi tek bir dokunuşla birbirine bağlayın.</p>
            </motion.div>

            <motion.div style={{ opacity: step3Opacity }} className="absolute inset-0 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-purple-100 w-fit">
                 Adım 03: İşbirliği
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 uppercase leading-[0.95] tracking-tighter">
                Ekiplerle <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Gerçek Zamanlı</span> <br />Üretin.
              </h2>
              <p className="text-lg text-slate-500/80 leading-relaxed max-w-md font-medium">Dünyanın neresinde olursanız olun, ekibinizle sanki yan yanaymış gibi aynı tuvalde çalışın.</p>
            </motion.div>
          </div>

          {/* Right Side: High-Fidelity UI Mockup */}
          <div className="relative aspect-[4/3] bg-white border border-slate-200 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Dots Background */}
            <div className="absolute inset-0 opacity-[0.3] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Mock Sidebar */}
            <div className="absolute top-0 left-0 bottom-0 w-20 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-10 gap-6 z-20">
               <motion.div 
                 animate={scrollYProgress.get() < 0.1 ? { scale: [1, 1.1, 1] } : {}}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"
               >
                 <Layout size={24} />
               </motion.div>
               <div className="w-10 h-10 rounded-xl bg-slate-200/50" />
               <div className="w-10 h-10 rounded-xl bg-slate-200/50" />
               <div className="w-10 h-10 rounded-xl bg-slate-200/50" />
            </div>

            {/* Canvas Layers */}
            <div className="absolute inset-0 ml-20">
              {/* Connection Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-500/30 stroke-[4] fill-none">
                 <motion.path 
                    d="M 280 250 C 350 250, 400 450, 480 450" 
                    initial={{ pathLength: 0 }}
                    style={{ pathLength: lineProgress }}
                 />
              </svg>

              {/* Node 1: Process */}
              <motion.div 
                style={{ opacity: node1Opacity, scale: node1Scale, left: "35%", top: "35%" }}
                className="absolute w-56 h-28 bg-white border-2 border-slate-900 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 z-10"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Başlangıç</span>
                <span className="text-sm font-black text-slate-800 text-center leading-tight">Müşteri Yolculuğu <br />Hazırlığı</span>
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
              </motion.div>

              {/* Node 2: Decision */}
              <motion.div 
                style={{ opacity: node2Opacity, left: "60%", top: "60%" }}
                className="absolute w-44 h-44 bg-indigo-50 border-2 border-indigo-600 rotate-45 flex items-center justify-center shadow-2xl z-10"
              >
                <div className="-rotate-45 text-center flex flex-col items-center">
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Karar</span>
                   <span className="text-xs font-black text-indigo-900">Doğrulama <br />Tamam Mı?</span>
                </div>
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-sm" />
              </motion.div>

              {/* Step 3: Collaboration Overlays */}
              <motion.div 
                style={{ opacity: typingOpacity, left: "70%", top: "55%" }}
                className="absolute z-30"
              >
                 <div className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
                    <div className="flex gap-0.5">
                       <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-white rounded-full" />
                       <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-white rounded-full" />
                       <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-white rounded-full" />
                    </div>
                    Ayşe yazıyor...
                 </div>
              </motion.div>

              {/* Team Progress Badge */}
              <motion.div 
                style={{ opacity: teamIndicatorOpacity, top: 40, right: 40 }}
                className="absolute z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4"
              >
                 <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900" />
                    <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-slate-900 shadow-lg" />
                    <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-slate-900 shadow-lg" />
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Canlı Düzenleme</div>
              </motion.div>

              {/* Main Actor Cursor */}
              <motion.div 
                style={{ left: cursorX, top: cursorY }}
                className="absolute z-50 pointer-events-none drop-shadow-2xl"
              >
                <MousePointer2 className="text-blue-600 fill-blue-600 rotate-[-15deg] stroke-[3]" size={36} />
              </motion.div>

              {/* Secondary Collaborative Cursors */}
              <motion.div 
                style={{ opacity: teamIndicatorOpacity, left: "15%", top: "25%" }}
                className="absolute z-40"
              >
                <MousePointer2 className="text-purple-500 fill-purple-500 rotate-[-15deg]" size={28} />
                <div className="ml-4 -mt-2 bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-br-lg">Ayşe</div>
              </motion.div>

              <motion.div 
                style={{ opacity: teamIndicatorOpacity, left: "80%", top: "70%" }}
                className="absolute z-40"
              >
                <MousePointer2 className="text-rose-500 fill-rose-500 rotate-[-15deg]" size={28} />
                <div className="ml-4 -mt-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-br-lg">Can</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};




const Features = () => {
  const features = [
    { 
      icon: Users, 
      title: "Eşzamanlı İşbirliği", 
      desc: "Dünyanın her yerindeki ekip üyelerinizle aynı tuval üzerinde gecikmesiz çalışın.",
      gradient: "from-blue-600 to-cyan-500",
    },
    { 
      icon: Zap, 
      title: "Hiper Performans", 
      desc: "GPU hızlandırmalı motorumuzla binlerce node üzerinde akıcı bir deneyim yaşayın.",
      gradient: "from-amber-500 to-orange-400",
    },
    { 
      icon: Shield, 
      title: "Kurumsal Güvenlik", 
      desc: "Uçtan uca şifreleme ve gelişmiş rol tabanlı erişim kontrolü ile verileriniz güvende.",
      gradient: "from-indigo-600 to-purple-600",
    },
    { 
      icon: Component, 
      title: "Zengin Bileşen Seti", 
      desc: "Akıllı şekiller, özel ikonlar ve otomatik hizalama araçlarıyla kusursuzluğa ulaşın.",
      gradient: "from-emerald-500 to-teal-400",
    },
    { 
      icon: Clock, 
      title: "Sürüm Geçmişi", 
      desc: "Diyagramınızın her adımını kaydedin. İstediğiniz zaman geçmiş bir versiyona geri dönün.",
      gradient: "from-rose-500 to-pink-500",
    },
    { 
      icon: Globe, 
      title: "Global Entegrasyon", 
      desc: "Favori araçlarınızla bağlayın ve çıktılarınızı her yerde kolayca paylaşın.",
      gradient: "from-blue-400 to-indigo-500",
    },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* Canvas Dot Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Narrative Storytelling Elements */}
      <div className="absolute inset-0 pointer-events-none">
         <CollaborativeCursor name="Cem" color="text-amber-500" x="80%" y="20%" delay={2} />
         <StickyNote color="bg-rose-100" text="Buradaki performans değerlerini kontrol edelim." author="Cem" x="78%" y="25%" rotate={2} delay={2.5} />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative">
        <Reveal>
          <SectionHeading 
            title="Sadece Çizim Değil, Bir Deneyim." 
            subtitle="İş akışlarınızı canlandırmak ve ekibinizi tek bir vizyonda birleştirmek için ihtiyacınız olan her şey."
            centered={true}
            highlightWord="Deneyim."
          />
        </Reveal>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <FeatureCard
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                gradient={f.gradient}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

const TemplateCard = ({ title, desc, icon: Icon, color, delay }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -15, scale: 1.02 }}
      className="group cursor-pointer relative"
    >
      {/* Border Glow */}
      <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500" />
      
      <div className="relative">
        {/* Preview Image Container */}
        <div className={`relative aspect-video ${color} rounded-[2rem] p-8 overflow-hidden mb-8 border border-slate-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl`}>
           {/* Abstract Diagram Representation */}
           <motion.div 
             className="absolute inset-0 flex items-center justify-center pointer-events-none"
             initial={{ scale: 1 }}
             whileHover={{ scale: 1.15 }}
             transition={{ duration: 0.8 }}
           >
              <div className="relative w-full h-full p-10 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                 {/* Decorative floating nodes/shapes - animated */}
                 <motion.div animate={{ rotate: 12, y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-12 h-12 rounded-xl bg-white shadow-xl rotate-12 group-hover:rotate-0 transition-all duration-500" />
                 <motion.div animate={{ rotate: -12, y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }} className="absolute bottom-1/4 right-1/4 w-12 h-12 rounded-xl bg-white shadow-xl -rotate-12 group-hover:rotate-0 transition-all duration-500" />
                 <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-white shadow-2xl flex items-center justify-center group-hover:shadow-blue-500/20 transition-all duration-500"
                 >
                    <Icon size={32} className="text-slate-800" />
                 </motion.div>
                 
                 {/* Connectors */}
                 <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-slate-200 -z-10 group-hover:bg-blue-400 transition-colors" />
                 <div className="absolute top-1/4 bottom-1/4 left-1/2 w-0.5 bg-slate-200 -z-10 group-hover:bg-blue-400 transition-colors" />
              </div>
           </motion.div>

           {/* Gradient Overlay on hover */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           
           {/* Use Template button on hover */}
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              <button className="px-8 py-3 bg-white text-slate-900 text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-2xl hover:scale-110 transition-transform">
                 Şablonu Kullan
              </button>
           </div>
        </div>

        <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors uppercase leading-tight">
          {title}
        </h4>
        <p className="text-slate-500/80 text-lg leading-relaxed font-medium">
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

const TemplateSection = () => {
  const templates = [
    {
      title: "Flowchart",
      desc: "Süreçlerinizi ve iş akışlarınızı kristal netliğinde görselleştirin.",
      icon: Layout,
      color: "bg-blue-100/50",
    },
    {
      title: "Mind Map",
      desc: "Fikirlerinizi özgürce dallandırın ve beyin fırtınalarınızı organize edin.",
      icon: Zap,
      color: "bg-amber-100/50",
    },
    {
      title: "Org Chart",
      desc: "Ekip yapınızı ve raporlama hiyerarşinizi saniyeler içinde kurun.",
      icon: Users,
      color: "bg-emerald-100/50",
    },
    {
      title: "User Journey",
      desc: "Müşteri deneyimini her temas noktasında analiz edin ve optimize edin.",
      icon: MousePointer2,
      color: "bg-purple-100/50",
    },
    {
      title: "Process Diagram",
      desc: "Karmaşık operasyonları anlaşılabilir adımlara dönüştürün.",
      icon: Layers,
      color: "bg-rose-100/50",
    },
    {
      title: "Architecture Map",
      desc: "Yazılım mimarinizi ve veri akışlarınızı kuş bakışı görün.",
      icon: Globe,
      color: "bg-slate-100/50",
    },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="py-20 lg:py-24 bg-white pointer-events-auto relative overflow-hidden"
    >
      {/* Canvas Dot Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Visual Storytelling */}
      <div className="absolute inset-0 pointer-events-none">
         <CollaborativeCursor name="Derya" color="text-emerald-500" x="10%" y="80%" delay={3} />
         <StickyNote color="bg-emerald-100" text="Mind Map şablonu harika görünüyor!" author="Derya" x="12%" y="82%" rotate={-3} delay={3.5} />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest mb-6"
            >
              <Sparkles size={14} /> Şablon Kütüphanesi
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter uppercase leading-[0.95]">
              Sıfırdan Başlamanıza <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Gerek Yok.</span>
            </h2>
            <p className="text-lg text-slate-500/80 font-medium leading-relaxed">
              Yüzlerce profesyonel şablon ile ilham alın ve ilk diyagramınızı saniyeler içinde oluşturmaya başlayın.
            </p>
          </div>
          <Button variant="outline" className="h-fit px-10 py-5 text-lg font-bold">
            Tüm Şablonları Gör
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {templates.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <TemplateCard
                title={t.title}
                desc={t.desc}
                icon={t.icon}
                color={t.color}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

const Footer = () => (
  <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
        <div className="col-span-2">
           <a href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Layout size={24} />
            </div>
            <span className="text-xl font-bold text-slate-900">Flowchart.</span>
          </a>
          <p className="text-slate-500 mb-8 max-w-sm lowercase font-medium leading-relaxed">Ekipler için en hızlı ve en sezgisel diyagram oluşturma platformu. Geleceği burada tasarlıyoruz.</p>
          <div className="flex gap-4">
            {['Twitter', 'LinkedIn', 'YouTube'].map(social => (
              <a key={social} href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
                <span className="sr-only">{social}</span>
                <Globe size={20} />
              </a>
            ))}
          </div>
        </div>
        {[
          { title: 'Ürün', links: ['Özellikler', 'Pazaryeri', 'Şablonlar', 'Eklentiler'] },
          { title: 'Şirket', links: ['Hakkımızda', 'Kariyer', 'Haberler', 'Basın'] },
          { title: 'Kaynaklar', links: ['Topluluk', 'Yardım Merkezi', 'Güvenlik', 'Durum'] },
        ].map(col => (
          <div key={col.title}>
            <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">{col.title}</h5>
            <ul className="space-y-4">
              {col.links.map(link => (
                <li key={link}><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors uppercase font-bold text-[10px] tracking-widest">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest text-[10px]">© 2026 Flowchart. Tüm hakları saklıdır.</p>
        <div className="flex gap-8">
          <a href="#" className="text-slate-400 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest">Gizlilik Politikası</a>
          <a href="#" className="text-slate-400 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest">Kullanım Koşulları</a>
        </div>
      </div>
    </div>
  </footer>
);

const LandingPage: React.FC<{ openTab?: 'login' | 'register' }> = ({ openTab }) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  useEffect(() => {
    if (isAuthenticated) navigate('/app', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (openTab) openAuthModal();
  }, [openTab, openAuthModal]);


  return (
    <div className="flex flex-col min-h-screen bg-white selection:bg-blue-100 selection:text-blue-700 font-sans">
      <Navbar scrolled={scrolled} onOpenAuth={openAuthModal} />
      
      <main className="flex-1">
        <Hero onOpenAuth={openAuthModal} />
        
        <CTASection 
          title={<>Fikirlerinizi <br/>Harekete Geçirin.</>}
          subtitle="ekibinizle beraber harika işler çıkarmak için ilk adımı atın. hiçbir kurulum gerekmez."
          buttonText="şimdi dene"
          onButtonClick={openAuthModal}
          colors="from-blue-600 via-indigo-600 to-purple-600"
          delay={0.4}
        />

        <SocialProof />

        <ProductInAction />

        <Features />

        <CTASection 
          title={<>karmaşıklığı <br/>basite indirgeyin.</>}
          subtitle="en zorlu iş süreçlerini bile anlaşılır ve etkileyici görsel şölenlere dönüştürün."
          buttonText="başla"
          onButtonClick={openAuthModal}
          dark={false}
        />

        <TemplateSection />

        <CTASection 
          title={<>Bugün <br />Bağlanmaya Başlayın.</>}
          subtitle="Kredi kartınız gerekmez. Dakikalar içinde ilk diyagramınızı oluşturun ve paylaşmaya başlayın."
          buttonText="Ücretsiz Başla"
          onButtonClick={openAuthModal}
          colors="from-indigo-600 via-blue-600 to-cyan-500"
          className="pb-16 lg:pb-20"
        />
      </main>

      <Footer />

      <AuthModal />

      {/* Tailwind v4 Extra Transitions & Utilities in LandingPage.css */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .noise-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          filter: contrast(120%) brightness(100%);
          opacity: 0.03;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
