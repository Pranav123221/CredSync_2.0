import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldAlert,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Plus,
  QrCode,
  X,
  RefreshCw,
  Users,
  FileText,
  CreditCard,
  Sparkles,
  Smartphone
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://credsync-2-0.onrender.com/api';

const CACHE_KEYS = {
  metrics: 'credsync_metrics',
  customers: 'credsync_customers',
  credits: 'credsync_credits',
  payments: 'credsync_payments',
  ai: 'credsync_ai'
};

const readCache = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
};

const BUCKET_COLORS = ['#0F172A', '#1E3A8A', '#2563EB', '#D97706', '#DC2626'];

const Dashboard = ({ activeTab = 'dashboard', setActiveTab = () => {}, viewMode = 'merchant' }) => {
  const [metricsData, setMetricsData] = useState(() => readCache(CACHE_KEYS.metrics, null));
  const [customers, setCustomers] = useState(() => readCache(CACHE_KEYS.customers, []));
  const [credits, setCredits] = useState(() => readCache(CACHE_KEYS.credits, []));
  const [payments, setPayments] = useState(() => readCache(CACHE_KEYS.payments, []));
  const [aiInsights, setAiInsights] = useState(() => readCache(CACHE_KEYS.ai, null));

  const [refreshing, setRefreshing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [qrInvoice, setQrInvoice] = useState(null);

  // Add Customer Form
  const [customerForm, setCustomerForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    credit_limit: '250000'
  });

  // Issue Credit / Invoice Form
  const [creditForm, setCreditForm] = useState({
    customer_id: '',
    invoice_number: '',
    amount: '',
    due_days: '15'
  });

  const [submitting, setSubmitting] = useState(false);
  const [statusBanner, setStatusBanner] = useState('');

  const fetchAllData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    let latestMetrics = readCache(CACHE_KEYS.metrics, null);

    try {
      const [metricsRes, customersRes, creditsRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`),
        axios.get(`${API}/customers/`),
        axios.get(`${API}/credits/`),
        axios.get(`${API}/credits/payments`)
      ]);

      const mVal = metricsRes.data || null;
      const cuVal = Array.isArray(customersRes.data) ? customersRes.data : [];
      const crVal = Array.isArray(creditsRes.data) ? creditsRes.data : [];
      const paVal = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];

      latestMetrics = mVal;
      setMetricsData(mVal);
      setCustomers(cuVal);
      setCredits(crVal);
      setPayments(paVal);

      writeCache(CACHE_KEYS.metrics, mVal);
      writeCache(CACHE_KEYS.customers, cuVal);
      writeCache(CACHE_KEYS.credits, crVal);
      writeCache(CACHE_KEYS.payments, paVal);

      if (cuVal.length > 0 && !creditForm.customer_id) {
        setCreditForm((prev) => ({ ...prev, customer_id: String(cuVal[0].id) }));
      }
    } catch (err) {
      console.error('Core ledger fetch error:', err);
    } finally {
      if (isManual) setRefreshing(false);
    }

    // Phase 2: Non-blocking Gemini AI insights fetch with timeout & fallback
    setAiLoading(true);
    try {
      const aiRes = await axios.get(`${API}/ai/`, { timeout: 8000 });
      const rawData = aiRes.data;
      const extractedAlerts = Array.isArray(rawData?.alerts)
        ? rawData.alerts
        : Array.isArray(rawData?.insights)
          ? rawData.insights
          : Array.isArray(rawData)
            ? rawData
            : [];

      if (extractedAlerts.length > 0) {
        setAiInsights({ alerts: extractedAlerts });
        writeCache(CACHE_KEYS.ai, { alerts: extractedAlerts });
      } else {
        const m = latestMetrics?.metrics || {};
        const topD = Array.isArray(latestMetrics?.top_debtors) ? latestMetrics.top_debtors[0] : null;
        const fallbackAlerts = [
          `Outstanding AR: ${m.total_outstanding || '₹0'} | Overdue: ${m.total_overdue || '₹0'} | Efficiency: ${m.collection_efficiency || '0%'}.`,
          topD
            ? `Priority debtor: ${topD.name} (${topD.amount}, ${topD.days}, ${topD.risk} Risk) — share QR link for faster settlement.`
            : 'Use QR / UPI mobile settlement links to speed up invoice collections.'
        ];
        setAiInsights({ alerts: fallbackAlerts });
      }
    } catch (err) {
      console.error('AI insights fetch error:', err);
      const m = latestMetrics?.metrics || {};
      const topD = Array.isArray(latestMetrics?.top_debtors) ? latestMetrics.top_debtors[0] : null;
      const fallbackAlerts = [
        `Ledger Snapshot: Outstanding AR ${m.total_outstanding || '₹0'} and Overdue ${m.total_overdue || '₹0'}.`,
        topD
          ? `Recommended follow-up: ${topD.name} (${topD.amount}, ${topD.risk} Risk).`
          : 'All ledger entries synced; trigger mobile QR checkout to settle open dues.'
      ];
      setAiInsights({ alerts: fallbackAlerts });
    } finally {
      setAiLoading(false);
    }
  }, [creditForm.customer_id]);

  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        company_name: customerForm.company_name.trim(),
        email: customerForm.email.trim() || null,
        credit_limit: Number(customerForm.credit_limit || 0)
      };

      if (customerForm.contact_name.trim()) {
        payload.contact_name = customerForm.contact_name.trim();
      }

      await axios.post(`${API}/customers`, payload);
      setCustomerForm({ company_name: '', contact_name: '', email: '', credit_limit: '250000' });
      setShowCustomerModal(false);
      setStatusBanner('New B2B customer account created & synced.');
      await fetchAllData(false);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const reason =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg).join(', ')
            : err?.message || 'Backend connection failed';
      setStatusBanner(`Could not create customer: ${reason}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCredit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const invNo =
      creditForm.invoice_number.trim() ||
      `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      await axios.post(`${API}/credits/`, {
        customer_id: creditForm.customer_id || (customers[0]?.id ?? ''),
        invoice_number: invNo,
        amount: Number(creditForm.amount || 0),
        due_days: Number(creditForm.due_days || 15)
      });
      setCreditForm((prev) => ({ ...prev, invoice_number: '', amount: '', due_days: '15' }));
      setShowCreditModal(false);
      setStatusBanner(`Invoice ${invNo} issued to ledger.`);
      await fetchAllData(false);
    } catch (err) {
      console.error(err);
      setStatusBanner('Could not issue invoice. Check form inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickMarkPaid = async (credit) => {
    try {
      await axios.post(`${API}/credits/${credit.id}/pay`, {
        payment_method: 'Direct Ledger Settlement',
        reference_id: `SETL-${Date.now().toString().slice(-6)}`
      });
      setStatusBanner(`Invoice ${credit.invoice_number} marked as PAID.`);
      await fetchAllData(false);
    } catch (err) {
      console.error(err);
    }
  };

  const buildMobileQrUrl = (credit) => {
    const customerName = credit?.customers?.company_name || 'Client';
    const params = new URLSearchParams({
      pay: '1',
      id: String(credit.id),
      inv: String(credit.invoice_number || 'INV'),
      amt: String(credit.amount || 0),
      cust: String(customerName)
    });
    return `${window.location.origin}/?${params.toString()}`;
  };

  const kpis = metricsData?.metrics || {
    total_outstanding: '₹0',
    total_overdue: '₹0',
    collection_efficiency: '0%',
    avg_dso: '0 Days'
  };

  const agedDebt = Array.isArray(metricsData?.aged_debt) ? metricsData.aged_debt : [];
  const topDebtors = Array.isArray(metricsData?.top_debtors) ? metricsData.top_debtors : [];

  const aiAlerts = Array.isArray(aiInsights?.alerts)
    ? aiInsights.alerts
    : Array.isArray(aiInsights?.insights)
      ? aiInsights.insights
      : [];

  const effectiveTab = viewMode === 'customer' ? 'credits' : activeTab;

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {viewMode === 'customer' ? 'Customer Invoice & QR Settlement' : 'CredSync FinOps Command Center'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'customer'
              ? 'Scan invoice QR or settle dues via Razorpay mobile flow with instant ledger sync.'
              : 'Real-time Accounts Receivable, Aged Debt risk telemetry, and Gemini AI collection insights.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {viewMode === 'merchant' && (
            <>
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
              <button
                type="button"
                onClick={() => setShowCreditModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Issue Invoice
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => fetchAllData(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {statusBanner}
          </span>
          <button
            type="button"
            onClick={() => setStatusBanner('')}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Merchant Overview (KPIs + Aged Debt Chart + Top Debtors + Gemini AI) */}
      {viewMode === 'merchant' && effectiveTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outstanding AR</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{kpis.total_outstanding}</p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Active open receivables
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue Exposure</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-2">{kpis.total_overdue}</p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Past due date buckets
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Collection Efficiency</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">{kpis.collection_efficiency}</p>
              <p className="text-[11px] text-slate-500 mt-1">Settled vs. total billed volume</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. DSO</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{kpis.avg_dso}</p>
              <p className="text-[11px] text-slate-500 mt-1">Days Sales Outstanding</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Aged Debt Distribution Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Aged Debt Distribution (₹)</h2>
                  <p className="text-xs text-slate-500">Receivables stratified by days past due</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agedDebt} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, 'Amount']}
                      contentStyle={{ borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '12px' }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {agedDebt.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Debtors Risk */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <h2 className="text-base font-bold text-slate-900">Top Debtors Risk</h2>
              <p className="text-xs text-slate-500">High-exposure counterparties requiring follow-up</p>

              <div className="space-y-2.5 pt-1">
                {topDebtors.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No active debtors found.</p>
                ) : (
                  topDebtors.map((debtor) => (
                    <div
                      key={debtor.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{debtor.name}</p>
                        <p className="text-[11px] text-slate-500">{debtor.days}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900">{debtor.amount}</p>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            debtor.risk === 'High'
                              ? 'bg-rose-100 text-rose-700'
                              : debtor.risk === 'Medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {debtor.risk} Risk
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Non-Blocking Gemini AI Risk Insights */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Gemini AI Risk & Collection Insights</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {aiLoading ? 'Analyzing ledger in background...' : 'Non-Blocking AI'}
              </span>
            </div>

            {aiAlerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiAlerts.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-slate-700 flex items-start gap-2.5"
                  >
                    <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{typeof item === 'string' ? item : item.message || item.title || JSON.stringify(item)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {aiLoading
                  ? 'Fetching Gemini risk recommendations without delaying dashboard render...'
                  : 'All active credit accounts are within standard monitoring parameters.'}
              </p>
            )}
          </div>
        </>
      )}

      {/* Customers Tab */}
      {viewMode === 'merchant' && effectiveTab === 'customers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Customers ({customers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3 text-right">Credit Limit</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{c.company_name}</td>
                    <td className="py-3 px-3 text-slate-700">{c.contact_name || '—'}</td>
                    <td className="py-3 px-3 text-slate-600">{c.email || '—'}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      ₹{Number(c.credit_limit || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices & Credits Ledger (Shown in Merchant 'credits' tab AND Customer mode) */}
      {(effectiveTab === 'credits' || effectiveTab === 'dashboard') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Invoices & Credit Ledger ({credits.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Settle / QR</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((item) => {
                  const isPaid = String(item.status || '').toUpperCase() === 'PAID';
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.invoice_number}</td>
                      <td className="py-3 px-3 text-slate-700">{item.customers?.company_name || 'Client'}</td>
                      <td className="py-3 px-3 text-slate-600">{item.due_date || '—'}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        ₹{Number(item.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status || 'OPEN'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {!isPaid ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setQrInvoice(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              QR / Pay
                            </button>
                            {viewMode === 'merchant' && (
                              <button
                                type="button"
                                onClick={() => handleQuickMarkPaid(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Ledger Tab */}
      {viewMode === 'merchant' && effectiveTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Payments Ledger ({payments.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id || i} className="border-b border-slate-100">
                    <td className="py-3 px-3 font-semibold text-slate-800">{p.payment_method || 'Razorpay'}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{p.reference_id || '—'}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                      ₹{Number(p.amount_paid || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCustomerModal && viewMode === 'merchant' && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Add B2B Customer</h3>
              <button type="button" onClick={() => setShowCustomerModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={customerForm.company_name}
                  onChange={(e) => setCustomerForm({ ...customerForm, company_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Rajasthan Steel Corp"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={customerForm.contact_name}
                  onChange={(e) => setCustomerForm({ ...customerForm, contact_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Vikram Rathore"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="accounts@company.com"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={customerForm.credit_limit}
                  onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Credit / Invoice Modal */}
      {showCreditModal && viewMode === 'merchant' && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Issue Credit Invoice</h3>
              <button type="button" onClick={() => setShowCreditModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateCredit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Customer Account</label>
                <select
                  value={creditForm.customer_id}
                  onChange={(e) => setCreditForm({ ...creditForm, customer_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Invoice Number (Optional)</label>
                <input
                  type="text"
                  value={creditForm.invoice_number}
                  onChange={(e) => setCreditForm({ ...creditForm, invoice_number: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="INV-2026-105"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Invoice Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Due Days (Negative for Overdue Demo)</label>
                <input
                  type="number"
                  required
                  value={creditForm.due_days}
                  onChange={(e) => setCreditForm({ ...creditForm, due_days: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer"
                >
                  {submitting ? 'Issuing...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offline QRCodeSVG Modal for Mobile Checkout */}
      {qrInvoice && (
        <div className="fixed inset-0 bg-slate-950/65 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                <Smartphone className="w-4 h-4" />
                Mobile Scan Checkout
              </span>
              <button type="button" onClick={() => setQrInvoice(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div>
              <p className="text-base font-extrabold text-slate-900">{qrInvoice.invoice_number}</p>
              <p className="text-xs text-slate-500">{qrInvoice.customers?.company_name || 'Client'}</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">
                ₹{Number(qrInvoice.amount || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl inline-flex justify-center mx-auto">
              <QRCodeSVG value={buildMobileQrUrl(qrInvoice)} size={184} />
            </div>

            <p className="text-[11px] text-slate-500">
              Scan with phone camera to open `?pay=1` checkout and sync ledger.
            </p>

            <a
              href={buildMobileQrUrl(qrInvoice)}
              className="block w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              Open Mobile Checkout Link Directly
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;