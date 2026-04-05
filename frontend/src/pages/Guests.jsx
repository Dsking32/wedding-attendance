import { useEffect, useState } from 'react';
import { getGuests, addGuest, bulkImport, deleteGuest, getQR } from '../api';
import { useNavigate } from 'react-router-dom';
import { downloadAllCards, downloadSingleCard } from '../components/AccessCard';

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState('');
  const [sections, setSections] = useState([]);
  const [newName, setNewName] = useState('');
  const [newSection, setNewSection] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchGuests(); }, [search, section, status]);

  const fetchGuests = async () => {
    try {
      const res = await getGuests({ search, section, status });
      setGuests(res.data);
      const unique = [...new Set(res.data.map((g) => g.section))].filter(Boolean);
      setSections(unique);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await addGuest({ name: newName, section: newSection || 'General' });
      setNewName('');
      setNewSection('');
      fetchGuests();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleBulk = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    const lines = bulkText.split('\n').filter((l) => l.trim());
    const guestList = lines.map((l) => ({ name: l.trim(), section: 'General' }));
    try {
      await bulkImport(guestList);
      setBulkText('');
      fetchGuests();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this guest?')) return;
    await deleteGuest(id);
    fetchGuests();
  };

  const handleQR = async (id) => {
    try {
      const res = await getQR(id);
      setQrModal(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDownloadAll = async () => {
    setGeneratingPdf(true);
    setPdfProgress(0);
    try {
      await downloadAllCards(guests, (current, total) => {
        setPdfProgress(Math.round((current / total) * 100));
      });
    } catch (err) { console.error(err); }
    setGeneratingPdf(false);
    setPdfProgress(0);
  };

  const handleDownloadSingle = async (guest) => {
    try {
      await downloadSingleCard(guest);
    } catch (err) { console.error(err); }
  };

  const checked = guests.filter((g) => g.checked_in).length;

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-medium text-amber-700">Guest Management</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-stone-500 hover:text-amber-600">
            Dashboard
          </button>
          <button onClick={() => navigate('/checkin')} className="text-sm bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-700">
            Check-in Station
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-medium text-stone-800">{guests.length}</p>
            <p className="text-xs text-stone-400 mt-1">Total guests</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-medium text-green-600">{checked}</p>
            <p className="text-xs text-stone-400 mt-1">Checked in</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-medium text-amber-600">{guests.length - checked}</p>
            <p className="text-xs text-stone-400 mt-1">Pending</p>
          </div>
        </div>

        {/* Add / Bulk import */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm font-medium text-stone-700 mb-3">Add single guest</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Guest name"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
              <input
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Group (optional)"
                className="w-36 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleAdd}
                disabled={loading}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm font-medium text-stone-700 mb-3">Bulk import (one name per line)</p>
            <div className="flex gap-2">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="John Smith&#10;Jane Doe&#10;..."
                className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 h-20 resize-none"
              />
              <button
                onClick={handleBulk}
                disabled={loading}
                className="bg-stone-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50 self-end"
              >
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Guest Table */}
        <div className="bg-white rounded-xl border border-stone-200">

          {/* Download all + progress */}
          <div className="px-4 pt-4 pb-3 border-b border-stone-100 flex justify-between items-center">
            <p className="text-sm text-stone-500">{guests.length} guests loaded</p>
            <button
              onClick={handleDownloadAll}
              disabled={generatingPdf || guests.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {generatingPdf
                ? `Generating PDF... ${pdfProgress}%`
                : `Download all ${guests.length} access cards`}
            </button>
          </div>

          {/* Search + filters */}
          <div className="p-4 border-b border-stone-100 flex gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests..."
              className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All groups</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="in">Checked in</option>
              <option value="out">Pending</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">Group</th>
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">PIN</th>
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">QR</th>
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">Time</th>
                  <th className="text-left px-4 py-3 text-xs text-stone-400 font-medium uppercase tracking-wide">Card</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g, i) => (
                  <tr key={g.id} className="border-b border-stone-50 hover:bg-stone-50">
                    <td className="px-4 py-3 text-stone-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{g.name}</td>
                    <td className="px-4 py-3 text-stone-500">{g.section}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-stone-100 px-2 py-1 rounded">{g.pin}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleQR(g.id)}
                        className="text-amber-600 hover:underline text-xs"
                      >
                        View QR
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        g.checked_in ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {g.checked_in ? 'Checked in' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-400">
                      {g.check_in_time
                        ? new Date(g.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDownloadSingle(g)}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                      >
                        Download
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {guests.length === 0 && (
              <div className="text-center py-12 text-stone-400 text-sm">No guests found</div>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setQrModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium text-stone-800 mb-1">{qrModal.guest?.name}</h3>
            <p className="text-xs text-stone-400 mb-4">
              PIN: {qrModal.guest?.pin} · {qrModal.guest?.section}
            </p>
            <img
              src={qrModal.qr_image}
              alt="QR Code"
              className="w-48 h-48 mx-auto border border-stone-200 rounded-lg"
            />
            <button
              onClick={() => setQrModal(null)}
              className="mt-4 text-sm text-stone-500 hover:text-stone-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}