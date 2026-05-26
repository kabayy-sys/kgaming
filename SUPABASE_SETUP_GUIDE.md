# Supabase Setup Guide — K Gaming XCafe

## Langkah 1: Buat Akun & Project di Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Klik **"Start your project"** atau **"Sign Up"**
3. Login pakai GitHub atau email
4. Setelah login, klik **"New project"**
5. Isi form:
   - **Name**: `k-gaming-xcafe`
   - **Database Password**: Buat password (simpan baik-baik)
   - **Region**: Pilih **Singapore** (paling dekat ke Indonesia)
   - **Pricing Plan**: Free tier sudah cukup
6. Klik **"Create new project"**
7. Tunggu sekitar 2-3 menit sampai selesai

---

## Langkah 2: Ambil API Credentials

1. Setelah project selesai dibuat, kamu akan masuk ke dashboard project
2. Di sidebar kiri, klik **Project Settings** (ikon gear ⚙️)
3. Di menu **Project Settings**, klik **API**
4. Kamu akan melihat:
   - **Project URL** (contoh: `https://abcdefghijklm.supabase.co`)
   - **anon public key** (string panjang seperti `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
5. **Copy kedua value tersebut** — kita akan pakai nanti

---

## Langkah 3: Setup Database Schema

1. Di sidebar kiri, klik **SQL Editor** (ikon terminal >_)
2. Klik tombol **"New query"**
3. Buka file `supabase-schema.sql` di project ini (ada di folder utama)
4. **Copy seluruh isi file** `supabase-schema.sql`
5. Paste ke SQL Editor di Supabase
6. Klik tombol **"Run"** (atau tekan `Ctrl + Enter`)
7. Tunggu sampai muncul pesan **"Success. No rows returned"**
8. File ini akan:
   - ✅ Membuat tabel `staff_profiles` (dengan akun pagi01, malam01, owner)
   - ✅ Membuat tabel `devices` (dengan 12 sample device)
   - ✅ Membuat tabel `bookings`
   - ✅ Membuat tabel `activity_logs`
   - ✅ Membuat tabel `shift_notes`
   - ✅ Mengaktifkan Realtime untuk semua tabel

---

## Langkah 4: Aktifkan Realtime

1. Di sidebar kiri, klik **Database** (ikon database)
2. Klik tab **Replication**
3. Di bagian **Source**, kamu akan melihat tabel-tabel yang sudah ada
4. Pastikan tabel berikut sudah ada di publikasi `supabase_realtime`:
   - `devices` ✅
   - `bookings` ✅
   - `activity_logs` ✅
5. Jika belum, klik tombol **"Enable Realtime"** untuk masing-masing tabel

---

## Langkah 5: Hubungkan ke Project Lokal

1. Buka file `.env.local` di project ini (buat jika belum ada)
2. Isi dengan credential dari Langkah 2:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Ganti** `https://abcdefghijklm.supabase.co` dengan **Project URL** kamu
4. **Ganti** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` dengan **anon key** kamu

---

## Langkah 6: Jalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

---

## Akun Login yang Tersedia

| Username | Password | Role | Shift |
|----------|----------|------|-------|
| `pagi01` | `123456` | Staff | Pagi |
| `malam01` | `123456` | Staff | Malam |
| `owner` | `owner123` | Owner | - |

---

## Sample Devices yang Sudah Ada

| Device | Category | Status | Price |
|--------|----------|--------|-------|
| PS4 Reguler 1 | Reguler | ✅ Ready | Rp 10.000 |
| PS4 Reguler 2 | Reguler | 🎮 In Use | Rp 10.000 |
| PS4 Reguler 3 | Reguler | ✅ Ready | Rp 10.000 |
| PS4 Reguler 4 | Reguler | 📅 Booked | Rp 10.000 |
| PS4 Pro VIP 1.A | VIP 1.A | ✅ Ready | Rp 30.000 |
| Nintendo VIP 1.A | VIP 1.A | ✅ Ready | Rp 30.000 |
| Netflix VIP 1.A | VIP 1.A | ✅ Ready | Rp 30.000 |
| PS4 Pro VIP 1.B | VIP 1.B | ✅ Ready | Rp 30.000 |
| Nintendo VIP 1.B | VIP 1.B | 🎮 In Use | Rp 30.000 |
| Netflix VIP 1.B | VIP 1.B | ✅ Ready | Rp 30.000 |
| PS5 VIP 2 | VIP 2 | ✅ Ready | Rp 35.000 |
| Nintendo VIP 2 | VIP 2 | ✅ Ready | Rp 35.000 |
| Netflix VIP 2 | VIP 2 | 🎮 In Use | Rp 35.000 |

---

## Cara Kerja WhatsApp Booking

1. Customer buka `http://localhost:3000`
2. Pilih device yang statusnya **Ready**
3. Klik tombol **"Book Now"**
4. Isi form: Nama, Jam Mulai, Durasi
5. Klik **"Send via WhatsApp"**
6. Otomatis akan terbuka WhatsApp dengan pesan pre-filled
7. Customer tinggal klik **Send**
8. Staff login ke `/bookings` untuk **Approve** atau **Reject**

---

## Tips

- Staff shift pagi (`pagi01`) dan malam (`malam01`) bisa manage device & booking
- Owner (`owner`) bisa full akses termasuk manage staff
- Semua aktivitas tercatat otomatis di Activity Log
- Update status device langsung terlihat realtime
- Kalau mau deploy ke Vercel, tinggal connect repo GitHub ini