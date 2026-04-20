# Simulasi Tabrakan Benda 3D — Versi 2

Demo website fisika 3D bertema **tabrakan benda** dengan arsitektur berikut:

- **Vite** → bundler, dev server, dan build
- **Three.js** → scene, camera, lighting, mesh, render
- **Rapier** → physics world, rigid body, collider, collision event
- **requestAnimationFrame** → loop sinkronisasi fisika ke tampilan

## Fitur baru

- slider **massa** untuk bola kiri, bola kanan, dan kubus tengah
- slider **kecepatan awal** untuk setiap benda
- **vektor momentum** berupa panah 3D yang mengikuti nilai `p = m × v`
- **label momentum** di atas tiap benda
- tombol **Terapkan parameter**, **Luncurkan ulang**, **Pause**, dan **Slow motion**
- penghitung tabrakan dan penanda tumbukan terakhir
- siap di-deploy ke **GitHub Pages** lewat workflow Actions bawaan

## Cara menjalankan lokal

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

## Deploy ke GitHub Pages

1. Push proyek ini ke repository GitHub.
2. Buka **Settings → Pages**.
3. Pada **Build and deployment**, pilih **GitHub Actions**.
4. Pastikan branch utama Anda bernama `main` atau sesuaikan file workflow.
5. Push lagi jika perlu, lalu tunggu workflow selesai.

`vite.config.js` sudah disiapkan agar path dasar menyesuaikan nama repository saat build di GitHub Actions.

## Struktur folder

```text
physics-collision-3d/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ .gitignore
├─ index.html
├─ package.json
├─ README.md
├─ vite.config.js
└─ src/
   ├─ main.js
   └─ style.css
```


## Catatan kompatibilitas Vite
Proyek ini memakai `@dimforge/rapier3d-compat` agar lebih aman dijalankan di Vite tanpa plugin WebAssembly tambahan. Jika Anda sebelumnya sudah menginstal dependensi versi lama, hapus `node_modules` dan `package-lock.json`, lalu jalankan `npm install` ulang.
