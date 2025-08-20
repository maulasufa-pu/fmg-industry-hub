// src/app/ui/panel/projects/components/WaveformPlayer.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CSSVarEq = CSSProperties & { ["--i"]?: number | string };

type Props = {
  src: string;            // storage path: "projectId/category/file.wav"
  title?: string;
  initialVolume?: number; // 0..1
};

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
};

// ganti type CSSVarStyle
type CSSVarStyle = CSSProperties & {
  ['--val']?: number | string;
  ['--track-fill']?: string;
  ['--track-bg']?: string;
};

function WaveLoader({ label }: { label?: string }) {
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center rounded-xl bg-slate-900/40 backdrop-blur-sm"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex flex-col items-center">
        {/* equalizer */}
        <div className="flex items-end gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const st: CSSVarEq = { ["--i"]: i };
            return <div key={i} className="eq-bar" style={st} />;
          })}
        </div>

        {/* shimmer line */}
        <div className="mt-3 h-2 w-64 max-w-[80vw] rounded-full loader-track" />

        <div className="mt-3 text-[11px] font-medium text-slate-200/90">
          {label ?? "Loading..."}
        </div>
      </div>
    </motion.div>
  );
}


export default function WaveformPlayer({ src, title = "Preview", initialVolume = 0.9 }: Props) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  const [audioUrl, setAudioUrl] = useState<string>("");
  const [peaks, setPeaks] = useState<number[] | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  
    // state baru
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingPeaks, setLoadingPeaks] = useState(false);

  const peaksTimerRef = useRef<number | null>(null);

  const splitPath = (p: string): { dir: string; name: string } => {
     const i = p.lastIndexOf("/");
    return i === -1 ? { dir: "", name: p } : { dir: p.slice(0, i), name: p.slice(i + 1) };
  };

  
  // ...di dalam component
  const progress = useMemo(() => (duration > 0 ? time / duration : 0), [time, duration]);
  
  const colors = useMemo(() => ({
    wave: "rgba(148,163,184,0.28)",
    progress: "rgba(168,85,247,0.95)",
    cursor: "rgba(196,181,253,1)",
    trackBg: "rgba(124,58,237,0.18)",
    trackFill: "rgba(168,85,247,0.95)",
  }), []);
  

  // 1) Signed URL untuk audio + (jika ada) peaks.json (server-side precompute)
  // 1) Ganti efek pengambilan URL & peaks: hilangkan .list(), langsung fetch peaks
    useEffect(() => {
    if (!src) return;
    let cancelled = false;
    // sebelum createSignedUrl audio
    setLoadingAudio(true);

    // 1) AUDIO: langsung sign → play bisa segera
    (async () => {
        const a = await supabase.storage.from("drafts").createSignedUrl(src, 3600);
        if (cancelled) return;
        if (a.error || !a.data?.signedUrl) {
        console.error("[Storage] gagal bikin signed URL:", a.error, src);
        setAudioUrl("");
        return;
        }
        setAudioUrl(a.data.signedUrl);
        setLoadingAudio(false);

        if (a.error || !a.data?.signedUrl) {
            setAudioUrl("");
            setLoadingAudio(false);
        return;
        }

    })();

    // 2) PEAKS: JANGAN sign dulu. cek exist pakai list + polling ringan
    const { dir, name } = splitPath(src);
    const peaksName = `${name}.peaks.json`;
    let tries = 0;

    const poll = async (): Promise<void> => {
        setLoadingPeaks(true);

        tries += 1;

        const listed = await supabase.storage.from("drafts").list(dir, { search: peaksName, limit: 1 });
        if (cancelled) return;

        const exists = Array.isArray(listed.data) && listed.data.some(f => f.name === peaksName);
        if (exists) {
        const signed = await supabase.storage.from("drafts").createSignedUrl(`${src}.peaks.json`, 3600);
        if (!signed.error && signed.data?.signedUrl) {
            try {
            const r = await fetch(signed.data.signedUrl, { cache: "no-store" });
            if (r.ok) {
                const j = (await r.json()) as unknown;
                const arr =
                Array.isArray(j) ? (j as number[]) :
                (typeof j === "object" && j !== null && Array.isArray((j as { peaks?: unknown }).peaks)
                    ? (j as { peaks: number[] }).peaks
                    : null);
                if (arr && arr.length > 32) {
                setPeaks(arr);
                setLoadingPeaks(false);
                return; // stop polling
                }
            }
            } catch (e) {
            console.warn("[PEAKS] fetch error:", e);
            }
        }
        }

        if (!cancelled && tries < 8) {
        // backoff: 1s, 2s, 3s, ... max 4s
        peaksTimerRef.current = window.setTimeout(poll, Math.min(1000 * tries, 4000));
        } else {
        setLoadingPeaks(false);
        }
    };

    poll();

    return () => {
        cancelled = true;
        if (peaksTimerRef.current) {
        window.clearTimeout(peaksTimerRef.current);
        peaksTimerRef.current = null;
        }
    };
    }, [src, supabase]);


    // 2) Saat membuat WaveSurfer, pasang handler error & matikan normalize
    useEffect(() => {
        if (!containerRef.current || wsRef.current) return; // ← guard cukup pakai wsRef

        const ws = WaveSurfer.create({
            container: containerRef.current!,
            height: 82,
            barWidth: 2,
            barGap: 1.5,
            barRadius: 2,
            normalize: false,
            cursorWidth: 2,
            cursorColor: colors.cursor,
            waveColor: colors.wave,
            progressColor: colors.progress,
            dragToSeek: true,
        });
        wsRef.current = ws;

        ws.on("ready", () => {
            setReady(true);
            const d = ws.getDuration() || 0;
            setDuration(d);
            ws.setVolume(volume);
        });

        // kalau decode sukses tapi 'ready' telat, tetap update duration
        ws.on("decode", (d?: number) => {
            const dur = typeof d === "number" ? d : ws.getDuration() || 0;
            if (dur > 0) setDuration(dur);
        });

        ws.on("error", (e: unknown) => {
            console.error("[WaveSurfer] error:", e);
            setReady(false);
        });

        ws.on("timeupdate", (t: number) => setTime(t || 0));
        ws.on("seeking", (t: number) => setTime(t || 0));
        ws.on("play", () => setPlaying(true));
        ws.on("pause", () => setPlaying(false));
        ws.on("finish", () => { setPlaying(false); setTime(0); });

        return () => {
            ws.destroy();
            wsRef.current = null; // ← penting, agar bisa dibuat lagi setelah remount
        };
        }, [colors.cursor, colors.progress, colors.wave, volume]);


    // 3) Loading audio (tetap sama, tapi sekarang peaks sudah datang tanpa .list())
    useEffect(() => {
    const ws = wsRef.current;
    if (!audioUrl || !ws) return;

    setReady(false);
    setTime(0);
    setDuration(0);

    ws.stop();

    const hasPeaks = Array.isArray(peaks) && peaks.length > 32;

    if (hasPeaks) {
        // ✅ bungkus dalam array
        ws.load(audioUrl, [Float32Array.from(peaks as number[])])
        .catch((e: unknown) => {
            console.error("[WaveSurfer] load error:", e, { audioUrl });
            setReady(false);
        });
    } else {
        ws.load(audioUrl)
        .catch((e: unknown) => {
            console.error("[WaveSurfer] load error:", e, { audioUrl });
            setReady(false);
        });
    }
    }, [audioUrl, peaks]);

  // 4) Volume
  useEffect(() => {
    wsRef.current?.setVolume(volume);
  }, [volume]);

  const toggle = () => {
    const ws = wsRef.current;
    if (!ws || !ready || !duration) return;
    ws.isPlaying() ? ws.pause() : ws.play();
  };

  // sebelum return(...)
    const volumeStyle: CSSVarStyle = {
    '--val': volume,
    '--track-fill': colors.trackFill,
    '--track-bg': colors.trackBg,
    };

    const seekStyle: CSSVarStyle = {
    '--val': progress,
    '--track-fill': colors.progress,
    '--track-bg': colors.wave,
    };

  return (
    <div className="rounded-2xl border border-slate-200/40 dark:border-slate-700/50 bg-slate-900/30 p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="grid h-12 w-12 place-content-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow"
          aria-label={playing ? "Pause" : "Play"}
          type="button"
        >
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate">{title}</span>
                <span>{fmt(time)} / {fmt(duration)}</span>
            </div>

            <div className="relative">
                <AnimatePresence>
                {(!ready || loadingAudio) && (
                    <WaveLoader
                    label={
                        loadingAudio
                        ? "Signing & fetching audio…"
                        : "Decoding audio…"
                    }
                    />
                )}
                </AnimatePresence>

                {/* badge kecil saat peaks masih diproses, tapi audio sudah siap */}
                {ready && loadingPeaks && (
                <motion.div
                    className="pointer-events-none absolute -top-1.5 right-0 rounded-full border border-violet-400/30 bg-violet-600/20 px-2 py-0.5 text-[10px] text-violet-100 shadow"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    Optimizing waveform…
                </motion.div>
                )}
                <div ref={containerRef} className={`w-full select-none ${ready ? "" : "opacity-0"}`} />
            </div>
        </div>

        {/* Volume (dengan bekas ungu) */}
        <div className="flex w-28 items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" className="text-slate-400" aria-hidden="true">
                <path fill="currentColor" d="M5 10v4h3l4 4V6l-4 4H5zm9.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 14.5 12zm0-7.5v3a7.5 7.5 0 0 1 0 9v3a10.5 10.5 0 0 0 0-15z"/>
            </svg>
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.currentTarget.value))}
                className="audio-range w-full"
                style={volumeStyle}
                aria-label="Volume"
            />
            </div>
      </div>
    </div>
  );
}

/* globals.css (range style)
.audio-range{ -webkit-appearance:none; appearance:none; background:transparent; height:22px; }
.audio-range::-webkit-slider-runnable-track{
  --track-h:4px; height:var(--track-h); border-radius:9999px;
  background:
    linear-gradient(var(--track-fill) 0 0) 0/ calc(var(--val,0) * 100%) 100% no-repeat,
    var(--track-bg);
}
.audio-range::-moz-range-track{ --track-h:4px; height:var(--track-h); border-radius:9999px; background:var(--track-bg); }
.audio-range::-moz-range-progress{ height:4px; border-radius:9999px; background:var(--track-fill); }
.audio-range::-webkit-slider-thumb{
  -webkit-appearance:none; width:16px; height:16px; margin-top:-6px;
  border-radius:9999px; background:#6d28d9; border:2px solid #a78bfa; box-shadow:0 0 0 4px rgba(167,139,250,.25);
}
.audio-range::-moz-range-thumb{
  width:16px; height:16px; border-radius:9999px; background:#6d28d9; border:2px solid #a78bfa; box-shadow:0 0 0 4px rgba(167,139,250,.25);
}
*/
