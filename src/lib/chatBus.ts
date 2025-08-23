export type ChatTopic = {
  id: string;                 // biasanya project_id
  title?: string | null;      // judul project (untuk header)
  subtitle?: string | null;   // optional, mis. nama client
  project?: unknown;          // ProjectSummary (opsional, bertipe unknown agar bebas import siklus)
};

export type ChatBusState = {
  isOpen: boolean;
  isMinimized: boolean;
  topic: ChatTopic | null;
};

export type ChatBusListener = (s: ChatBusState) => void;

class ChatBus {
  private state: ChatBusState = { isOpen: false, isMinimized: true, topic: null };
  private listeners = new Set<ChatBusListener>();

  subscribe(fn: ChatBusListener): () => void {
    this.listeners.add(fn);
    fn(this.state); // emit current state sekarang juga
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.state);
  }

  open(topic: ChatTopic, opts?: { focus?: boolean; minimized?: boolean }) {
    const minimized = opts?.minimized ?? false;
    this.state = { isOpen: true, isMinimized: minimized, topic };
    this.emit();
  }

  toggle(topic?: ChatTopic) {
    if (this.state.isOpen) {
      this.state = { ...this.state, isMinimized: !this.state.isMinimized };
    } else {
      this.state = { isOpen: true, isMinimized: false, topic: topic ?? this.state.topic };
    }
    this.emit();
  }

  minimize(val: boolean) {
    if (!this.state.isOpen) return;
    this.state = { ...this.state, isMinimized: val };
    this.emit();
  }

  close() {
    this.state = { isOpen: false, isMinimized: true, topic: null };
    this.emit();
  }
}

export const chatBus = new ChatBus();

// Helper agar gampang dipanggil dari mana saja
export const openChat   = (topic: ChatTopic, opts?: { focus?: boolean; minimized?: boolean }) => chatBus.open(topic, opts);
export const toggleChat = (topic?: ChatTopic) => chatBus.toggle(topic);
export const minimizeChat = (val: boolean) => chatBus.minimize(val);
export const closeChat  = () => chatBus.close();