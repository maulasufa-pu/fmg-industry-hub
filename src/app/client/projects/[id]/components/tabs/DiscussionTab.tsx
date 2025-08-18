// src/app/admin/projects/[id]/components/tabs/DiscussionTab.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DiscussionMessage, ProjectSummary } from "../../types";
import { getSupabaseClient } from "@/lib/supabase/client";

type ChatMessage = DiscussionMessage & {
  author_display_name?: string | null;
  deleted_at?: string | null;
  updated_at?: string | null;  // ⬅️ tambahkan
};

interface DiscussionTabProps {
  project: ProjectSummary;
  messages: ChatMessage[] | null;             // ⬅️ ganti
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[] | null>>; // ⬅️ ganti
}

type ProfileRow = {
  id: string;
  staff_role: string[] | null;
  main_role: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

type MsgWithOptional = DiscussionMessage & {
  deleted_at?: string | null;
  author_display_name?: string | null;
};

const isUuid = (v: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const AnimatedCard = ({
  title,
  children,
  className = "",
  gradient = false
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}) => (
  <motion.section
    className={`relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-800/25 ${
      gradient
        ? "bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"
        : "bg-white dark:bg-gray-900"
    } ${className}`}
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
  >
    <div className="relative z-10 p-0">{children}</div>
    <div className="sr-only">{title}</div>
  </motion.section>
);

function ChatSkeleton() {
  // 6 baris skeleton; kiri/kanan selang-seling
  const rows = Array.from({ length: 6 });
  return (
    <div className="absolute inset-0 z-20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
      <div className="h-full overflow-hidden px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-5 md:gap-6 animate-pulse">
          {rows.map((_, i) => {
            const mine = i % 2 === 1; // selang-seling
            return (
              <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[92%] sm:max-w-[85%] md:max-w-[75%] relative flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"} my-2 sm:my-2.5`}>
                  <div
                    className={`rounded-2xl px-4 py-3 border ${
                      mine
                        ? "bg-blue-600/70 border-blue-700/60"
                        : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className={`mb-1 h-3 w-24 rounded ${mine ? "bg-blue-300/60" : "bg-gray-300/60"}`} />
                    <div className="h-3 w-56 rounded bg-gray-300/60 dark:bg-gray-700/60" />
                    <div className="mt-2 h-3 w-40 rounded bg-gray-200/60 dark:bg-gray-700/50" />
                  </div>
                  <div className="h-5 w-5 rounded-md bg-gray-200/60 dark:bg-gray-700/60" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MessageMenu({
  m,
  canManage,
  isMine,
  scrollElRef,
  onEdit,
  onDelete
}: {
  m: DiscussionMessage;
  canManage: boolean;
  isMine: boolean;
  scrollElRef: React.MutableRefObject<HTMLDivElement | null>;
  onEdit: (m: DiscussionMessage) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [openUp, setOpenUp] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // Tutup saat klik di luar
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!canManage) return null;

  const toggle = () => {
    const list = scrollElRef.current;
    const btn = btnRef.current;
    if (list && btn) {
      const listRect = list.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const spaceBelow = listRect.bottom - btnRect.bottom;
      const ESTIMATED_MENU_H = 96; // ~ tinggi menu
      setOpenUp(spaceBelow < ESTIMATED_MENU_H + 8);
    }
    setOpen(o => !o);
  };

  const sideClass = isMine ? "right-0" : "left-0";
  const vertClass = openUp ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top";

  return (
    <div className={`relative ${isMine ? "order-1" : "order-2"}`}>
      <button
        ref={btnRef}
        aria-label="Message actions"
        onClick={toggle}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      >
        ⋮
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`absolute ${sideClass} ${vertClass}
                      w-32 max-w-[calc(100vw-2rem)]
                      rounded-xl shadow-xl
                      bg-gray-900/95 text-white backdrop-blur-sm
                      overflow-hidden z-20`}
        >
          <button
            onClick={() => { setOpen(false); onEdit(m); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
          >
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(m.id); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 text-red-300"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}


export default function DiscussionTab({
  project,
  messages,
  setMessages
}: DiscussionTabProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(messages === null);
  
  // ⬇️ tambahkan:
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  // ⬇️ ubah canPost dari boolean -> boolean | null (null = belum tahu)
  const [canPost, setCanPost] = useState<boolean | null>(null);

  const uiLoading = loading || !authResolved; // tunggu data + auth siap

  const [isAdminOwner, setIsAdminOwner] = useState(false);
  const [selfDisplayName, setSelfDisplayName] = useState<string>("Me");
  // const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const userIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const atBottomRef = useRef(true);
  const justLoadedRef = useRef(true);

  // --- di bagian state paling atas (bareng state lain) ---
  const PAGE_SIZE = 50;                                    // NEW
  const [loadingOlder, setLoadingOlder] = useState(false); // NEW
  const [hasMore, setHasMore] = useState(true);            // NEW
  const topSentinelRef = useRef<HTMLDivElement | null>(null); // NEW

  // --- fungsi loadOlder (prepend + jaga posisi scroll) ---
  const loadOlder = useCallback(async () => {              // NEW
    if (loading || loadingOlder || !hasMore) return;
    const oldest = messages?.[0]?.created_at;
    if (!oldest) return;

    setLoadingOlder(true);
    const { data, error } = await supabase
      .from("discussion_messages_view")
      .select("id,project_id,author_id,content,created_at,deleted_at,author_display_name,updated_at")
      .eq("project_id", project.project_id)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    setLoadingOlder(false);
    if (error) return;

    const rows = (data ?? []) as ChatMessage[];
    if (rows.length < PAGE_SIZE) setHasMore(false);

    if (!rows.length) return;

    // prepend dalam urutan kronologis naik + dedupe
    const prepend = rows
      .slice().reverse()
      .filter(r => !(messages ?? []).some(m => m.id === r.id));

    if (!prepend.length) return;

    preserveScrollDuring(() => {
      setMessages(prev => [...prepend, ...(prev ?? [])]);
    });
  }, [loading, loadingOlder, hasMore, messages, project.project_id, supabase, setMessages]);

  // --- observer untuk auto-manggil loadOlder saat dekat atas ---
  useEffect(() => {                                       // NEW
    if (!topSentinelRef.current || !listRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadOlder();
        }
      },
      { root: listRef.current, rootMargin: "0px 0px 200px 0px", threshold: 0.01 }
    );
    io.observe(topSentinelRef.current);
    return () => io.disconnect();
  }, [loadOlder]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 80; // px dari bawah
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const preserveScrollDuring = (fn: () => void) => {
    const el = listRef.current;
    if (!el) return fn();
    const prevBottom = el.scrollHeight - el.scrollTop; // jarak dari bawah
    fn();
    requestAnimationFrame(() => {
      // pertahankan jarak dari bawah yang sama
      el.scrollTop = el.scrollHeight - prevBottom;
    });
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    // set nilai awal
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);


  // Auto-scroll ke bawah
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    const el = listRef.current;
    if (!el) return;
    const top = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  }, []);
  
  useEffect(() => {
    if (!uiLoading && justLoadedRef.current) {
      justLoadedRef.current = false;
      scrollToBottom();
    }
  }, [uiLoading, scrollToBottom]);

  // on mount
  useEffect(() => setInput(localStorage.getItem(`draft:${project.project_id}`) ?? ""), [project.project_id]);
  // on change
  useEffect(() => localStorage.setItem(`draft:${project.project_id}`, input), [input, project.project_id]);

  // useEffect(() => {
  //   const el = listRef.current; if (!el) return;
  //   const onScroll = () => setMenuOpenId(null);
  //   el.addEventListener("scroll", onScroll, { passive: true });
  //   return () => el.removeEventListener("scroll", onScroll);
  // }, []);

  // Resolve current user & authorization
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: ures } = await supabase.auth.getUser();
      const uid = ures.user?.id ?? null;
      if (!active) return;

      userIdRef.current = uid;     // boleh tetap dipakai untuk callback
      setViewerId(uid);            // ⬅️ pakai state untuk memicu re-render

      if (!uid) {
        setCanPost(false);
        setIsAdminOwner(false);
        setAuthResolved(true);     // ⬅️ auth selesai meski tidak login
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, main_role, staff_role, first_name, last_name, username")
        .eq("id", uid)
        .maybeSingle<ProfileRow>();

      const name =
        (prof?.first_name ? `${prof.first_name}${prof.last_name ? ` ${prof.last_name}` : ""}` : null) ??
        prof?.username ??
        "Me";
      setSelfDisplayName(name);

      const hasStaff = Array.isArray(prof?.staff_role) && (prof?.staff_role?.length ?? 0) > 0;
      const hasMain = (prof?.main_role ?? null) !== null;
      setIsAdminOwner(Boolean(prof?.main_role === "admin" || prof?.main_role === "owner"));

      const { data: asg } = await supabase
        .from("assignment_view")
        .select("assignment_id")
        .eq("project_id", project.project_id)
        .eq("user_id", uid)
        .limit(1);

      const assigned = (asg?.length ?? 0) > 0;

      setCanPost(hasStaff || hasMain || assigned);
      setAuthResolved(true);       // ⬅️ tandai auth sudah selesai dievaluasi
    })();
    return () => { active = false; };
  }, [project.project_id, supabase]);

  // Initial fetch
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (messages !== null) {
      setLoading(false);
      setTimeout(() => {
        // biarkan AnimatePresence exit dengan smooth; tidak perlu state baru,
        // karena overlay tetap berdasarkan `loading`
      }, 180);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("discussion_messages_view")
        .select("id,project_id,author_id,content,created_at,updated_at,deleted_at,author_display_name")
        .eq("project_id", project.project_id)
        .order("created_at", { ascending: false }) // ambil yang terbaru dulu
        .limit(50);                                 // batasi 50

      if (!error) {
        // balikin supaya kronologis naik di UI
        setMessages(((data ?? []) as ChatMessage[]).slice().reverse());
      }
      setLoading(false);
      setTimeout(() => {
        // biarkan AnimatePresence exit dengan smooth; tidak perlu state baru,
        // karena overlay tetap berdasarkan `loading`
      }, 180);
      scrollToBottom();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.project_id, supabase]);

  // Realtime subscription (INSERT/UPDATE/DELETE)
  useEffect(() => {
    const channel = supabase
      .channel(`discussion:${project.project_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "discussion_messages", filter: `project_id=eq.${project.project_id}` },
        async (payload) => {
          const base = payload.new as ChatMessage;
          const { data: row } = await supabase
            .from("discussion_messages_view")
            .select("id,project_id,author_id,content,created_at,deleted_at,author_display_name")
            .eq("id", base.id)
            .single();

          const current = (row ?? base) as ChatMessage;

          setMessages(prev => {
            const arr = prev ?? [];
            if (arr.some(m => m.id === current.id)) return prev;
            return [...arr, current];
          });

          if (atBottomRef.current || current.author_id === userIdRef.current) {
            scrollToBottom();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "discussion_messages", filter: `project_id=eq.${project.project_id}` },
        (payload) => {
          const nextRec = payload.new as ChatMessage;
          setMessages(prev =>
            prev
              ? prev.map(m => (m.id === nextRec.id ? { ...m, ...nextRec } as ChatMessage : m))
              : prev
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "discussion_messages", filter: `project_id=eq.${project.project_id}` },
        (payload) => {
          const oldRec = payload.old as { id: string };
          setMessages(prev => (prev ? prev.filter(m => m.id !== oldRec.id) : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.project_id, supabase, setMessages]);

  // di dalam component file
  const resolveDisplayName = React.useCallback((m: ChatMessage): string => {
    const uid = viewerId;
    if (m.author_id === uid) return selfDisplayName || "Me";

    const fromView = (m.author_display_name ?? "").trim();
    // pastikan SELALU string
    return fromView !== "" ? fromView : (m.author_id ?? "Unknown");
  }, [viewerId, selfDisplayName]);


  // Send message (refetch satu row dari VIEW biar ada display name)
  const sendMessage = useCallback(async () => {
    const content = input.trim();
    const authorId = viewerId; // ganti dari userIdRef.current
    if (!content || !authorId || canPost !== true) return;

    setSending(true);
    setInput("");

    const { data: inserted, error } = await supabase
      .from("discussion_messages")
      .insert({ project_id: project.project_id, author_id: authorId, content })
      .select("id")
      .single();

    setSending(false);

    if (error || !inserted) {
      alert(error?.message ?? "Gagal mengirim pesan.");
      setInput(content);
      return;
    }

    const { data: row } = await supabase
      .from("discussion_messages_view")
      .select("id,project_id,author_id,content,created_at,deleted_at,author_display_name")
      .eq("id", inserted.id)
      .single();

    if (row) {
      setMessages(prev => {
        const arr = prev ?? [];
        if (arr.some(m => m.id === row.id)) return prev;
        return [...arr, row as ChatMessage];
      });
      if (atBottomRef.current || row.author_id === userIdRef.current) {
        scrollToBottom();
      }
    }
  }, [input, project.project_id, supabase, canPost, setMessages, scrollToBottom]);

  // Delete
  const handleDeleteMessage = useCallback(
    async (id: string) => {
      if (!isUuid(id)) return;
      const prevSnapshot = messages ?? [];
      preserveScrollDuring(() => {
        setMessages(prev => (prev ? prev.filter(m => m.id !== id) : prev));
      });
      const { error } = await supabase.from("discussion_messages").delete().eq("id", id);
      if (error) {
        preserveScrollDuring(() => setMessages(prevSnapshot));
        alert(error.message);
      }
    },
    [messages, setMessages, supabase]
  );

  // Edit
  const handleStartEdit = (m: DiscussionMessage) => {
    setEditingId(m.id);
    setEditValue(m.content);
    // setMenuOpenId(null);
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };
  const handleSaveEdit = useCallback(async () => {
    const id = editingId;
    if (!id || !isUuid(id)) return;
    const newText = editValue.trim();
    if (!newText) return;

    // Optimistic update UI
    const prevSnapshot = messages ?? [];
    preserveScrollDuring(() => {
      setMessages(prev =>
        prev ? prev.map(m => (m.id === id ? ({ ...(m as any), content: newText } as ChatMessage) : m)) : prev
      );
    });

    const { error } = await supabase
      .from("discussion_messages")
      .update({ content: newText })
      .eq("id", id)
      .select("id"); // we don't need full row here

    if (error) {
      setMessages(prevSnapshot);
      alert(error.message);
      return;
    }
    setEditingId(null);
    setEditValue("");
  }, [editValue, editingId, messages, setMessages, supabase]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending && canPost === true,
    [input, sending, canPost]
  );

  // UI helpers
  // const MessageMenu = ({
  //   m,
  //   canManage
  // }: {
  //   m: DiscussionMessage;
  //   canManage: boolean;
  // }) => {
  //   if (!canManage) return null;
  //   const open = menuOpenId === m.id;
  //   return (
  //     <div className={`relative ${userIdRef.current === m.author_id ? "order-1" : "order-2"}`}>
  //       <button
  //         aria-label="Message actions"
  //         onClick={() => setMenuOpenId(open ? null : m.id)}
  //         className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
  //       >
  //         ⋮
  //       </button>
  //       {open && (
  //         <div className={`absolute z-20 mt-1 w-28 max-w-[calc(100vw-2rem)] rounded-lg border ... ${userIdRef.current === m.author_id ? "right-0" : "left-0"}`}>
  //           <button
  //             onClick={() => handleStartEdit(m)}
  //             className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
  //           >
  //             Edit
  //           </button>
  //           <button
  //             onClick={() => handleDeleteMessage(m.id)}
  //             className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400"
  //           >
  //             Delete
  //           </button>
  //         </div>
  //       )}
  //     </div>
  //   );
  // };
    const Bubble = ({
      m,
      isMine,
      showName,
      isAdminOwner,
      selfDisplayName,
      resolveDisplayName,
      onEdit,
      onDelete,
      scrollElRef,
      editingId,
      editValue,
      setEditValue,
      handleSaveEdit,
      handleCancelEdit,
    }: {
      m: ChatMessage;
      isMine: boolean;
      showName: boolean;
      isAdminOwner: boolean;
      selfDisplayName: string;
      resolveDisplayName: (m: ChatMessage) => string;
      onEdit: (m: DiscussionMessage) => void;
      onDelete: (id: string) => void;
      scrollElRef: React.MutableRefObject<HTMLDivElement | null>;
      editingId: string | null;
      editValue: string;
      setEditValue: (v: string) => void;
      handleSaveEdit: () => void;
      handleCancelEdit: () => void;
    }) => {
      const name = resolveDisplayName(m);
      const canManage = isMine || isAdminOwner;

      return (
        <div className={`flex items-end ${isMine ? "justify-end" : "justify-start"}`}>
          <div
            className={`relative flex gap-2 items-start ${isMine ? "flex-row-reverse" : "flex-row"} min-w-0
                        max-w-[92%] sm:max-w-[85%] md:max-w-[70%] my-2 sm:my-2.5`}
          >
            {/* bubble */}
            <div
              className={`min-w-0 max-w-full rounded-2xl px-4 py-2 border ${
                isMine
                  ? "bg-blue-600 text-white border-blue-700 shadow-blue-200/30"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
              }`}
            >
              {showName && (
                <div className={`mb-1 text-[11px] ${isMine ? "text-blue-100/90" : "text-gray-500 dark:text-gray-400"}`}>
                  {name}
                </div>
              )}

              {editingId === m.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-md border p-2 text-sm outline-none text-left bg-white text-gray-900"
                  />
                  <div className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-left break-all sm:break-words [overflow-wrap:anywhere]">
                  {m.content}
                  {m.updated_at && m.updated_at !== m.created_at && (
                    <span className="ml-2 text-[10px] opacity-70">edited</span>
                  )}
                </div>
              )}
            </div>

            {/* menu */}
            <div className={`relative shrink-0 ${isMine ? "order-1" : "order-2"}`}>
              <MessageMenu
                m={m}
                canManage={canManage}
                isMine={isMine}
                scrollElRef={scrollElRef}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
        </div>
      );
    };


  return (
    <AnimatedCard title="💬 Discussion (Admin moderation)" gradient className="md:h-[70vh] max-h-[100dvh]">
      {/* Layout: list di atas, composer di bawah */}
      <div className="flex md:h-[70vh] max-h-[100dvh] flex-col min-h-0">
        {/* Header kecil */}
        <div className="px-3 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">Discussion</h3>
          {canPost === false && authResolved && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-200">
              Only assigned team members and the client can send messages.
            </p>
          )}
        </div>

        {/* Messages list */}
        <div ref={listRef} className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y
            px-3 sm:px-6 py-3 sm:py-4
            flex flex-col gap-4 sm:gap-5 md:gap-6
            scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-700 scrollbar-track-transparent
            pb-[env(safe-area-inset-bottom)]" aria-busy={uiLoading}>
          <div ref={topSentinelRef} aria-hidden className="h-1" />
          <AnimatePresence>
            {uiLoading && (
              <motion.div
                key="loading-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 pointer-events-none"
              >
                <ChatSkeleton />
              </motion.div>
            )}
          </AnimatePresence>
            {/* content */}
          <motion.div
            key={uiLoading ? "hidden" : "content"}
            initial={{ opacity: 0 }}
            animate={{ opacity: uiLoading ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className={uiLoading ? "opacity-0 pointer-events-none select-none" : "opacity-100"}
          >
            {loadingOlder && hasMore && (
              <div className="text-center text-xs text-gray-500 mb-4">Loading older…</div>
            )}
            {!messages || messages.length === 0 ? (
              <motion.div
                className="text-sm text-gray-500 dark:text-gray-400 text-center py-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                💬 No messages yet.
              </motion.div>
            ) : (
              messages.map((m, index) => {
                const isMine = viewerId != null && viewerId === m.author_id;
                const prev = index > 0 ? messages[index - 1] : undefined;
                const showName = !prev || prev.author_id !== m.author_id; // nama hanya di bubble pertama
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(0.015 * index, 0.25) }}
                  >
                    <Bubble
                      m={m}
                      isMine={viewerId != null && viewerId === m.author_id}
                      showName={!prev || prev.author_id !== m.author_id}
                      isAdminOwner={isAdminOwner}
                      selfDisplayName={selfDisplayName}
                      resolveDisplayName={resolveDisplayName}
                      onEdit={handleStartEdit}
                      onDelete={handleDeleteMessage}
                      scrollElRef={listRef}
                      editingId={editingId}
                      editValue={editValue}
                      setEditValue={setEditValue}
                      handleSaveEdit={handleSaveEdit}
                      handleCancelEdit={handleCancelEdit}
                    />
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>


        {/* Composer di bawah */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 pb-[env(safe-area-inset-bottom)]">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 sm:p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                canPost === null
                  ? "Checking permission…"
                  : canPost
                  ? "Type a message…"
                  : "You don't have permission to send messages"
              }
              disabled={canPost !== true}

              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void sendMessage();
                }
              }}
              className={`w-full h-14 sm:h-20 max-h-40 resize-none sm:resize-y rounded-xl p-3 outline-none border border-transparent transition-colors scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-700 scrollbar-track-transparent ${
                canPost
                  ? "bg-gray-50 dark:bg-gray-900/50 focus:border-blue-300 dark:focus:border-blue-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Messages are delivered in real-time to all project members.
              </span>
              <motion.button
                onClick={sendMessage}
                disabled={!canSend}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-semibold transition-colors ${
                  canSend ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
                whileHover={canSend ? { scale: 1.03 } : undefined}
                whileTap={canSend ? { scale: 0.97 } : undefined}
              >
                {sending ? "Sending…" : "Send"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
