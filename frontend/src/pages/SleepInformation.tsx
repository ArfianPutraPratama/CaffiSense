import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SleepInformation() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState<string>('');
  const [quality, setQuality] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');

  const handleNext = () => {
    if (!duration || !quality || !difficulty) return;
    
    const assessmentData = JSON.parse(localStorage.getItem('assessmentData') || '{}');
    localStorage.setItem('assessmentData', JSON.stringify({
      ...assessmentData,
      sleep_duration: parseInt(duration.replace('+', '')),
      sleep_quality: quality,
      sleep_difficulty_frequency: difficulty
    }));
    
    navigate('/check/experience');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="text-sm font-semibold text-coffee-500 tracking-wider uppercase mb-2">Langkah 2 dari 4</div>
        <h2 className="text-3xl font-bold text-gray-900">Informasi Tidur</h2>
        <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
          <div className="bg-coffee-500 h-full w-2/4"></div>
        </div>
      </div>

      <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Rata-rata kamu tidur berapa jam per malam?</label>
          <div className="flex flex-wrap gap-3">
            {['4', '5', '6', '7', '8', '9+'].map(option => (
              <button
                key={option}
                onClick={() => setDuration(option)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium transition ${duration === option ? 'bg-coffee-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Bagaimana kualitas tidurmu selama 7 hari terakhir?</label>
          <div className="flex flex-col gap-3">
            {['Sangat buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat baik'].map(option => (
              <button
                key={option}
                onClick={() => setQuality(option)}
                className={`w-full text-left px-5 py-4 rounded-xl font-medium transition ${quality === option ? 'bg-coffee-50 border-coffee-500 text-coffee-900 border-2' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Dalam 7 hari terakhir, berapa kali kamu sulit tidur setelah minum kopi?</label>
          <div className="flex flex-col gap-3">
            {['Tidak pernah', '1–2 kali', '3–4 kali', '5–6 kali', 'Setiap hari'].map(option => (
              <button
                key={option}
                onClick={() => setDifficulty(option)}
                className={`w-full text-left px-5 py-4 rounded-xl font-medium transition ${difficulty === option ? 'bg-coffee-50 border-coffee-500 text-coffee-900 border-2' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => navigate('/check/coffee')}
            className="w-1/3 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition"
          >
            Kembali
          </button>
          <button 
            onClick={handleNext}
            disabled={!duration || !quality || !difficulty}
            className="w-2/3 bg-coffee-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-coffee-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}
