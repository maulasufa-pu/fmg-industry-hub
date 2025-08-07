import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-gray-50 text-gray-900">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Flemmo Music Industry Hub
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Solusi digital untuk produksi, publishing, dan distribusi musik
            dengan teknologi modern & AI.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/client/dashboard"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold shadow-lg transition"
            >
              Mulai Sekarang
            </Link>
            <Link
              href="#services"
              className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition"
            >
              Lihat Layanan
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Layanan Kami
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Produksi Musik",
                desc: "Dari aransemen hingga mastering, kami buat musik berkualitas tinggi.",
                icon: "🎵",
              },
              {
                title: "Publishing & Distribusi",
                desc: "Rilis musik Anda di platform global dengan mudah.",
                icon: "🌍",
              },
              {
                title: "AI Music Tools",
                desc: "Gunakan teknologi AI untuk komposisi, mixing, dan mastering otomatis.",
                icon: "🤖",
              },
            ].map((service, idx) => (
              <div
                key={idx}
                className="p-6 border rounded-xl shadow-sm hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="mt-2 text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Portofolio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-xl overflow-hidden shadow-lg hover:scale-105 transition transform"
              >
                <img
                  src={`https://source.unsplash.com/random/400x300?music,studio&sig=${item}`}
                  alt="Portfolio"
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">
                    Proyek Musik {item}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Contoh karya terbaru kami di industri musik.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Paket Harga
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Basic",
                price: "Rp 500K",
                features: ["1 Lagu", "Mixing & Mastering", "File MP3 & WAV"],
              },
              {
                name: "Pro",
                price: "Rp 1,5Jt",
                features: [
                  "3 Lagu",
                  "Mixing & Mastering",
                  "Publishing",
                  "Streaming Platforms",
                ],
                popular: true,
              },
              {
                name: "Expert",
                price: "Rp 5Jt",
                features: [
                  "Album Lengkap",
                  "AI Music Tools",
                  "Dolby Atmos",
                  "Global Distribution",
                ],
              },
            ].map((pkg, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-xl border shadow-sm hover:shadow-lg transition ${
                  pkg.popular ? "bg-indigo-600 text-white" : ""
                }`}
              >
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <p className="text-3xl font-extrabold mt-4">{pkg.price}</p>
                <ul className="mt-4 space-y-2">
                  {pkg.features.map((f, i) => (
                    <li key={i}>✅ {f}</li>
                  ))}
                </ul>
                <button
                  className={`mt-6 w-full py-2 font-semibold rounded-lg transition ${
                    pkg.popular
                      ? "bg-white text-indigo-600 hover:bg-gray-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                  }`}
                >
                  Pilih Paket
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Tentang Kami</h2>
          <p className="text-gray-600 leading-relaxed">
            Flemmo Music Global adalah perusahaan kreatif yang menyediakan
            layanan produksi, publishing, dan distribusi musik digital.
            Menggabungkan teknologi AI dengan kreativitas manusia untuk hasil
            terbaik bagi para musisi di seluruh dunia.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p>© 2025 Flemmo Music Global. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-indigo-400">Instagram</a>
            <a href="#" className="hover:text-indigo-400">YouTube</a>
            <a href="#" className="hover:text-indigo-400">LinkedIn</a>
          </div>
        </div>
      </footer>
    </main>
  );
}