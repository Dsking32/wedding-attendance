import { useState, useEffect } from 'react';
import { validateCheckin } from '../api';
import { useNavigate } from 'react-router-dom';

function IframeScanner({ onScan }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'QR_SCANNED') {
        onScan(e.data.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onScan]);

  return (
    <iframe
      src="/scanner.html"
      style={{
        width: '100%',
        aspectRatio: '4/3',
        border: 'none',
        borderRadius: '12px',
        display: 'block',
        marginBottom: '8px'
      }}
      allow="camera"
      title="QR Scanner"
    />
  );
}

export default function Checkin() {
  const [pin, setPin] = useState(['', '', '', '', '']);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [tab, setTab] = useState('pin');
  const navigate = useNavigate();

  const handleQRScan = async (text) => {
    setScanning(false);
    setLoading(true);
    try {
      const res = await validateCheckin({ qr_data: text });
      setResult(res.data);
      if (res.data.success) setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Guest not found' });
    }
    setLoading(false);
  };

  const handleTabChange = (newTab) => {
    setScanning(false);
    setTab(newTab);
    setResult(null);
    setCameraError('');
    setPin(['', '', '', '', '']);
  };

  const handleDigit = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    if (val && i < 4) document.getElementById(`p${i + 1}`)?.focus();
    if (i === 4 && val) {
      const full = next.join('');
      if (full.length === 5) submitPin(full);
    }
  };

  const handleBackspace = (e, i) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      document.getElementById(`p${i - 1}`)?.focus();
    }
  };

  const submitPin = async (pinStr) => {
    const code = pinStr || pin.join('');
    if (code.length < 5) return;
    setLoading(true);
    try {
      const res = await validateCheckin({ pin: code });
      setResult(res.data);
      setPin(['', '', '', '', '']);
      document.getElementById('p0')?.focus();
      if (res.data.success) setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Guest not found' });
      setPin(['', '', '', '', '']);
    }
    setLoading(false);
  };

  const isSuccess = result?.success;
  const isWarning = result?.already_checked_in;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-amber-700">Check-in Station</h1>
          <p className="text-xs text-stone-400">Zainab & Desmond's Wedding</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-stone-500 hover:text-amber-600"
        >
          Back to dashboard
        </button>
      </nav>

      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-sm">

          {/* Result box */}
          {result && (
            <div className={`rounded-2xl p-6 text-center mb-5 ${
              isSuccess ? 'bg-green-50 border border-green-200' :
              isWarning ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className={`text-5xl font-medium mb-3 ${
                isSuccess ? 'text-green-500' :
                isWarning ? 'text-amber-500' : 'text-red-500'
              }`}>
                {isSuccess ? '✓' : isWarning ? '!' : '✗'}
              </div>
              <p className={`text-xl font-medium mb-1 ${
                isSuccess ? 'text-green-800' :
                isWarning ? 'text-amber-800' : 'text-red-800'
              }`}>
                {isSuccess ? result.guest?.name :
                 isWarning ? result.guest?.name : 'Guest not found'}
              </p>
              <p className={`text-sm ${
                isSuccess ? 'text-green-600' :
                isWarning ? 'text-amber-600' : 'text-red-500'
              }`}>
                {isSuccess
                  ? `Welcome! · ${result.guest?.section}`
                  : isWarning
                  ? `Already checked in at ${new Date(result.guest?.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : result.error || 'No guest matched this code'}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-stone-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => handleTabChange('pin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'pin' ? 'bg-white text-amber-700 shadow-sm' : 'text-stone-500'
              }`}
            >
              PIN entry
            </button>
            <button
              onClick={() => handleTabChange('qr')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'qr' ? 'bg-white text-amber-700 shadow-sm' : 'text-stone-500'
              }`}
            >
              QR scanner
            </button>
          </div>

          {/* PIN TAB */}
          {tab === 'pin' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <p className="text-sm font-medium text-stone-600 mb-5 text-center">
                Enter guest's 5-digit PIN
              </p>
              <div className="flex gap-3 justify-center mb-5">
                {pin.map((d, i) => (
                  <input
                    key={i}
                    id={`p${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigit(e.target.value, i)}
                    onKeyDown={(e) => handleBackspace(e, i)}
                    className="w-12 h-14 text-center text-xl font-mono font-medium border border-stone-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                ))}
              </div>
              <button
                onClick={() => submitPin()}
                disabled={loading || pin.join('').length < 5}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-40"
              >
                {loading ? 'Checking...' : 'Validate guest'}
              </button>
            </div>
          )}

          {/* QR TAB */}
          {tab === 'qr' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <p className="text-sm font-medium text-stone-600 mb-4 text-center">
                Scan guest's QR code
              </p>

              {!scanning ? (
                <button
                  onClick={() => { setCameraError(''); setScanning(true); }}
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-4 text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Activate camera
                </button>
              ) : (
                <>
                  <IframeScanner onScan={handleQRScan} />
                  <button
                    onClick={() => setScanning(false)}
                    className="w-full bg-stone-600 hover:bg-stone-700 text-white rounded-xl py-3 text-sm font-medium"
                  >
                    Stop camera
                  </button>
                </>
              )}

              {cameraError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4 text-center">
                  {cameraError}
                </div>
              )}

              {loading && (
                <p className="text-center text-stone-500 text-sm mt-3">Validating guest...</p>
              )}

              {scanning && (
                <p className="text-center text-xs text-stone-400 mt-3">
                  Hold QR code steady in front of the camera
                </p>
              )}
            </div>
          )}

          <p className="text-center text-xs text-stone-400 mt-4">
            PIN works on all devices · QR scanning requires camera
          </p>
        </div>
      </div>
    </div>
  );
}