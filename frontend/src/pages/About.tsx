import { Database, Code } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Tentang & Sumber Data</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          CaffiCheck adalah alat skrining edukatif untuk mengeksplorasi hubungan antara konsumsi kopi dan pola tidur.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-coffee-100 p-4 rounded-full">
                <Database className="text-coffee-600 w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Referensi Kafein Kopi</h3>
                <p className="text-gray-500">USDA FoodData Central</p>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              Nilai estimasi kafein didasarkan pada database USDA FoodData Central. Secara spesifik, referensi menggunakan entri kopi seduh reguler.
            </p>
            <ul className="text-sm text-gray-700 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <li><strong>Food:</strong> Beverages, coffee, brewed, prepared with tap water</li>
              <li><strong>FDC ID:</strong> 171890</li>
              <li><strong>Caffeine:</strong> 40 mg / 100 g</li>
              <li><strong>Reference Serving:</strong> 1 cup / 237 g</li>
              <li><strong>Estimated Caffeine:</strong> 94.8 mg/cup</li>
            </ul>
            <a href="https://fdc.nal.usda.gov/food-details/171890/nutrients" target="_blank" rel="noreferrer" className="inline-block mt-4 text-coffee-600 font-medium hover:underline">
              Lihat Sumber →
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-coffee-100 p-4 rounded-full">
              <Code className="text-coffee-600 w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Dataset Machine Learning</h3>
              <p className="text-gray-500">Model Prediksi Dampak Tidur</p>
            </div>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            Model prediksi dilatih menggunakan dataset <code className="bg-gray-100 px-2 py-1 rounded text-sm text-pink-600">caffeine_intake_tracker.csv</code> untuk menemukan pola antara kebiasaan minum kopi dan dampak tidur yang dilaporkan.
          </p>
          <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200">
            Catatan: Database referensi USDA dan dataset ML memiliki tujuan yang berbeda. USDA digunakan untuk menghitung estimasi asupan secara real-time, sedangkan dataset CSV khusus digunakan untuk melatih model prediksi Random Forest.
          </p>
        </div>
      </div>
    </div>
  );
}
