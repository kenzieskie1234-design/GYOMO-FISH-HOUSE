GYOMO FISH HOUSE - FILE TERPISAH

ISI FOLDER:
1. index.html  = struktur halaman website
2. style.css   = desain, warna, layout, dan animasi
3. script.js   = fungsi website, animasi transisi, admin, dan konfigurasi Supabase
4. gyomo-supabase-setup.sql = perintah untuk menyiapkan database Supabase

PENTING:
- Ketiga file utama (index.html, style.css, script.js) harus tetap berada dalam SATU folder.
- Jangan ubah nama file.
- Jangan pindahkan style.css atau script.js ke folder lain.
- URL dan anon key Supabase yang kamu berikan sudah dimasukkan ke script.js.
- Anon key adalah public/anon key. Jangan pernah memasukkan service_role atau secret key ke file website.

CARA UPLOAD KE VERCEL:
1. Buat folder bernama gyomo-fish-house.
2. Masukkan index.html, style.css, dan script.js ke folder tersebut.
3. Untuk SQL, file gyomo-supabase-setup.sql hanya dipakai di Supabase SQL Editor, tidak perlu diunggah ke website publik.
4. Pastikan SQL sudah dijalankan di project Supabase dan akun admin sudah terdaftar di tabel gyomo_admins.
5. Unggah folder website ke GitHub lalu hubungkan repository ke Vercel (cara paling stabil untuk website statis).
   Alternatif: jika menggunakan upload manual, unggah folder yang berisi index.html, style.css, dan script.js secara bersamaan.
6. Setelah deploy, buka alamat Vercel dan tes halaman utama.
7. Akses login admin dengan menambahkan ?admin=1 di akhir alamat website.

CATATAN:
- Jangan hanya mengunggah index.html. Website membutuhkan style.css dan script.js juga.
- Jika mengedit script.js, ingat bahwa URL dan anon key sudah ada di bagian paling atas.
- Reservasi pada website masih berupa demo, belum terhubung ke sistem booking sungguhan.
