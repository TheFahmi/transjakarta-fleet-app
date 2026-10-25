# Sistem Manajemen Armada - Tes Teknikal Frontend Engineer PT Transportasi Jakarta

Aplikasi frontend untuk memantau armada kendaraan secara waktu nyata. Aplikasi ini dikembangkan sebagai pengerjaan tes teknikal posisi Frontend Engineer di PT Transportasi Jakarta. Data kendaraan, rute, dan trip diambil dari REST API publik MBTA V3 (Massachusetts Bay Transportation Authority) sebagai sumber data transportasi contoh sesuai dokumen tes, lalu ditampilkan dalam konteks pemantauan armada Transjakarta.

## Fitur

Checklist sesuai spesifikasi tes:

- [x] Mengambil data kendaraan melalui REST API MBTA V3 (`GET /vehicles`)
- [x] Menampilkan data kendaraan dalam bentuk grid Card: label kendaraan, indikator status saat ini (`IN_TRANSIT_TO`, `STOPPED_AT`, `INCOMING_AT` ditampilkan sebagai kotak warna solid dan label uppercase yang mudah dibaca), latitude, longitude, dan waktu update terakhir (format tanggal Indonesia dan waktu relatif, contoh: "5 menit lalu")
- [x] Pagination server-side dengan teks rentang data (contoh: "Menampilkan 1-10 dari 100 Data"), pilihan jumlah data per halaman (5 / 10 / 12 / 20 / 50, bawaan 12), informasi jumlah halaman, dan tombol Pertama, Sebelumnya, nomor halaman, Berikutnya, Terakhir
- [x] Filter kendaraan berdasarkan Rute dan Trip dalam bentuk dropdown custom multi-select dengan checkbox, kotak pencarian, chips pilihan terpilih, dan tombol hapus semua
- [x] Infinite scroll / lazy load pada daftar Rute dan Trip di dalam dropdown (IntersectionObserver memuat halaman berikutnya saat daftar di-scroll ke bawah)
- [x] Detail kendaraan dalam bentuk popup/modal: label, status, latitude, longitude, waktu update terakhir, data rute, data trip, dan data lain (bearing, kecepatan, status okupansi, urutan pemberhentian, direction ID, jumlah carriages, stop ID)
- [x] Bonus: peta posisi kendaraan di dalam popup menggunakan Leaflet dan tile OpenStreetMap
- [x] Indikator loading pada setiap halaman dan popup: skeleton card untuk daftar kendaraan, spinner untuk dropdown dan popup detail
- [x] Pesan error yang mudah dipahami dalam Bahasa Indonesia, dengan tombol "Muat Ulang", termasuk pesan khusus untuk rate limit (HTTP 429) dan kegagalan jaringan
- [x] Bonus: TypeScript di seluruh kode sumber
- [x] Pembaruan waktu nyata: data kendaraan dimuat ulang secara diam-diam (tanpa skeleton) setiap 30 detik untuk halaman dan filter yang sedang aktif; masthead menampilkan jam WIB, waktu data terakhir ("Data Per"), dan hitung mundur ke pembaruan berikutnya; polling berhenti otomatis saat tab disembunyikan atau popup detail terbuka, dan kegagalan pembaruan menampilkan pemberitahuan sambil mempertahankan data terakhir
- [x] Desain responsif: grid 1 kolom (mobile), 2 kolom (tablet), 3 kolom (desktop)

## Teknologi

| Teknologi | Kegunaan |
| --- | --- |
| React 19 | Library UI, functional components dan hooks |
| TypeScript | Tipe data statis untuk respons API dan props komponen |
| Vite | Build tool dan development server |
| Tailwind CSS v4 | Styling utility-first melalui plugin `@tailwindcss/vite` |
| Leaflet 1.9 | Peta interaktif pada popup detail (diintegrasikan langsung via `useRef` dan `useEffect`, tanpa react-leaflet) |
| MBTA V3 API | REST API publik berformat JSON:API sebagai sumber data kendaraan, rute, dan trip |
| Fetch API native | Pengambilan data dari browser, tanpa library HTTP tambahan |

## Cara Menjalankan

### Prasyarat

- Node.js versi 18 atau lebih baru (disarankan versi LTS terbaru)
- npm (terpasang bersama Node.js)
- Koneksi internet untuk mengakses `https://api-v3.mbta.com` dan tile peta OpenStreetMap. Tanpa API key.

### Langkah

```bash
cd transjakarta-fleet-app
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite di terminal, umumnya `http://localhost:5173`.

### Perintah lain

```bash
# Build untuk produksi (hasil di folder dist/)
npm run build

# Pratinjau hasil build produksi secara lokal
npm run preview

# Menjalankan unit test (Vitest)
npm test
```

### Pengujian

40 unit test dengan Vitest + React Testing Library (environment jsdom, tanpa memanggil API asli — fetch dimock):

- `src/lib/api.test.ts` (23 test) — `computePagination` dari `links.last` (termasuk link ter-encode dan halaman terakhir), parsing JSON:API `parseVehicle` beserta relasi route/trip, pembentukan URL dan penanganan error `fetchVehicles` (429, jaringan putus, detail error dari server), `fetchTripsPage` tanpa rute, pemetaan `friendlyError`, label status dan okupansi, serta format tanggal dan waktu relatif.
- `src/components/Pagination.test.tsx` (7 test) — teks rentang, penanda halaman aktif pada varian mobile dan desktop, callback navigasi dan per halaman, keadaan nonaktif di halaman pertama/terakhir, dan jendela halaman ringkas.
- `src/components/MultiSelectDropdown.test.tsx` (6 test) — membuka daftar, memilih lewat checkbox, pencarian, chip dan tombol Bersihkan, keadaan nonaktif beserta petunjuknya, dan pesan hasil kosong.
- `src/components/VehicleCard.test.tsx` (4 test) — isi kartu kendaraan, klik untuk membuka rincian, penanganan data kosong, dan label `StatusBadge`.

## Arsitektur

### Struktur Folder

```
transjakarta-fleet-app/
  index.html
  package.json
  vite.config.ts
  README.md
  src/
    main.tsx                        Titik masuk React
    index.css                       Tailwind CSS v4 + CSS Leaflet
    App.tsx                         Komposisi halaman utama dan state global halaman
    types/
      mbta.ts                       Tipe TypeScript untuk Vehicle, Route, Trip, dan JSON:API
    lib/
      api.ts                        Semua fungsi fetch, pembangunan query string,
                                    parsing JSON:API, helper pagination, dan format tanggal
    hooks/
      useVehicles.ts                Hook daftar kendaraan dengan AbortController
      useInfiniteOptions.ts         Hook generik daftar opsi dengan infinite scroll
    components/
      VehicleCard.tsx               Card satu kendaraan
      StatusBadge.tsx               Badge status kendaraan
      Pagination.tsx                Kontrol pagination server-side
      MultiSelectDropdown.tsx       Dropdown multi-select reusable (Rute dan Trip)
      VehicleDetailModal.tsx        Popup detail kendaraan + peta Leaflet
      SkeletonCard.tsx              Placeholder loading berbentuk card
      ErrorBanner.tsx               Banner error dengan tombol Muat Ulang
```

### Aliran Data

1. `App.tsx` menyimpan state halaman: `page`, `perPage`, `selectedRoutes`, `selectedTrips`, dan kendaraan yang dipilih untuk detail.
2. Perubahan state memicu hook terkait: `useVehicles` memanggil `fetchVehicles()` dan `useInfiniteOptions` memanggil `fetchRoutesPage()` atau `fetchTripsPage()` di `lib/api.ts`.
3. `lib/api.ts` membangun query string, memanggil Fetch API, memeriksa status HTTP, mem-parsing respons JSON:API (termasuk objek `included` untuk rute dan trip), lalu mengembalikan data yang sudah dinormalisasi.
4. Komponen menampilkan hasil: loading sebagai skeleton/spinner, error sebagai banner/pesan inline, dan data sebagai card, dropdown, pagination, atau modal.

Tidak ada pemanggilan `fetch` yang tersebar di komponen. Semua akses API terpusat di `lib/api.ts`.

## Jawaban untuk Pertanyaan Video Demo

### 1. Metode apa saja yang digunakan pada get data?

- Fetch API native browser (`fetch`) dengan header `Accept: application/vnd.api+json`. Tidak ada Axios atau library HTTP lain.
- `AbortController`: setiap permintaan baru membatalkan permintaan sebelumnya yang belum selesai, mencegah race condition saat pengguna berpindah halaman dengan cepat.
- Parsing JSON:API: respons MBTA memiliki `data`, `included`, dan `links`. Fungsi `parseVehicle` memetakan `relationships.route.data.id` dan `relationships.trip.data.id` ke objek lengkap di `included`.
- Parameter `include=trip,route`: data rute dan trip terkait diminta dalam satu permintaan yang sama, menghindari pola N+1.
- Query filter server-side: `filter[route]=id1,id2` dan `filter[trip]=id1,id2` dengan nilai digabung koma untuk multi-select.
- Error handling terpusat: status 429 dibedakan sebagai rate limit, kegagalan `fetch` sebagai masalah jaringan, dan error lain menampilkan detail dari API bila tersedia. Semua diterjemahkan menjadi pesan Bahasa Indonesia melalui `friendlyError()`.
- Tanpa API key: MBTA V3 dapat diakses secara anonim, dengan batas permintaan yang lebih ketat.

Endpoint yang dipakai:

| Endpoint | Kegunaan |
| --- | --- |
| `GET /vehicles?page[limit]=N&page[offset]=M&include=trip,route` | Daftar kendaraan dengan pagination dan filter |
| `GET /vehicles?filter[route]=...&filter[trip]=...` | Filter kendaraan berdasarkan rute dan/atau trip (digabung dengan pagination dan include) |
| `GET /vehicles/{id}?include=trip,route` | Detail satu kendaraan untuk popup |
| `GET /routes?page[limit]=20&page[offset]=M` | Daftar rute untuk dropdown, dimuat per halaman (infinite scroll) |
| `GET /trips?filter[route]=...&page[limit]=20&page[offset]=M` | Daftar trip untuk dropdown, wajib memakai filter rute |

### 2. Menggunakan apa dalam pembuatan UI-nya?

- React dengan functional components dan hooks saja (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`). Tidak ada class component.
- Tailwind CSS utility-first: layout grid responsif, spacing, warna, dan state hover/focus ditulis sebagai utility class di JSX. Tema bersih profesional: header biru gelap (slate-900), aksen biru (blue-600/700), latar abu terang, card putih.
- Komponen custom: `MultiSelectDropdown` (dropdown multi-select reusable dengan pencarian, checkbox, chips, infinite scroll, dipakai untuk Rute dan Trip melalui props generik), `VehicleDetailModal` (modal dengan backdrop, tutup via tombol, klik backdrop, dan Escape, serta kunci scroll body), dan `Pagination` (jendela nomor halaman dengan ellipsis).
- Leaflet untuk peta: paket `leaflet` murni diintegrasikan imperatif di dalam `useEffect` dengan `useRef`. Marker di latitude/longitude kendaraan, tile OpenStreetMap, instance peta dibersihkan (`map.remove()`) saat modal ditutup.
- Indikator loading: skeleton card untuk daftar, spinner CSS untuk dropdown dan popup.

### 3. Pagination menggunakan apa?

Pagination bersifat server-side menggunakan skema pagination resmi MBTA V3 (JSON:API):

- `page[limit]`: jumlah data per halaman, dari selector per halaman (5 / 10 / 12 / 20 / 50; bawaan 12).
- `page[offset]`: posisi awal data, dihitung `(halaman - 1) * perPage`.
- Server memotong data; browser hanya menerima satu halaman pada satu waktu.
- Total halaman dari `links.last`: `totalPages = floor(lastOffset / limit) + 1`.
- Catatan total data: MBTA tidak menyediakan `meta.total_count`. Total pada teks rentang adalah `lastOffset + limit` sebagai estimasi atas, kecuali pada halaman terakhir digunakan `lastOffset + jumlah item halaman tersebut` agar angka akhir rentang akurat. Pendekatan ini didokumentasikan pada komentar fungsi `computePagination` di `src/lib/api.ts`.
- Mengganti filter atau jumlah per halaman selalu mengembalikan halaman ke 1.
- Pola yang sama dipakai ulang untuk infinite scroll daftar Rute dan Trip.

## Catatan dan Keterbatasan API

- Trip wajib memakai filter: `GET /trips` tanpa `filter[...]` membalas HTTP 400 "At least one filter[] is required." Dropdown Trip dinonaktifkan sampai minimal satu rute dipilih, dengan hint "Pilih rute terlebih dahulu untuk memuat daftar trip". Memilih rute mengosongkan pilihan trip sebelumnya.
- Rate limit: akses anonim MBTA memiliki batas permintaan. Aplikasi membedakan error 429 dan menampilkan pesan untuk menunggu beberapa saat. API juga kadang lambat (sekitar 2-15 detik), sehingga skeleton dan spinner penting.
- Total data adalah estimasi: lihat penjelasan pagination di atas.
- Data MBTA adalah data transportasi wilayah Boston yang dipakai sebagai data contoh sesuai dokumen tes.

## Kemungkinan Pengembangan

- Pencarian kendaraan berdasarkan label atau ID.
- Filter tambahan berdasarkan status kendaraan dan okupansi.
- Menyimpan filter dan halaman di URL query string agar dapat dibagikan.
- Mode peta penuh yang menampilkan semua kendaraan pada halaman saat ini.
- Dukungan API key MBTA melalui variabel lingkungan untuk menaikkan batas rate limit.

## Lisensi dan Atribusi

- Data: MBTA V3 API, https://api-v3.mbta.com
- Peta: OpenStreetMap contributors
- Aplikasi ini dibuat untuk keperluan tes teknikal rekrutmen.
