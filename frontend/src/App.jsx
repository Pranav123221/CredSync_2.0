import React, { useState } from 'react';
import Sidebar from './layouts/Sidebar';
import Dashboard from './components/Dashboard';
import MobileRazorpayCheckout from './components/MobileRazorpayCheckout';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const params = new URLSearchParams(window.location.search);
  const isMobilePay = params.get('pay') === '1';

  if (isMobilePay) {
    return (
      <MobileRazorpayCheckout
        creditId={params.get('id')}
        invoiceNumber={params.get('inv')}
        amount={params.get('amt')}
        customerName={params.get('cust')}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-y-auto p-8">
        <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

export default App;