import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Coffee, Moon, Clock, Zap, Bot } from 'lucide-react';

export default function ResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem('assessmentResult');
    if (data) {
      setResult(JSON.parse(data));
    } else {
      navigate('/check/coffee');
    }
  }, [navigate]);

  if (!result) return null;

  const isHighImpact = result.ml_prediction === 1;

  const generateCaffeineDecayData = () => {
    if (!result || !result.last_coffee_time || !result.estimated_caffeine_mg) return [];
    
    // Parse last_coffee_time (e.g., "15:00")
    const [hours, minutes] = result.last_coffee_time.split(':').map(Number);
    const startHour = hours + (minutes / 60);
    const initialAmount = result.estimated_caffeine_mg;
    const halfLife = 5; // roughly 5 hours half-life
    
    const data = [];
    for (let i = 0; i <= 14; i++) {
      const currentHourFloat = startHour + i;
      const amount = initialAmount * Math.pow(0.5, i / halfLife);
      
      // format hour string
      let displayHour = Math.floor(currentHourFloat) % 24;
      const displayString = `${displayHour.toString().padStart(2, '0')}:00`;
      
      data.push({
        time: displayString,
        amount: Math.round(amount),
      });
    }
    return data;
  };

  const chartData = generateCaffeineDecayData();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Dampak Pada Tidurmu</h2>
        <div className={`inline-block px-8 py-4 rounded-2xl ${isHighImpact ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'} font-bold text-2xl`}>
          {isHighImpact ? 'TINGGI' : 'RENDAH'}
        </div>
        <p className="mt-6 text-gray-600 max-w-lg mx-auto">
          Berdasarkan pola data yang kamu masukkan, ML model mendeteksi bahwa konsumsi kopimu {isHighImpact ? 'berpotensi besar' : 'berpotensi kecil'} mempengaruhi kualitas tidurmu hari ini.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="bg-coffee-100 p-3 rounded-xl"><Coffee className="text-coffee-600 w-6 h-6" /></div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Kebiasaan Kopi</div>
            <div className="text-xl font-bold text-gray-900">{result.coffee_cups_per_day} gelas/hari</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="bg-coffee-100 p-3 rounded-xl"><Zap className="text-coffee-600 w-6 h-6" /></div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Estimasi Kafein</div>
            <div className="text-xl font-bold text-gray-900">{Math.round(result.estimated_caffeine_mg)} mg/hari</div>
            <div className="text-xs text-gray-400 mt-1">Berdasarkan referensi USDA (94.8 mg/gelas)</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl"><Clock className="text-indigo-500 w-6 h-6" /></div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Kopi Terakhir</div>
            <div className="text-xl font-bold text-gray-900">{result.last_coffee_time || 'N/A'}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl"><Moon className="text-blue-500 w-6 h-6" /></div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Ringkasan Tidur</div>
            <div className="text-xl font-bold text-gray-900">{result.sleep_duration} jam • {result.sleep_quality}</div>
          </div>
        </div>
      </div>
      
      {chartData.length > 0 && (
        <div className="bg-white p-8 rounded-3xl mb-8 border border-gray-100 shadow-sm">
          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900">Grafik Metabolisme Kafein</h3>
            <p className="text-sm text-gray-500 mt-2">
              Estimasi sisa kafein di tubuhmu dari waktu ke waktu (Batas aman tidur: ~50mg, Batas harian FDA: 400mg).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, (dataMax: number) => Math.max(dataMax, 420)]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} mg`, 'Sisa Kafein']}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <ReferenceLine y={400} label={{ position: 'top', value: 'Batas Harian FDA (400mg)', fill: '#ef4444', fontSize: 12 }} stroke="#ef4444" strokeDasharray="3 3" ifOverflow="extendDomain" />
                <ReferenceLine y={50} label={{ position: 'top', value: 'Batas Aman Tidur (50mg)', fill: '#10b981', fontSize: 12 }} stroke="#10b981" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {result.ai_analysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-3xl mb-8 border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Bot className="w-32 h-32 text-indigo-900" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-indigo-900">Analisis & Saran AI</h3>
              <span className="text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full">Powered by Gemini</span>
            </div>
            
            <div className="text-indigo-900 leading-relaxed space-y-4 prose prose-indigo max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="mb-3" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-extrabold text-indigo-950" {...props} />
                }}
              >
                {result.ai_analysis}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}



      <p className="text-center text-xs text-gray-400 mt-8 max-w-sm mx-auto">
        CaffiCheck memberikan prediksi edukatif berdasarkan informasimu. Aplikasi ini bukan diagnosis medis.
      </p>
    </div>
  );
}
