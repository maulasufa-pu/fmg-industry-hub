"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileAudio2,
  Headphones,
  Layers3,
  MessageCircle,
  Mic2,
  Music2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import GlobalPrice from "@/components/public/GlobalPrice";
import PaymentMethodsShowcase from "@/components/payments/PaymentMethodsShowcase";
import {
  ARRANGEMENT_ORDER_PATH,
  ARRANGEMENT_PORTFOLIO_PATH,
  NEW_CUSTOMER_PROMO_IDR,
} from "@/lib/arrangement";

type Copy = { id: string; en: string };
const copy = (id: string, en: string): Copy => ({ id, en });

const inputs = [
  copy("Voice note atau rekaman panduan", "A voice note or guide recording"),
  copy("Melodi, chord, atau lirik", "A melody, chords, or lyrics"),
  copy("Referensi dan arah genre", "References and a genre direction"),
  copy("Tujuan rilis dan karakter artis", "Release goals and artist identity"),
];

const packageItems = [
  copy("Pengembangan komposisi dan aransemen", "Composition development and arrangement"),
  copy("Produksi audio digital", "Digital audio production"),
  copy("Editing, mixing, dan mastering", "Editing, mixing, and mastering"),
  copy("Vocal directing", "Vocal direction"),
  copy("Review melalui milestone project", "Review through clear project milestones"),
  copy("File akhir sesuai scope yang disetujui", "Final files based on the approved scope"),
];

const outcomes = [
  {
    icon: Layers3,
    title: copy("Struktur yang bekerja", "A structure that works"),
    text: copy("Verse, chorus, bridge, transisi, dan dinamika dibangun agar lagu punya perjalanan yang jelas.", "Verses, choruses, bridges, transitions, and dynamics are shaped into a clear musical journey."),
  },
  {
    icon: Music2,
    title: copy("Identitas musikal", "A musical identity"),
    text: copy("Pilihan harmoni, rhythm, instrumen, dan sound diarahkan untuk memperkuat karakter lagu—bukan menutupinya.", "Harmony, rhythm, instrumentation, and sound choices strengthen the song's character instead of covering it."),
  },
  {
    icon: Headphones,
    title: copy("Hasil yang siap dilanjutkan", "A result ready to move forward"),
    text: copy("Satu flow menghubungkan aransemen, produksi, review, mixing, mastering, dan delivery.", "One connected workflow takes the work through arrangement, production, review, mixing, mastering, and delivery."),
  },
];

const process = [
  {
    title: copy("Kirim arah lagu", "Share your song direction"),
    text: copy("Ceritakan tujuan lagu, genre, referensi, materi yang sudah ada, dan target waktu.", "Tell us the goal, genre, references, available material, and target date."),
  },
  {
    title: copy("Kunci scope", "Lock the scope"),
    text: copy("FMG mengonfirmasi layanan, pendekatan kreatif, timeline, revisi, deliverables, dan pembayaran sebelum produksi.", "FMG confirms the services, creative direction, timeline, revisions, deliverables, and payment before production."),
  },
  {
    title: copy("Produksi dan review", "Production and review"),
    text: copy("Kamu memberi feedback pada setiap milestone yang disepakati agar keputusan tetap fokus dan terukur.", "You provide feedback at agreed milestones so every decision stays focused and measurable."),
  },
  {
    title: copy("Finalisasi dan delivery", "Finalization and delivery"),
    text: copy("Setelah approval dan milestone pembayaran terpenuhi, file akhir diserahkan sesuai scope project.", "After approval and the agreed payment milestone, final files are delivered according to the project scope."),
  },
];

const genres = ["Pop", "R&B", "Rock", "Electronic", "Acoustic", "Ballad", "Hip-hop", "Religious", "Cinematic", "Jingle", "Theme Song", "Custom"];

const faqs = [
  {
    q: copy("Apa yang perlu saya kirim untuk memulai?", "What do I need to send to get started?"),
    a: copy("Kirim materi yang paling jelas menggambarkan lagumu: voice note, vokal, melodi, chord, lirik, struktur kasar, serta dua atau tiga referensi. Beri tahu kami bagian mana yang paling kamu suka.", "Send whatever communicates the song best: a voice note, vocal, melody, chords, lyrics, a rough structure, and two or three references with notes about what you like."),
  },
  {
    q: copy("Apakah lagu saya akan dibeli atau diambil FMG?", "Will FMG buy or take my song?"),
    a: copy("Tidak. Di sini kamu membeli jasa aransemen dan produksi. Credit, ownership, session assets, material pihak ketiga, serta lisensi atau pengalihan apa pun hanya berlaku jika tertulis dalam dokumen project yang kamu setujui.", "No. This page sells arrangement and production services to you. Credits, ownership, session assets, third-party material, and any license or transfer only apply when written into the project documents you approve."),
  },
  {
    q: copy("Berapa harga jasa aransemen lagu?", "How much does music arrangement cost?"),
    a: copy("Paket project pertama tersedia seharga Rp6.000.000 untuk scope yang tercantum. Musisi sesi, rekaman studio, orkestrasi khusus, versi tambahan, kebutuhan rush, atau pekerjaan di luar scope akan dikonfirmasi terlebih dahulu.", "The first-project package is IDR 6,000,000 for the listed scope. Session musicians, studio recording, custom orchestration, additional versions, rush work, or anything outside the scope is confirmed separately."),
  },
  {
    q: copy("Berapa lama prosesnya?", "How long does the process take?"),
    a: copy("Timeline ditentukan setelah materi dan kompleksitas lagu diperiksa. Tanggal mulai, milestone review, dan target delivery ditulis sebelum produksi agar tidak ada janji waktu yang abstrak.", "The timeline is set after reviewing the material and complexity. The start date, review milestones, and target delivery are written down before production so there are no vague timing promises."),
  },
  {
    q: copy("Berapa kali revisi yang saya dapatkan?", "How many revision rounds do I receive?"),
    a: copy("Jumlah revisi mengikuti paket atau quote yang disetujui. Feedback dikumpulkan per milestone supaya setiap ronde revisi punya tujuan dan tidak mengulang keputusan yang sudah disetujui.", "The number of revisions follows the approved package or quote. Feedback is consolidated at each milestone so every revision round has a clear purpose."),
  },
  {
    q: copy("Apakah bisa dikerjakan sepenuhnya online?", "Can the project be completed fully online?"),
    a: copy("Bisa. Brief, referensi, komunikasi, review, revisi, status project, dan delivery dapat dijalankan secara online melalui flow FMG.", "Yes. The brief, references, communication, reviews, revisions, project status, and delivery can all run online through the FMG workflow."),
  },
  {
    q: copy("Apakah mixing dan mastering sudah termasuk?", "Are mixing and mastering included?"),
    a: copy("Ya, keduanya termasuk dalam Paket Project Pertama bersama editing. Detail format dan versi file akhir tetap mengikuti scope yang disetujui.", "Yes. Both are included in the First Project Package together with editing. Final file formats and versions still follow the approved scope."),
  },
  {
    q: copy("Apa bedanya aransemen dan pembuatan lagu?", "What is the difference between arrangement and song creation?"),
    a: copy("Aransemen cocok jika identitas inti lagunya—seperti melodi atau lirik—sudah ada dan perlu dikembangkan menjadi musik yang utuh. Kalau kamu baru punya cerita, tema, atau brief dan ingin membangun lagu dari awal, pilih jasa pembuatan lagu.", "Arrangement is ideal when the song's core identity—such as its melody or lyrics—already exists and needs to become a complete production. If you only have a story, theme, or brief and need the song built from the ground up, choose song creation."),
  },
];

export default function ArrangementServiceLanding() {
  const { language } = useLanguage();
  const t = (value: Copy) => value[language];
  const isId = language === "id";

  return (
    <main lang={language} data-performance-page className="overflow-hidden bg-[#050505] text-white">
      <section className="relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(124,58,237,0.28),transparent_30%),radial-gradient(circle_at_88%_30%,rgba(225,29,72,0.16),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 sm:pb-28 sm:pt-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/55">
            <Link href="/" className="transition hover:text-white">{isId ? "Beranda" : "Home"}</Link>
            <ChevronRight className="h-4 w-4" />
            <span aria-current="page">{isId ? "Jasa Aransemen Lagu" : "Music Arrangement Service"}</span>
          </nav>

          <div className="mt-14 grid items-end gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.6fr)]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                <Sparkles className="h-4 w-4" />
                {isId ? "Jasa aransemen lagu profesional" : "Professional music arrangement service"}
              </p>
              <h1 className="mt-6 max-w-5xl text-balance text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                {isId ? "Bawa ide lagumu menjadi produksi yang terdengar utuh." : "Turn your song idea into a production that feels complete."}
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-white/70 sm:text-xl">
                {isId
                  ? "FMG mengembangkan melodi, chord, lirik, atau rekaman panduanmu menjadi aransemen dengan struktur, dinamika, instrumen, dan arah sound yang dibangun khusus untuk karakter lagumu."
                  : "FMG develops your melody, chords, lyrics, or guide recording into an arrangement with structure, dynamics, instrumentation, and a sound direction intentionally built around the song."}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-black transition hover:-translate-y-0.5 hover:bg-violet-100">
                  {isId ? "Mulai aransemen lagu" : "Start my arrangement"} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={ARRANGEMENT_PORTFOLIO_PATH} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-bold transition hover:border-white/50 hover:bg-white/5">
                  {isId ? "Dengarkan portofolio" : "Hear the portfolio"} <Headphones className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/15 bg-white/[0.06] p-6 shadow-2xl shadow-violet-950/30 backdrop-blur sm:p-8">
              <p className="text-sm font-semibold text-white/55">{isId ? "Kamu bisa mulai dari" : "You can start with"}</p>
              <ul className="mt-5 space-y-4">
                {inputs.map((item) => (
                  <li key={item.en} className="flex items-start gap-3 text-sm leading-6 text-white/85">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> {t(item)}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-white/55">
                {isId ? "Tidak perlu menyiapkan materi yang sempurna. Yang kami butuhkan adalah arah yang jujur dan cukup jelas untuk dipahami." : "Your material does not need to be perfect. We need an honest direction that is clear enough to understand."}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950 sm:py-28" aria-labelledby="outcomes-title">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">{isId ? "Yang sebenarnya kamu beli" : "What you are actually buying"}</p>
            <h2 id="outcomes-title" className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">
              {isId ? "Bukan sekadar banyak instrumen. Setiap keputusan harus punya fungsi." : "Not simply more instruments. Every decision needs a purpose."}
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {outcomes.map(({ icon: Icon, title, text }) => (
              <article key={title.en} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-6 text-xl font-bold">{t(title)}</h3>
                <p className="mt-3 leading-7 text-slate-600">{t(text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="harga" className="border-y border-white/10 bg-[#0a0a0b] py-20 sm:py-28" aria-labelledby="price-title">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-300">{isId ? "Harga jasa aransemen lagu" : "Music arrangement pricing"}</p>
            <h2 id="price-title" className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{isId ? "Mulai dengan scope yang jelas." : "Start with a clear scope."}</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">
              {isId ? "Paket ini dibuat sebagai pintu masuk yang serius untuk customer baru—cukup lengkap untuk menyelesaikan satu lagu, tanpa menyembunyikan kebutuhan penting di balik harga awal yang semu." : "This is a serious entry point for new clients—complete enough to finish one song without hiding essential work behind an artificial starting price."}
            </p>
            <Link href="/pricing" className="mt-7 inline-flex items-center gap-2 font-bold text-violet-300 hover:text-violet-200">
              {isId ? "Lihat seluruh harga dan layanan" : "View all pricing and services"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <article className="relative overflow-hidden rounded-[2rem] border border-violet-400/30 bg-gradient-to-br from-violet-950/70 via-[#111114] to-rose-950/40 p-7 shadow-2xl sm:p-10">
            <div className="absolute right-0 top-0 rounded-bl-2xl bg-rose-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white">{isId ? "Customer baru" : "New client"}</div>
            <div className="pr-20">
              <p className="text-sm font-bold text-violet-200">{isId ? "Paket Project Pertama" : "First Project Package"}</p>
              <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl"><GlobalPrice usd={0} idr={NEW_CUSTOMER_PROMO_IDR} /></p>
              <p className="mt-2 text-sm text-white/55">{isId ? "untuk satu lagu · sesuai scope paket" : "for one song · within the package scope"}</p>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {packageItems.map((item) => (
                <li key={item.en} className="flex gap-3 text-sm leading-6 text-white/85"><Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />{t(item)}</li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/60">
              {isId ? "Musisi sesi, rekaman studio, orkestrasi khusus, versi tambahan, dan rush delivery hanya ditambahkan jika project memang membutuhkannya dan selalu dikonfirmasi sebelum produksi." : "Session musicians, studio recording, custom orchestration, additional versions, and rush delivery are added only when the project needs them and are always confirmed before production."}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-black transition hover:bg-violet-100">
                {isId ? "Pesan paket ini" : "Order this package"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services/inquiry" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-bold transition hover:bg-white/5">
                <MessageCircle className="h-4 w-4" /> {isId ? "Tanya dulu" : "Ask first"}
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-[#f4f1eb] py-20 text-slate-950 sm:py-28" aria-labelledby="fit-title">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">{isId ? "Pilih layanan yang tepat" : "Choose the right service"}</p>
            <h2 id="fit-title" className="mt-4 text-balance text-3xl font-black tracking-tight sm:text-5xl">{isId ? "Aransemen atau pembuatan lagu?" : "Arrangement or full song creation?"}</h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
              <Music2 className="h-8 w-8 text-violet-300" />
              <h3 className="mt-6 text-2xl font-black">{isId ? "Pilih jasa aransemen" : "Choose arrangement"}</h3>
              <p className="mt-4 leading-7 text-white/65">{isId ? "Cocok jika kamu sudah punya identitas inti lagu—melodi, lirik, chord, atau bentuk dasar—dan ingin mengembangkannya menjadi produksi musik yang utuh." : "Best when you already have the song's core identity—a melody, lyrics, chords, or a basic form—and want to develop it into a complete music production."}</p>
              <Link href={ARRANGEMENT_ORDER_PATH} className="mt-7 inline-flex items-center gap-2 font-bold text-violet-300">{isId ? "Mulai aransemen" : "Start arrangement"}<ArrowRight className="h-4 w-4" /></Link>
            </article>
            <article className="rounded-[2rem] border border-slate-300 bg-white p-8 sm:p-10">
              <Sparkles className="h-8 w-8 text-rose-600" />
              <h3 className="mt-6 text-2xl font-black">{isId ? "Pilih jasa pembuatan lagu" : "Choose song creation"}</h3>
              <p className="mt-4 leading-7 text-slate-600">{isId ? "Cocok jika kamu baru punya cerita, tema, pesan, atau brief dan ingin membangun lirik, melodi, komposisi, serta produksinya dari awal." : "Best when you only have a story, theme, message, or brief and need help building lyrics, melody, composition, and production from the ground up."}</p>
              <Link href="/id/jasa-pembuatan-lagu" className="mt-7 inline-flex items-center gap-2 font-bold text-violet-700">{isId ? "Lihat jasa pembuatan lagu" : "Explore song creation"}<ArrowRight className="h-4 w-4" /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950 sm:py-28" aria-labelledby="process-title">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">{isId ? "Cara order" : "How to order"}</p>
              <h2 id="process-title" className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{isId ? "Empat tahap. Satu flow." : "Four stages. One workflow."}</h2>
              <p className="mt-5 leading-7 text-slate-600">{isId ? "Setelah order selesai, project dilanjutkan melalui dashboard agar brief, keputusan, file, pembayaran, dan status tidak tercecer." : "Once the order is complete, the project continues in your dashboard so the brief, decisions, files, payments, and status stay connected."}</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {process.map((step, index) => (
                <li key={step.title.en} className="rounded-[1.75rem] border border-slate-200 p-6">
                  <span className="text-sm font-black text-violet-700">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-4 text-xl font-bold">{t(step.title)}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{t(step.text)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#09090b] py-20 sm:py-28" aria-labelledby="scope-title">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">{isId ? "Scope dan delivery" : "Scope and delivery"}</p>
              <h2 id="scope-title" className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{isId ? "Jelas sebelum produksi dimulai." : "Clear before production begins."}</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">{isId ? "Format final, versi tambahan, stems, kebutuhan vokal, musisi, deadline, dan jumlah revisi bukan asumsi. Semuanya dikonfirmasi dalam scope project." : "Final formats, additional versions, stems, vocal needs, musicians, deadlines, and revision rounds are not assumptions. They are confirmed in the project scope."}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Clock3, title: isId ? "Timeline tertulis" : "Written timeline", text: isId ? "Tanggal mulai, review, dan target delivery disepakati." : "Start, review, and target delivery dates are agreed." },
                { icon: FileAudio2, title: isId ? "Deliverables spesifik" : "Specific deliverables", text: isId ? "Format dan versi file akhir dicatat dalam project." : "Final formats and versions are recorded in the project." },
                { icon: Mic2, title: isId ? "Kebutuhan vokal" : "Vocal requirements", text: isId ? "Vocal directing dan kebutuhan rekaman dibedakan dengan jelas." : "Vocal direction and recording requirements are clearly separated." },
                { icon: CircleDollarSign, title: isId ? "Biaya terkontrol" : "Controlled cost", text: isId ? "Tambahan scope dikonfirmasi sebelum dikerjakan." : "Any additional scope is confirmed before work begins." },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <Icon className="h-6 w-6 text-emerald-400" />
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950 sm:py-28" aria-labelledby="genre-title">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">{isId ? "Lintas genre dan kebutuhan" : "Across genres and use cases"}</p>
              <h2 id="genre-title" className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{isId ? "Referensi memberi arah. Lagumu tetap punya identitas." : "References give direction. Your song keeps its identity."}</h2>
              <p className="mt-5 leading-7 text-slate-600">{isId ? "Kami membaca referensi untuk memahami energi, warna, groove, ruang, dan target produksi—bukan untuk menyalin lagu lain." : "We read references to understand energy, color, groove, space, and production goals—not to copy another song."}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {genres.map((genre) => <span key={genre} data-no-translate className="rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-bold">{genre}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f1eb] py-20 text-slate-950 sm:py-28" aria-labelledby="ownership-title">
        <div className="mx-auto max-w-5xl px-5">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-12">
            <ShieldCheck className="h-10 w-10 text-emerald-400" />
            <h2 id="ownership-title" className="mt-6 text-balance text-3xl font-black tracking-tight sm:text-5xl">{isId ? "Lagumu tidak sedang ditawarkan untuk kami beli." : "You are not pitching your song for us to buy."}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">{isId ? "Di sini FMG menawarkan jasa kreatif dan produksi untukmu. Ownership, credit, hak penggunaan, session assets, dan material pihak ketiga dijelaskan dalam dokumen project. Tidak ada pengalihan hak yang disembunyikan di balik tombol order." : "FMG sells creative and production services to you. Ownership, credits, usage rights, session assets, and third-party material are explained in the project documents. No rights transfer is hidden behind the order button."}</p>
            <Link href="/legal/terms" className="mt-7 inline-flex items-center gap-2 font-bold text-emerald-300">{isId ? "Baca ketentuan" : "Read the terms"}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950 sm:py-28" aria-labelledby="portfolio-title">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">{isId ? "Portofolio aransemen" : "Arrangement portfolio"}</p>
              <h2 id="portfolio-title" className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{isId ? "Dengarkan pekerjaannya, bukan sekadar klaimnya." : "Hear the work, not just the claims."}</h2>
              <p className="mt-5 leading-7 text-slate-600">{isId ? "Filter portofolio berdasarkan pekerjaan aransemen agar release, publishing, mixing, dan layanan lain tidak tercampur sebagai bukti yang sama." : "Filter the portfolio by arrangement work so releases, publishing, mixing, and other services are not presented as the same kind of proof."}</p>
            </div>
            <Link href={ARRANGEMENT_PORTFOLIO_PATH} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-violet-700">{isId ? "Buka portofolio" : "Open portfolio"}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-white pb-20 text-slate-950 sm:pb-28" aria-label={isId ? "Metode pembayaran" : "Payment methods"}>
        <div className="mx-auto max-w-7xl px-5"><PaymentMethodsShowcase compact /></div>
      </section>

      <section className="border-y border-white/10 bg-[#09090b] py-20 sm:py-28" aria-labelledby="faq-title">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.62fr_1.38fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">FAQ</p>
            <h2 id="faq-title" className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{isId ? "Sebelum kamu order." : "Before you order."}</h2>
            <p className="mt-5 leading-7 text-white/60">{isId ? "Kalau kebutuhanmu belum terjawab, kirim pertanyaan dulu tanpa perlu membuat akun." : "If your question is not answered here, send an inquiry before creating an account."}</p>
            <Link href="/services/inquiry" className="mt-7 inline-flex items-center gap-2 font-bold text-violet-300">{isId ? "Tanya tim FMG" : "Ask the FMG team"}<ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {faqs.map((faq) => (
              <details key={faq.q.en} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold marker:hidden">
                  {t(faq.q)}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-3xl pt-4 leading-7 text-white/60">{t(faq.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-violet-700 py-20 sm:py-28" aria-labelledby="final-cta-title">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.18),transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl px-5 text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-100">FMG Universe</p>
          <h2 id="final-cta-title" className="mt-5 text-balance text-4xl font-black tracking-tight sm:text-6xl">{isId ? "Lagunya sudah ada. Sekarang beri bentuk yang layak didengar." : "The song already exists. Now give it a form worth hearing."}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-violet-100">{isId ? "Mulai dari materi yang kamu punya. Kami bantu menentukan langkah berikutnya dengan scope yang jelas." : "Start with the material you have. We will help define the next step with a clear scope."}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-bold text-violet-800 transition hover:-translate-y-0.5 hover:bg-violet-50">{isId ? "Mulai project saya" : "Start my project"}<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/services/inquiry" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/35 px-7 py-3 font-bold text-white transition hover:bg-white/10">{isId ? "Konsultasi scope" : "Discuss the scope"}</Link>
          </div>
          <nav aria-label={isId ? "Halaman terkait" : "Related pages"} className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-violet-100">
            <Link href="/id/jasa-pembuatan-lagu" className="hover:text-white">{isId ? "Jasa pembuatan lagu" : "Song creation"}</Link>
            <Link href="/id/cara-bikin-lagu" className="hover:text-white">{isId ? "Cara bikin lagu" : "How to make a song"}</Link>
            <Link href="/pricing" className="hover:text-white">{isId ? "Harga" : "Pricing"}</Link>
            <Link href="/portfolio" className="hover:text-white">{isId ? "Portofolio" : "Portfolio"}</Link>
            <Link href="/about" className="hover:text-white">{isId ? "Tentang FMG" : "About FMG"}</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
