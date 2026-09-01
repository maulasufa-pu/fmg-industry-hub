"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  Check,
  Download,
  Gauge,
  Headphones,
  Layers3,
  LockKeyhole,
  Music2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type ToolMode = "music" | "isolate";
type AudioResult = { url: string; filename: string };

const waveform = [34, 58, 43, 76, 48, 92, 64, 39, 83, 56, 96, 68, 44, 87, 52, 73, 41, 90, 61, 47, 79, 55, 88, 37];
const durations = [10, 20, 30, 45, 60] as const;

function responseFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition") || "";
  return disposition.match(/filename="([^"]+)"/i)?.[1] || fallback;
}

async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown };
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TuneXpertClient() {
  const { pick } = useLanguage();
  const rootRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<ToolMode>("music");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(20);
  const [instrumental, setInstrumental] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [result, setResult] = useState<AudioResult | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setSourcePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSourcePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const replaceResult = (next: AudioResult | null) => {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return next;
    });
  };

  const selectMode = (next: ToolMode) => {
    if (busy) return;
    setMode(next);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || !rootRef.current) return;
    rootRef.current.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    rootRef.current.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
  };

  const generateMusic = async () => {
    if (prompt.trim().length < 20 || busy) return;
    setBusy(true);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
    try {
      const response = await fetch("/api/tunexpert/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, title, durationSeconds: duration, instrumental }),
      });
      if (!response.ok) {
        setAuthRequired(response.status === 401);
        throw new Error(await responseError(response, pick("Musik belum berhasil dibuat.", "Music could not be generated.")));
      }
      const blob = await response.blob();
      replaceResult({
        url: URL.createObjectURL(blob),
        filename: responseFilename(response, `${title.trim() || "tunexpert-track"}.mp3`),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : pick("Terjadi kesalahan.", "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const isolateAudio = async () => {
    if (!file || busy) return;
    if (file.size > 4 * 1024 * 1024) {
      setError(pick("Ukuran file maksimal 4 MB.", "Maximum file size is 4 MB."));
      return;
    }
    setBusy(true);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
    try {
      const form = new FormData();
      form.append("audio", file);
      const response = await fetch("/api/tunexpert/isolate", { method: "POST", body: form });
      if (!response.ok) {
        setAuthRequired(response.status === 401);
        throw new Error(await responseError(response, pick("Audio belum berhasil dibersihkan.", "Audio could not be isolated.")));
      }
      const blob = await response.blob();
      replaceResult({
        url: URL.createObjectURL(blob),
        filename: responseFilename(response, "tunexpert-isolated.mp3"),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : pick("Terjadi kesalahan.", "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const chooseFile = (next: File | null) => {
    if (!next) return;
    setFile(next);
    setError(null);
    setAuthRequired(false);
    replaceResult(null);
  };

  return (
    <main
      ref={rootRef}
      onPointerMove={handlePointerMove}
      className="relative min-h-screen overflow-hidden bg-[#090817] text-white [--pointer-x:50%] [--pointer-y:30%]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--pointer-x)_var(--pointer-y),rgba(255,116,177,0.17),transparent_28%),linear-gradient(145deg,#080714_0%,#11102a_42%,#080812_100%)]" />
        <motion.div className="absolute -left-32 top-24 h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/20 blur-[110px]" animate={{ x: [0, 80, 10], y: [0, 40, 0], scale: [1, 1.16, 1] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -right-28 top-[30rem] h-[30rem] w-[30rem] rounded-full bg-orange-500/15 blur-[120px]" animate={{ x: [0, -55, 0], y: [0, -65, 0], scale: [1.1, 0.9, 1.1] }} transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }} />
        <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <section className="relative mx-auto max-w-[1500px] px-5 pb-24 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-center gap-3">
              <span data-no-translate className="rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-white/80 backdrop-blur-xl">FMG LABS / tuneXpert</span>
              <span className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />{pick("Mesin kreatif aktif", "Creative engine online")}</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="max-w-5xl text-[clamp(3.8rem,9vw,9rem)] font-black uppercase leading-[0.78] tracking-[-0.07em]">
              <span className="block">Shape</span>
              <span className="block bg-gradient-to-r from-[#ff78b8] via-[#f6a3ff] to-[#ffb05c] bg-clip-text text-transparent">the sound.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 max-w-2xl text-lg leading-8 text-white/64 sm:text-xl">
              {pick("Ubah arahan kreatif menjadi musik orisinal, atau bersihkan suara dari rekaman yang ramai—dalam satu ruang kerja yang fokus.", "Turn a creative direction into original music, or recover a clean voice from a noisy recording—all in one focused workspace.")}
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#111026]/70 p-5 shadow-[0_35px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent" />
            <div className="flex h-56 items-center justify-center gap-1.5 overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-fuchsia-400/20 via-purple-500/5 to-orange-400/15 px-5">
              {waveform.map((height, index) => (
                <motion.span key={index} className="w-1.5 rounded-full bg-gradient-to-t from-orange-300 via-pink-300 to-white sm:w-2" style={{ height: `${height}%` }} animate={{ scaleY: [0.35, 1, 0.48] }} transition={{ duration: 0.9 + (index % 5) * 0.15, repeat: Infinity, ease: "easeInOut", delay: index * 0.035 }} />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-5">
              <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-pink-300">LIVE AUDIO ENGINE</p><p className="mt-1 text-sm text-white/55">Music v2 · Voice Isolator</p></div>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#111026]"><Headphones className="h-5 w-5" /></div>
            </div>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-5 border-y border-white/10 py-6 sm:grid-cols-3">
          {[
            [ShieldCheck, pick("API key aman di server", "Server-side API security")],
            [Gauge, pick("Output MP3 siap dipreview", "Preview-ready MP3 output")],
            [LockKeyhole, pick("Login wajib untuk melindungi kredit", "Login required to protect credits")],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return <div key={String(label)} className="flex items-center gap-3 text-sm font-medium text-white/65"><FeatureIcon className="h-5 w-5 text-pink-300" />{String(label)}</div>;
          })}
        </div>
        <p className="mt-4 max-w-4xl text-xs leading-5 text-white/35">
          {pick("Powered by ElevenLabs. Prompt atau audio yang kamu kirim diteruskan secara aman ke ElevenLabs hanya untuk menjalankan proses yang kamu minta. FMG tidak menyimpan file hasil di servernya.", "Powered by ElevenLabs. The prompt or audio you submit is securely sent to ElevenLabs only to perform the process you request. FMG does not retain the resulting file on its servers.")}
        </p>
      </section>

      <section className="relative mx-auto max-w-[1500px] px-5 pb-28 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-xs font-black uppercase tracking-[0.3em] text-pink-300">CHOOSE YOUR ENGINE</p><h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">{pick("Satu studio. Dua kemampuan.", "One studio. Two engines.")}</h2></div>
          <p className="max-w-md text-sm leading-6 text-white/50">{pick("Hasil tidak disimpan oleh FMG. Unduh sebelum meninggalkan halaman.", "FMG does not retain your result. Download it before leaving the page.")}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[.34fr_.66fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" onClick={() => selectMode("music")} aria-pressed={mode === "music"} className={`group relative min-h-56 overflow-hidden rounded-[1.75rem] border p-6 text-left transition duration-300 ${mode === "music" ? "border-pink-300/70 bg-gradient-to-br from-pink-400/25 to-purple-700/20 shadow-[0_22px_70px_rgba(236,72,153,.18)]" : "border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.07]"}`}>
              <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#151127]"><WandSparkles className="h-5 w-5" /></span><span className="text-xs font-bold tracking-[0.2em] text-white/40">01</span></div>
              <h3 className="mt-12 text-2xl font-black">{pick("Buat musik", "Generate music")}</h3><p className="mt-2 text-sm leading-6 text-white/55">{pick("Dari arahan kreatif menjadi track orisinal.", "From creative direction to an original track.")}</p>
            </button>
            <button type="button" onClick={() => selectMode("isolate")} aria-pressed={mode === "isolate"} className={`group relative min-h-56 overflow-hidden rounded-[1.75rem] border p-6 text-left transition duration-300 ${mode === "isolate" ? "border-orange-300/70 bg-gradient-to-br from-orange-400/25 to-fuchsia-700/20 shadow-[0_22px_70px_rgba(251,146,60,.16)]" : "border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.07]"}`}>
              <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#151127]"><AudioLines className="h-5 w-5" /></span><span className="text-xs font-bold tracking-[0.2em] text-white/40">02</span></div>
              <h3 className="mt-12 text-2xl font-black">{pick("Isolasi suara", "Isolate voice")}</h3><p className="mt-2 text-sm leading-6 text-white/55">{pick("Kurangi noise dan musik latar dari suara.", "Reduce noise and background music around speech.")}</p>
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.055] p-5 shadow-[0_35px_100px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-400/10 blur-3xl" />
            <AnimatePresence mode="wait">
              {mode === "music" ? (
                <motion.div key="music" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                  <div className="flex items-center gap-3"><Music2 className="h-5 w-5 text-pink-300" /><span className="text-xs font-black uppercase tracking-[0.26em] text-white/55">MUSIC GENERATOR</span></div>
                  <h3 className="mt-5 text-3xl font-black tracking-[-0.03em] sm:text-5xl">{pick("Ceritakan dunia lagumu.", "Describe the world of your track.")}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{pick("Jelaskan suasana, tempo, instrumen, struktur, dan energi. Hindari nama artis, judul lagu, atau lirik berhak cipta.", "Describe mood, tempo, instruments, structure, and energy. Avoid artist names, song titles, or copyrighted lyrics.")}</p>

                  <div className="mt-8 grid gap-5">
                    <label className="grid gap-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{pick("Judul file", "File title")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="Neon Afterglow" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-pink-300/60 focus:ring-4 focus:ring-pink-300/10" /></label>
                    <label className="grid gap-2"><span className="flex justify-between text-xs font-bold uppercase tracking-[0.18em] text-white/60"><span>{pick("Arahan kreatif", "Creative direction")}</span><span className="font-medium tracking-normal text-white/30">{prompt.length}/4100</span></span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4_100} rows={7} placeholder={pick("Contoh: track elektronik sinematik, 128 BPM, bass yang hangat, synth lebar, build perlahan, drop yang emosional, tanpa vokal...", "Example: cinematic electronic track, 128 BPM, warm bass, wide synths, a slow build and an emotional drop, no vocals...")} className="resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-4 leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-pink-300/60 focus:ring-4 focus:ring-pink-300/10" /></label>
                    <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                      <div><span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{pick("Durasi", "Duration")}</span><div className="mt-2 flex flex-wrap gap-2">{durations.map((value) => <button type="button" key={value} onClick={() => setDuration(value)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${duration === value ? "bg-white text-[#151127]" : "border border-white/10 bg-white/5 text-white/55 hover:bg-white/10"}`}>{value}s</button>)}</div></div>
                      <label className="flex min-w-48 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span><strong className="block text-sm">Instrumental</strong><span className="text-xs text-white/40">{instrumental ? "ON" : "OFF"}</span></span><input type="checkbox" checked={instrumental} onChange={(event) => setInstrumental(event.target.checked)} className="h-5 w-5 accent-pink-400" /></label>
                    </div>
                    <button type="button" onClick={() => void generateMusic()} disabled={busy || prompt.trim().length < 20} className="group mt-2 flex min-h-14 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#ff5fa2] via-[#ff7885] to-[#ff9d49] px-6 font-black text-white shadow-[0_16px_45px_rgba(255,95,162,.28)] transition hover:scale-[1.01] hover:shadow-[0_18px_55px_rgba(255,95,162,.4)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">{busy ? <><Sparkles className="h-5 w-5 animate-spin" />{pick("Sedang membangun track...", "Building your track...")}</> : <>{pick("Generate musik", "Generate music")}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>}</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="isolate" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                  <div className="flex items-center gap-3"><Layers3 className="h-5 w-5 text-orange-300" /><span className="text-xs font-black uppercase tracking-[0.26em] text-white/55">VOICE ISOLATOR</span></div>
                  <h3 className="mt-5 text-3xl font-black tracking-[-0.03em] sm:text-5xl">{pick("Bawa suaranya ke depan.", "Bring the voice forward.")}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{pick("Unggah rekaman untuk mengurangi noise, ambience, dan musik latar. Fitur ini dioptimalkan untuk suara atau ucapan—bukan pemisahan stem penuh.", "Upload a recording to reduce noise, ambience, and background music. This is optimized for voice or speech—not full multitrack stem separation.")}</p>

                  <input ref={fileInputRef} type="file" accept="audio/*,.aac,.aiff,.flac,.m4a,.mp3,.mp4,.ogg,.opus,.wav,.webm" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0] ?? null); }} className={`mt-8 grid min-h-72 w-full place-items-center rounded-[1.75rem] border border-dashed px-6 text-center transition ${dragging ? "border-orange-300 bg-orange-300/15 scale-[1.01]" : "border-white/20 bg-black/15 hover:border-orange-300/50 hover:bg-white/[0.045]"}`}>
                    <span><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#151127]"><UploadCloud className="h-7 w-7" /></span><strong className="mt-5 block text-xl">{file ? file.name : pick("Tarik audio ke sini", "Drop your audio here")}</strong><span className="mt-2 block text-sm text-white/45">{file ? `${formatBytes(file.size)} · ${file.type || "audio"}` : pick("atau sentuh untuk memilih · maksimal 4 MB", "or tap to browse · maximum 4 MB")}</span></span>
                  </button>
                  {file && <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-3"><div className="min-w-0 flex-1">{sourcePreview && <audio controls src={sourcePreview} className="h-10 w-full" />}</div><button type="button" aria-label={pick("Hapus file", "Remove file")} onClick={() => setFile(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 hover:bg-white/10"><X className="h-4 w-4" /></button></div>}
                  <button type="button" onClick={() => void isolateAudio()} disabled={busy || !file} className="group mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#ff7a45] via-[#ff5f91] to-[#c76dff] px-6 font-black shadow-[0_16px_45px_rgba(255,122,69,.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">{busy ? <><AudioLines className="h-5 w-5 animate-pulse" />{pick("Sedang membersihkan audio...", "Cleaning the audio...")}</> : <>{pick("Isolasi suara", "Isolate voice")}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>}</button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(error || result) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`mt-6 rounded-[1.5rem] border p-5 ${error ? "border-red-300/25 bg-red-400/10" : "border-emerald-300/25 bg-emerald-300/10"}`}>
                  {error ? <div><p className="font-bold text-red-100">{error}</p>{authRequired && <Link href={`/login?next=/tuneXpert`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#151127]">{pick("Masuk untuk melanjutkan", "Sign in to continue")}<ArrowRight className="h-4 w-4" /></Link>}</div> : result ? <div><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-300 text-emerald-950"><Check className="h-5 w-5" /></span><div><strong className="block">{pick("Audio siap", "Your audio is ready")}</strong><span className="text-xs text-white/45">{pick("Preview lalu unduh hasilnya.", "Preview it, then download your result.")}</span></div></div><audio controls autoPlay src={result.url} className="w-full" /><a href={result.url} download={result.filename} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#151127] transition hover:scale-[1.01]"><Download className="h-4 w-4" />{pick("Unduh audio", "Download audio")}</a></div> : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-black/20 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p data-no-translate className="text-sm font-black uppercase tracking-[0.28em] text-pink-300">Beyond Sound. Built-in Intelligence.</p><h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-7xl">{pick("AI mempercepat ide. Keputusan musik tetap milikmu.", "AI accelerates the idea. The musical decision stays yours.")}</h2></div><Link href="/labs" className="inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-4 font-bold transition hover:border-white/50 hover:bg-white/10">FMG Labs <ArrowRight className="h-5 w-5" /></Link></div>
      </section>
    </main>
  );
}
