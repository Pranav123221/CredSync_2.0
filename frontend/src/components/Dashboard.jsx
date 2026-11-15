import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, TrendingUp, MessageSquare, Lightbulb, AlertTriangle, Plus, CheckCircle, X, CreditCard, Smartphone, Building2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Dashboard = ({ activeTab }) => {
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Modals State
  const [showCustModal, setShowCustModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [payModalCredit, setPayModalCredit] = useState(null);
  
  // Forms State
  const [custForm, setCustForm] = useState({ company_name: '', phone: '', email: '', credit_limit: 50000 });
  const [creditForm, setCreditForm] = useState({ customer_id: '', amount: '', due_days: 15 });
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('cred.sync@okaxis');

  const fetchAllData = async () => {
    try {
      const [mRes, aiRes, cRes, crRes, pRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`),
        axios.get(`${API}/ai/`),
        axios.get(`${API}/customers/`),
        axios.get(`${API}/credits/`),
        axios.get(`${API}/credits/payments`)
      ]);
      setMetrics(mRes.data);
      setInsights(aiRes.data);
      setCustomers(cRes.data);
      setCredits(crRes.data);
      setPayments(pRes.data);
      if (cRes.data.length > 0 && !creditForm.customer_id) {
        setCreditForm(prev => ({ ...prev, customer_id: cRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/customers/`, { ...custForm, credit_limit: Number(custForm.credit_limit) });
    setShowCustModal(false);
    setCustForm({ company_name: '', phone: '', email: '', credit_limit: 50000 });
    fetchAllData();
  };

  const handleCreateCredit = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/credits/`, {
      customer_id: creditForm.customer_id,
      amount: Number(creditForm.amount),
      due_days: Number(creditForm.due_days)
    });
    setShowCreditModal(false);
    setCreditForm({ ...creditForm, amount: '' });
    fetchAllData();
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payModalCredit) return;
    await axios.post(`${API}/credits/${payModalCredit.id}/pay`, {
      payment_method: payMethod,
      reference_id: payRef || `TXN${Math.floor(100000 + Math.random() * 900000)}`
    });
    setPayModalCredit(null);
    fetchAllData();
  };

  if (!metrics) return <div className="flex items-center justify-center h-full text-lg font-semibold text-slate-600">Initializing CredSync FinOps Engine...</div>;

  const iconMap = {
    AlertTriangle: <AlertTriangle className="text-orange-500" size={22} />,
    ShieldAlert: <ShieldAlert className="text-red-500" size={22} />,
    TrendingUp: <TrendingUp className="text-emerald-500" size={22} />,
    MessageSquare: <MessageSquare className="text-blue-500" size={22} />,
    Lightbulb: <Lightbulb className="text-amber-500" size={22} />
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Action Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts Receivable & Credit Operations</h1>
          <p className="text-sm text-slate-500">Real-time ledger synchronization, aging analytics & Gemini risk scoring</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCustModal(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> Add Customer
          </button>
          <button onClick={() => setShowCreditModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm">
            <Plus size={16} /> Issue Credit / Invoice
          </button>
        </div>
      </header>

      {/* Enterprise KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <MetricCard title="Total Outstanding AR" amount={metrics.metrics.total_outstanding} sub="Active receivables" />
        <MetricCard title="Total Overdue Exposure" amount={metrics.metrics.total_overdue} color="text-red-600" sub="Past due date" />
        <MetricCard title="Collection Efficiency" amount={metrics.metrics.collection_efficiency} color="text-emerald-600" sub="Recovered vs Billed" />
        <MetricCard title="Avg. DSO (Turnaround)" amount={metrics.metrics.avg_dso} color="text-blue-600" sub="Days Sales Outstanding" />
      </div>

      {/* Main Dashboard View */}
      {(activeTab === 'dashboard' || activeTab === 'ai') && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Aged Debt Distribution (₹)</h2>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">Live Ledger</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.aged_debt}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} barSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
              <h2 className="text-base font-bold text-slate-800 mb-5">Top Debtors & Risk Tier</h2>
              <div className="space-y-4">
                {metrics.top_debtors.map((debtor, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{debtor.name}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        debtor.risk === 'High' ? 'bg-red-100 text-red-700' : debtor.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {debtor.risk} Risk • {debtor.days}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{debtor.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Business Insights */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb className="text-amber-500" size={20} /> Gemini AI Financial & Risk Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((item) => (
                <div key={item.id} className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="mt-0.5 bg-white p-2 rounded-lg shadow-sm">{iconMap[item.icon] || iconMap.Lightbulb}</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Invoices & Credits Ledger Table */}
      {(activeTab === 'dashboard' || activeTab === 'credits') && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
          <h2 className="text-base font-bold text-slate-800 mb-4">Active Credit Ledger & Collections</h2>
          {credits.length === 0 ? (
            <p className="text-sm text-slate-500">No invoices issued yet. Click "+ Issue Credit / Invoice" above to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {credits.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 font-mono font-semibold text-blue-600">{c.invoice_number}</td>
                      <td className="p-3 font-medium">{c.customers?.company_name}</td>
                      <td className="p-3 font-bold">₹{Number(c.amount).toLocaleString()}</td>
                      <td className="p-3 text-slate-500">{c.due_date}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : c.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {c.status !== 'PAID' && (
                          <button
                            onClick={() => { setPayModalCredit(c); setPayMethod('UPI'); setPayRef('business@okicici'); }}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                          >
                            <CheckCircle size={14} /> Settle / Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments Ledger View */}
      {(activeTab === 'dashboard' || activeTab === 'payments') && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
          <h2 className="text-base font-bold text-slate-800 mb-4">Verified Payments & Settlements ({payments.length})</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments recorded yet. Click "Settle / Pay" on any invoice above to open payment options.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Amount Settled</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-800">{p.customers?.company_name}</td>
                      <td className="p-3 font-mono text-blue-600">{p.credits?.invoice_number}</td>
                      <td className="p-3 font-bold text-emerald-600">₹{Number(p.amount_paid).toLocaleString()}</td>
                      <td className="p-3 text-slate-600 font-medium">{p.payment_method}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customers Directory View */}
      {activeTab === 'customers' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
          <h2 className="text-base font-bold text-slate-800 mb-4">Registered Business Accounts ({customers.length})</h2>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-3">Company Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Approved Credit Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((cust) => (
                <tr key={cust.id}>
                  <td className="p-3 font-bold text-slate-800">{cust.company_name}</td>
                  <td className="p-3">{cust.phone}</td>
                  <td className="p-3 text-slate-500">{cust.email || '—'}</td>
                  <td className="p-3 font-semibold text-emerald-700">₹{Number(cust.credit_limit).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Add Customer */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Register New Customer</h3>
              <button onClick={() => setShowCustModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <input required placeholder="Company Name (e.g. Rajasthan Steel)" className="w-full border p-2.5 rounded-lg text-sm" value={custForm.company_name} onChange={e => setCustForm({...custForm, company_name: e.target.value})} />
              <input required placeholder="Phone Number" className="w-full border p-2.5 rounded-lg text-sm" value={custForm.phone} onChange={e => setCustForm({...custForm, phone: e.target.value})} />
              <input placeholder="Email Address" className="w-full border p-2.5 rounded-lg text-sm" value={custForm.email} onChange={e => setCustForm({...custForm, email: e.target.value})} />
              <input required type="number" placeholder="Credit Limit (₹)" className="w-full border p-2.5 rounded-lg text-sm" value={custForm.credit_limit} onChange={e => setCustForm({...custForm, credit_limit: e.target.value})} />
              <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm">Save Customer to PostgreSQL</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Issue Credit */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Issue Credit / Invoice</h3>
              <button onClick={() => setShowCreditModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCredit} className="space-y-4">
              <select required className="w-full border p-2.5 rounded-lg text-sm" value={creditForm.customer_id} onChange={e => setCreditForm({...creditForm, customer_id: e.target.value})}>
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
              <input required type="number" placeholder="Credit Amount (₹)" className="w-full border p-2.5 rounded-lg text-sm" value={creditForm.amount} onChange={e => setCreditForm({...creditForm, amount: e.target.value})} />
              <select className="w-full border p-2.5 rounded-lg text-sm" value={creditForm.due_days} onChange={e => setCreditForm({...creditForm, due_days: e.target.value})}>
                <option value={15}>Due in 15 Days (Current)</option>
                <option value={30}>Due in 30 Days (Net 30)</option>
                <option value={-20}>Simulate 20 Days Overdue (Demo Risk)</option>
                <option value={-45}>Simulate 45 Days Overdue (High Risk)</option>
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm">Generate Invoice & Sync Ledger</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Interactive Payment Checkout Gateway */}
      {payModalCredit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">CredSync Instant Settlement</span>
                <h3 className="text-lg font-bold text-slate-900">{payModalCredit.customers?.company_name}</h3>
              </div>
              <button onClick={() => setPayModalCredit(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>

            <div className="my-4 p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Invoice {payModalCredit.invoice_number}</p>
                <p className="text-2xl font-bold mt-0.5">₹{Number(payModalCredit.amount).toLocaleString()}</p>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                256-bit Secured
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <button type="button" onClick={() => { setPayMethod('UPI'); setPayRef('business@okaxis'); }} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${payMethod === 'UPI' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Smartphone size={18} /> UPI / QR
              </button>
              <button type="button" onClick={() => { setPayMethod('Corporate Card'); setPayRef('•••• 4829'); }} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${payMethod === 'Corporate Card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <CreditCard size={18} /> Card
              </button>
              <button type="button" onClick={() => { setPayMethod('NEFT / RTGS'); setPayRef('UTR88291044'); }} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${payMethod === 'NEFT / RTGS' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Building2 size={18} /> NetBanking
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              {payMethod === 'UPI' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Enter Customer UPI ID or Scan QR</label>
                  <input required className="w-full border p-2.5 rounded-lg text-sm font-mono" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="customer@upi" />
                </div>
              )}

              {payMethod === 'Corporate Card' && (
                <div className="space-y-2.5">
                  <input required className="w-full border p-2.5 rounded-lg text-sm font-mono" placeholder="Card Number: 4532 •••• •••• 4829" defaultValue="4532 8910 3321 4829" />
                  <div className="grid grid-cols-2 gap-2">
                    <input required className="border p-2.5 rounded-lg text-sm font-mono" placeholder="MM/YY" defaultValue="09/29" />
                    <input required type="password" className="border p-2.5 rounded-lg text-sm font-mono" placeholder="CVV" defaultValue="842" />
                  </div>
                </div>
              )}

              {payMethod === 'NEFT / RTGS' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Bank UTR / IMPS Reference Number</label>
                  <input required className="w-full border p-2.5 rounded-lg text-sm font-mono" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="UTR Number" />
                </div>
              )}

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition">
                Confirm & Settle ₹{Number(payModalCredit.amount).toLocaleString()}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, amount, sub, color = "text-slate-900" }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{title}</p>
    <p className={`text-2xl font-bold mt-2 ${color}`}>{amount}</p>
    <p className="text-xs text-slate-400 mt-1">{sub}</p>
  </div>
);

export default Dashboard;