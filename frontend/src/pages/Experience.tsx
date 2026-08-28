import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitAssessment } from '../services/api';
import { Loader2 } from 'lucide-react';

export default function Experience() {
  const navigate = useNavigate();
  const [experience, setExperience] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const assessmentData = JSON.parse(localStorage.getItem('assessmentData') || '{}');
      const finalData = {
        ...assessmentData,
        free_text_experience: experience,
        // Default demographics for MVP since not asked in UI
        age: 22,
        gender: 'Male'
      };
      
      const response = await submitAssessment(finalData);
      localStorage.setItem('assessmentResult', JSON.stringify({
        ...response.assessment,
        ai_analysis: response.ai_analysis
      }));
      navigate('/result');
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="text-sm font-semibold text-coffee-500 tracking-wider uppercase mb-2">Langkah 3 dari 4</div>
        <h2 className="text-3xl font-bold text-gray-900">Pengalamanmu</h2>
        <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
          <div className="bg-coffee-500 h-full w-3/4"></div>
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Ketika tidak minum kopi, apa yang biasanya kamu rasakan?</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Contoh: saya mengantuk dan sulit fokus saat mengerjakan tugas..."
            className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none transition resize-none text-gray-800"
          ></textarea>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => navigate('/check/sleep')}
            disabled={isSubmitting}
            className="w-1/3 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            Kembali
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !experience.trim()}
            className="w-2/3 bg-coffee-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-coffee-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Menganalisis...
              </>
            ) : (
              'Lihat Hasil'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
