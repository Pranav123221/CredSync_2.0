import React, { useState } from 'react';
import Sidebar from './layouts/Sidebar';
import Dashboard from './components/Dashboard';
import MobileRazorpayCheckout from './components/MobileRazorpayCheckout';

const MERCHANT_PIN = '1234';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('merchant'); // 'merchant' | 'customer'
  const [isMerchantLocked, setIsMerchantLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const params = new URLSearchParams(window.location.search);
  const isMobilePay = params.get('pay') === '1';

  if (isMobilePay) {
    return (
      <MobileRazorpayCheckout
        creditId={params.get('id')}
        invoiceNumber={params.get('inv')}
        amount={params.get('amt')}
        customerName={params.get('cust')}
        initialCurrency={params.get('curr') || 'INR'}
      />
    );
  }

  const handleUnlockMerchant = (e) => {
    e.preventDefault();
    if (pinInput === MERCHANT_PIN) {
      setIsMerchantLocked(false);
      setViewMode('merchant');
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Galat PIN! Demo PIN 1234 daalo.');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {viewMode === 'merchant' && !isMerchantLocked && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Demo Role & Merchant Lock Bar */}
        <div className="max-w-7xl mx-auto mb-5 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">Role View:</span>
            <button
              type="button"
              onClick={() => {
                setViewMode('merchant');
                setPinError('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                viewMode === 'merchant'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Dukaandaar (Merchant)
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('customer');
                setPinError('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                viewMode === 'customer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Customer (Payment Only)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'merchant' && !isMerchantLocked ? (
              <button
                type="button"
                onClick={() => {
                  setIsMerchantLocked(true);
                  setPinInput('');
                  setPinError('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition cursor-pointer"
              >
                Lock Merchant Panel
              </button>
            ) : viewMode === 'merchant' && isMerchantLocked ? (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Merchant Panel Locked (PIN Required)
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Customer Payment Mode Active
              </span>
            )}
          </div>
        </div>

        {/* Locked Merchant PIN Gate */}
        {viewMode === 'merchant' && isMerchantLocked ? (
          <div className="max-w-md mx-auto mt-12 bg-white border border-slate-200 rounded-2xl p-7 shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto font-extrabold text-sm">
              LOCK
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Merchant Panel Locked</h2>
              <p className="text-xs text-slate-500 mt-1">
                Udhaar ledger, credit limits & Gemini AI assistant protected hain. Unlock karne ke liye PIN daalo (Demo PIN: <span className="font-mono font-bold">1234</span>).
              </p>
            </div>

            <form onSubmit={handleUnlockMerchant} className="space-y-3 text-left">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (1234)"
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-mono text-center tracking-widest focus:outline-none focus:border-blue-600"
                required
              />
              {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-bold transition cursor-pointer"
              >
                Unlock Dukaandaar Dashboard
              </button>
            </form>

            <button
              type="button"
              onClick={() => setViewMode('customer')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Switch to Customer Payment View Instead
            </button>
          </div>
        ) : (
          <Dashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            viewMode={viewMode}
          />
        )}
      </div>
    </div>
  );
}

export default App;