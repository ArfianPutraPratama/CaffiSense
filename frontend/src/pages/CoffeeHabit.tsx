import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CoffeeHabit() {
  const navigate = useNavigate();
  const [cups, setCups] = useState<string>('');
  const [size, setSize] = useState<string>('Medium');
  const [time, setTime] = useState<string>('');

  const handleNext = () => {
    if (!cups || !size || !time) return;
    
    // Save to local storage for the multi-step form
    const assessmentData = JSON.parse(localStorage.getItem('assessmentData') || '{}');
    localStorage.setItem('assessmentData', JSON.stringify({
      ...assessmentData,
      coffee_cups_per_day: parseInt(cups.replace('+', '')),
      coffee_size: size,
      last_coffee_time: time
    }));
    
    navigate('/check/sleep');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="text-sm font-semibold text-coffee-500 tracking-wider uppercase mb-2">Langkah 1 dari 4</div>
        <h2 className="text-3xl font-bold text-gray-900">Kebiasaan Kopi</h2>
        <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
          <div className="bg-coffee-500 h-full w-1/4"></div>
        </div>
      </div>

      <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Berapa kali kamu minum kopi dalam sehari?</label>
          <div className="flex flex-wrap gap-3">
            {['0', '1', '2', '3', '4', '5+'].map(option => (
              <button
                key={option}
                onClick={() => setCups(option)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium transition ${cups === option ? 'bg-coffee-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Ukuran kopi yang paling sering kamu minum?</label>
          <div className="grid grid-cols-3 gap-4">
            {['Kecil', 'Sedang', 'Besar'].map(option => (
              <button
                key={option}
                onClick={() => setSize(option)}
                className={`py-3 rounded-xl font-medium transition ${size === option ? 'bg-coffee-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                {option}
              </button>
            ))}
          </div>
          {size !== 'Sedang' && (
            <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Catatan: Estimasi kafein menggunakan standar USDA kopi seduh (1 gelas = 237g).
            </p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Biasanya kopi terakhir kamu diminum jam berapa?</label>
          <input 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full text-lg p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none transition"
          />
        </div>

        <button 
          onClick={handleNext}
          disabled={!cups || !size || !time}
          className="w-full bg-coffee-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-coffee-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}
