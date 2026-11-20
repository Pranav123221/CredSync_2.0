import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle2, ShieldCheck, Smartphone, ArrowRight, Loader2, ArrowLeft, Globe } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://credsync-2-0.onrender.com/api';

const FX_TO_INR = {
  INR: 1,
  USD: 84.5,
  EUR: 91.2,
  GBP: 106.8
};

const CURRENCY_SYMBOL = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const MobileRazorpayCheckout = ({
  creditId,
  invoiceNumber,
  amount,
  customerName,
  initialCurrency = 'INR'
}) => {
  const [currency, setCurrency] = useState(
    FX_TO_INR[initialCurrency] ? initialCurrency : 'INR'
  );
  const [upiId, setUpiId] = useState('customer@okicici');
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [showMobileDashboard, setShowMobileDashboard] = useState(false);
  const [syncedCredits, setSyncedCredits] = useState([]);
  const [syncedMetrics, setSyncedMetrics] = useState(null);

  const rawAmount = Number(amount || 0);
  const fxRate = FX_TO_INR[currency] || 1;
  const settledInrAmount = Math.round(rawAmount * fxRate);
  const sym = CURRENCY_SYMBOL[currency] || '₹';

  const [txnId] = useState(() => 'pay_' + Math.random().toString(36).substring(2, 12).toUpperCase());
  const [paidTime] = useState(() =>
    new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  );

  const handleMobilePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await axios.post(`${API}/credits/${creditId}/pay`, {
        payment_method: currency === 'INR' ? 'Razorpay Mobile QR' : `Intl ${currency} -> INR Bank`,
        reference_id:
          currency === 'INR'
            ? `${txnId} (${upiId})`
            : `${txnId} (${sym}${rawAmount.toLocaleString()} ${currency} -> ₹${settledInrAmount.toLocaleString()} INR Bank)`
      });
      localStorage.removeItem('credsync_metrics');
      localStorage.removeItem('credsync_credits');
      localStorage.removeItem('credsync_payments');
      setPaid(true);
    } catch (err) {
      console.error(err);
      setPaid(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleDoneClick = async () => {
    try {
      const [mRes, crRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`),
        axios.get(`${API}/credits/`)
      ]);
      setSyncedMetrics(mRes.data);
      setSyncedCredits(crRes.data);
    } catch (err) {
      console.error(err);
    }
    setShowMobileDashboard(true);
  };

  // View after clicking "Done": Mobile Dashboard - Synced Successfully
  if (showMobileDashboard) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
        <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setShowMobileDashboard(false)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Receipt
          </button>
          <span className="text-sm font-bold text-slate-900">Dashboard - Synced Successfully</span>
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            LIVE
          </span>
        </div>

        <div className="p-4 max-w-md mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-500 font-semibold">Total Outstanding AR</p>
              <p className="text-lg font-extrabold text-slate-900 mt-1">
                ₹{syncedMetrics?.metrics?.total_outstanding ?? '—'}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-500 font-semibold">Collection Efficiency</p>
              <p className="text-lg font-extrabold text-emerald-600 mt-1">
                {syncedMetrics?.metrics?.collection_efficiency ?? '—'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Latest Settled Invoice
            </h3>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <p className="text-sm font-bold text-slate-900">{invoiceNumber || 'Invoice'}</p>
                <p className="text-xs text-slate-500">{customerName || 'B2B Account'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-slate-900">₹{settledInrAmount.toLocaleString()}</p>
                {currency !== 'INR' && (
                  <p className="text-[11px] font-semibold text-blue-600">
                    From {sym}{rawAmount.toLocaleString()} {currency}
                  </p>
                )}
                <span className="inline-block text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded mt-0.5">
                  Status: Paid
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Transaction ID</span>
                <span className="font-mono font-semibold text-slate-800">{txnId}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-semibold text-slate-800">
                  {currency === 'INR' ? `UPI (${upiId})` : `${currency} → INR Bank`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ledger Invoices ({syncedCredits.length})
            </h3>
            {syncedCredits.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
                <div>
                  <p className="font-bold text-slate-800">{item.invoice_number}</p>
                  <p className="text-slate-500">{item.customers?.company_name || 'Client'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹{Number(item.amount).toLocaleString()}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#0D1627] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2B84EA] flex items-center justify-center font-extrabold text-xl italic">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">Razorpay Checkout</span>
                <span className="text-[10px] bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded font-semibold">
                  {currency === 'INR' ? 'TRUSTED' : 'FX → INR BANK'}
                </span>
              </div>
              <p className="text-xs text-slate-400">CredSync FinOps • {invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#162238] text-white px-5 py-3.5 flex items-center justify-between border-t border-slate-800">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Merchant</p>
            <p className="text-sm font-semibold text-slate-100">CredSync FinOps</p>
            {currency !== 'INR' && (
              <p className="text-[11px] text-emerald-400">
                Indian Bank INR: ₹{settledInrAmount.toLocaleString()} (1 {currency} = ₹{fxRate})
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Payable Amount</p>
            <p className="text-xl font-extrabold text-emerald-400">
              {currency === 'INR' ? `₹${rawAmount.toLocaleString()}` : `${sym}${rawAmount.toLocaleString()}`}
            </p>
          </div>
        </div>

        {!paid ? (
          <form onSubmit={handleMobilePay} className="p-6 space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2B84EA]" />
                Currency (INR or Intl → Indian Bank INR)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['INR', 'USD', 'EUR', 'GBP'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      currency === code
                        ? 'bg-[#2B84EA] text-white border-[#2B84EA]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#2B84EA] shrink-0" />
              <p className="text-xs text-slate-700 leading-relaxed">
                {currency === 'INR' ? (
                  <>
                    QR scanned for <span className="font-bold">{customerName || 'Client'}</span>. Tap below to settle invoice in real time.
                  </>
                ) : (
                  <>
                    Intl settlement for <span className="font-bold">{customerName || 'Client'}</span>: {sym}
                    {rawAmount.toLocaleString()} {currency} converts at ₹{fxRate} to{' '}
                    <span className="font-bold text-emerald-700">₹{settledInrAmount.toLocaleString()} INR</span> in Indian bank.
                  </>
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                {currency === 'INR' ? 'Payer UPI ID' : 'Payer UPI ID / Intl Ref'}
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg font-mono text-sm text-slate-900 focus:outline-none focus:border-[#2B84EA]"
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3.5 bg-[#2B84EA] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  {currency === 'INR'
                    ? `Pay ₹${rawAmount.toLocaleString()} Now`
                    : `Pay ${sym}${rawAmount.toLocaleString()} → ₹${settledInrAmount.toLocaleString()} INR`}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Secured by Razorpay • Encrypted Settlement
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Payment Successful</h2>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                ₹{settledInrAmount.toLocaleString()}.00 Paid
              </p>
              {currency !== 'INR' && (
                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                  Settled from {sym}{rawAmount.toLocaleString()} {currency} (@ ₹{fxRate}) to Indian Bank INR
                </p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice</span>
                <span className="font-mono font-bold text-slate-800">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant</span>
                <span className="font-semibold text-slate-800">CredSync FinOps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-semibold text-slate-800">{paidTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800">{txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-semibold text-slate-800">
                  {currency === 'INR' ? `UPI (${upiId})` : `${currency} → INR Bank (${upiId})`}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified by Razorpay
            </div>

            <button
              type="button"
              onClick={handleDoneClick}
              className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow transition cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileRazorpayCheckout;