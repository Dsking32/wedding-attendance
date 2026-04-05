import { useEffect, useState } from 'react';
import { getStats, getCheckinLogs } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0, sections: [] });
  const [logs, setLogs] = useState([]);
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([getStats(), getCheckinLogs()]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const pct = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-amber-700">Zainab & Desmond's Wedding</h1>
          <p className="text-xs text-stone-400">Attendance Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/guests')} className="text-sm text-stone-600 hover:text-amber-600">Guests</button>
          <button onClick={() => navigate('/checkin')} className="text-sm bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-700">Check-in Station</button>
          <button onClick={() => { logoutAdmin(); navigate('/'); }} className="text-sm text-stone-400 hover:text-red-500">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Total guests</p>
            <p className="text-3xl font-medium text-stone-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Checked in</p>
            <p className="text-3xl font-medium text-green-600">{stats.checkedIn}</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-3xl font-medium text-amber-600">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
          <div className="flex justify-between text-sm text-stone-500 mb-2">
            <span>Arrival progress</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-3">
            <div
              className="bg-amber-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="text-sm font-medium text-stone-700 mb-4">Arrivals by group</h3>
            <div className="space-y-3">
              {stats.sections?.map((s) => (
                <div key={s.section}>
                  <div className="flex justify-between text-xs text-stone-500 mb-1">
                    <span>{s.section}</span>
                    <span>{s.arrived}/{s.total}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
                      style={{ width: `${s.total > 0 ? (s.arrived / s.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="text-sm font-medium text-stone-700 mb-4">Recent arrivals</h3>
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-stone-700 font-medium">{log.name}</p>
                    <p className="text-xs text-stone-400">{log.section}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{log.method}</span>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p className="text-sm text-stone-400">No arrivals yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}