import { useEffect, useState } from 'react';
import { getChallengeProgress } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Progress() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallengeProgress(1) // hardcoded userId 1 for MVP
      .then(res => setData(res.progress))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Dasbor Progres</h2>
      <p className="text-gray-600 mb-8">Lacak pola kopimu vs. durasi tidurmu selama 7 hari.</p>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Memuat progres...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
          Belum ada data challenge.
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day_number" tickFormatter={(val) => `Hari ${val}`} stroke="#a3a3a3" />
                <YAxis yAxisId="left" stroke="#9f7850" />
                <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="coffee_cups" name="Coffee (Cups)" stroke="#9f7850" activeDot={{ r: 8 }} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="sleep_duration" name="Sleep (Hours)" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
