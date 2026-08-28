<x-mail::message>
# Halo, {{ $user->name }} 👋

Berikut adalah ringkasan konsumsi kopi dan kualitas tidur Anda selama **7 hari terakhir**.

<x-mail::panel>
### ☕ Statistik Kopi
- **Total Kopi:** {{ $stats['total_coffee'] }} gelas
- **Rata-rata Kafein Harian:** {{ $stats['avg_caffeine'] }} mg
</x-mail::panel>

<x-mail::panel>
### 🛏️ Statistik Tidur
- **Rata-rata Durasi Tidur:** {{ $stats['avg_sleep'] }} jam
- **Kualitas Tidur Mayoritas:** {{ $stats['majority_quality'] }}
</x-mail::panel>

Terus pantau konsumsi kafein Anda agar tidur lebih nyenyak bersama CaffiSense!

<x-mail::button :url="'http://localhost:5173/diagnosis'">
Lihat Dashboard
</x-mail::button>

Terima kasih,<br>
**Tim {{ config('app.name') }}**

---
<small>
Anda menerima email ini karena mengaktifkan fitur Laporan Mingguan. 
Untuk berhenti berlangganan, silakan ubah pengaturan di [Profil Anda](http://localhost:5173/profile).
</small>
</x-mail::message>
