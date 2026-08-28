import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logChallenge } from '../services/api';

export default function Challenge() {
  const navigate = useNavigate();
  const [day, setDay] = useState(1);
  const [cups, setCups] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [quality, setQuality] = useState('Baik');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await logChallenge({
        user_id: 1, // hardcoded for MVP
        day_number: day,
        coffee_cups: parseInt(cups),
        last_coffee_time: time,
        sleep_duration: parseInt(duration),
        sleep_quality: quality
      });
      navigate('/progress');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tantangan 7 Hari</h2>
        <p className="text-gray-600">Catat kebiasaan harian kopimu untuk melihat polanya.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hari ke-</label>
          <select value={day} onChange={e => setDay(parseInt(e.target.value))} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500">
            {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>Hari {d}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Berapa cangkir hari ini?</label>
          <input type="number" required min="0" value={cups} onChange={e => setCups(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jam kopi terakhir</label>
          <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Durasi tidur (jam)</label>
          <input type="number" required min="0" max="24" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kualitas tidur</label>
          <select value={quality} onChange={e => setQuality(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500">
            <option>Sangat buruk</option>
            <option>Buruk</option>
            <option>Cukup</option>
            <option>Baik</option>
            <option>Sangat baik</option>
          </select>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-coffee-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-coffee-700 transition disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
      </form>
    </div>
  );
}
