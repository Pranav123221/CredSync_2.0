import React from 'react';
import { Home, Users, FileText, BarChart2, ShieldCheck, CreditCard } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-slate-950 text-white flex flex-col h-full border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-lg">
          C
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">CredSync</h1>
          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">FinOps Engine</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5">
        <NavItem icon={<Home size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<Users size={18} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
        <NavItem icon={<FileText size={18} />} label="Invoices & Credits" active={activeTab === 'credits'} onClick={() => setActiveTab('credits')} />
        <NavItem icon={<CreditCard size={18} />} label="Payments Ledger" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
        <NavItem icon={<BarChart2 size={18} />} label="AI Risk Engine" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
      </nav>
      
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-xs text-emerald-400 mb-3">
          <ShieldCheck size={16} />
          <span>PostgreSQL + Gemini Live</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">PS</div>
          <div>
            <p className="text-sm font-semibold">Pranav Sharma</p>
            <p className="text-xs text-slate-400">System Architect</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Sidebar;