import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Dumbbell,
  LogOut,
  Plus,
  Sparkles,
  BookOpen,
  Users,
  Coffee,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

type Category = "Focus" | "Health" | "Life" | "Study";
type Event = { id: number; title: string; start: string; end: string; category: Category; done?: boolean };

const colors: Record<Category, string> = {
  Focus: "#b99cff",
  Health: "#8de7c1",
  Life: "#ffae79",
  Study: "#8ab7ff",
};

const initialEvents: Event[] = [
  { id: 1, title: "Morning reset", start: "07:30", end: "08:00", category: "Health", done: true },
  { id: 2, title: "Deep work · Biology", start: "09:00", end: "10:30", category: "Study" },
  { id: 3, title: "Lunch with Maya", start: "12:30", end: "13:15", category: "Life" },
  { id: 4, title: "Gym session", start: "16:00", end: "17:00", category: "Health" },
  { id: 5, title: "Read 20 pages", start: "20:30", end: "21:00", category: "Focus" },
];

const categoryIcons = { Focus: Sparkles, Health: Dumbbell, Life: Users, Study: BookOpen };

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState(initialEvents);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Study");
  const [activeDay, setActiveDay] = useState(2);

  const plannedMinutes = useMemo(() => events.reduce((sum, event) => {
    const [sh, sm] = event.start.split(":").map(Number);
    const [eh, em] = event.end.split(":").map(Number);
    return sum + (eh * 60 + em - sh * 60 - sm);
  }, 0), [events]);

  const addEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    setEvents([...events, { id: Date.now(), title: title.trim(), start: "18:00", end: "18:45", category }].sort((a, b) => a.start.localeCompare(b.start)));
    setTitle("");
    setShowComposer(false);
  };

  const toggleDone = (id: number) => setEvents(events.map((event) => event.id === id ? { ...event, done: !event.done } : event));
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <main className="min-h-screen bg-[#101112] text-[#f5f2ed] selection:bg-[#b99cff]/30">
      <div className="mx-auto flex min-h-screen max-w-[1380px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[.07] px-7 py-8 lg:flex">
          <div className="flex items-center gap-3 text-lg font-semibold tracking-tight"><div className="grid size-8 place-items-center rounded-xl bg-[#b99cff] text-[#17121e]"><Sparkles className="size-4" /></div>tempo<span className="text-[#b99cff]">.</span></div>
          <nav className="mt-16 space-y-2 text-sm">
            <div className="rounded-xl bg-white/[.08] px-4 py-3 font-medium text-white">Today <span className="float-right text-[#b99cff]">⌘1</span></div>
            <div className="px-4 py-3 text-white/40">Calendar <span className="float-right">⌘2</span></div>
          </nav>
          <div className="mt-auto space-y-5 text-sm text-white/40"><div className="flex items-center gap-3 px-4"><div className="size-2 rounded-full bg-[#8de7c1]" /> All caught up</div><button onClick={async () => { await signOut(); navigate("/"); }} className="flex items-center gap-3 px-4 hover:text-white"><LogOut className="size-4" /> Sign out</button></div>
        </aside>
        <section className="flex-1 px-5 py-7 sm:px-10 lg:px-16">
          <header className="flex items-center justify-between"><div className="lg:hidden flex items-center gap-2 font-semibold text-lg"><div className="grid size-8 place-items-center rounded-xl bg-[#b99cff] text-[#17121e]"><Sparkles className="size-4" /></div>tempo.</div><div className="hidden text-sm text-white/40 sm:block">Wednesday, October 16, 2024</div><div className="flex items-center gap-3"><button className="grid size-9 place-items-center rounded-full border border-white/10 text-sm text-white/60 hover:bg-white/10">{(user?.name || "A").charAt(0).toUpperCase()}</button><button className="text-white/40 hover:text-white"><MoreHorizontal className="size-5" /></button></div></header>
          <div className="mt-14 flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="mb-3 text-sm font-medium uppercase tracking-[.22em] text-[#b99cff]">Wednesday · week 42</p><h1 className="text-5xl font-semibold tracking-[-.06em] sm:text-6xl">Make space<br /><span className="text-white/35">for what matters.</span></h1></div><div className="flex items-center gap-3 text-sm text-white/45"><button className="grid size-9 place-items-center rounded-full border border-white/10 hover:bg-white/10"><ArrowLeft className="size-4" /></button><span>October 2024</span><button className="grid size-9 place-items-center rounded-full border border-white/10 hover:bg-white/10"><ArrowRight className="size-4" /></button></div></div>
          <div className="mt-12 grid grid-cols-7 border-y border-white/[.08] py-3">{days.map((day, i) => <button key={day} onClick={() => setActiveDay(i)} className={`flex flex-col items-center gap-2 text-[10px] font-semibold tracking-[.2em] ${activeDay === i ? "text-white" : "text-white/30"}`}><span>{day}</span><span className={`grid size-8 place-items-center rounded-full text-sm tracking-normal ${activeDay === i ? "bg-[#b99cff] text-[#17121e]" : ""}`}>{14 + i}</span></button>)}</div>
          <div className="mt-9 grid gap-12 xl:grid-cols-[1fr_270px]">
            <div><div className="mb-5 flex items-center justify-between"><div><p className="text-sm text-white/40">Your day</p><p className="mt-1 text-xs text-white/25">{events.length} blocks · {Math.floor(plannedMinutes / 60)}h {plannedMinutes % 60}m planned</p></div><Button onClick={() => setShowComposer(true)} className="rounded-full bg-[#b99cff] text-[#17121e] hover:bg-[#c8b1ff]"><Plus className="size-4" /> Add block</Button></div>
              <div className="relative ml-2 border-l border-white/[.1] pl-7">{events.map((event, index) => { const Icon = categoryIcons[event.category]; return <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .05 }} key={event.id} className="group relative mb-3"><div className="absolute -left-[33px] top-5 grid size-3 place-items-center rounded-full border-2 border-[#101112]" style={{ backgroundColor: colors[event.category] }} /><div className={`flex items-center justify-between rounded-2xl border border-white/[.07] bg-white/[.035] p-4 transition hover:border-white/20 hover:bg-white/[.06] ${event.done ? "opacity-45" : ""}`}><div className="flex items-center gap-4"><div className="grid size-10 place-items-center rounded-xl" style={{ backgroundColor: `${colors[event.category]}18`, color: colors[event.category] }}><Icon className="size-4" /></div><div><p className={`font-medium ${event.done ? "line-through" : ""}`}>{event.title}</p><p className="mt-1 text-xs text-white/35">{formatTime(event.start)} — {formatTime(event.end)} <span className="mx-1">·</span> {event.category}</p></div></div><button onClick={() => toggleDone(event.id)} className={`grid size-8 place-items-center rounded-full border transition ${event.done ? "border-[#8de7c1] bg-[#8de7c1] text-[#101112]" : "border-white/15 text-transparent hover:border-white/50"}`}><Check className="size-4" /></button></div></motion.div>; })}<button onClick={() => setShowComposer(true)} className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/30 transition hover:border-[#b99cff]/50 hover:text-[#b99cff]"><Plus className="size-4" /> Make room for something else</button></div>
            </div>
            <div className="space-y-4"><div className="rounded-2xl border border-white/[.07] bg-white/[.035] p-5"><div className="flex items-center justify-between"><p className="text-sm font-medium">Today in balance</p><Sparkles className="size-4 text-[#b99cff]" /></div><div className="mt-7 flex items-end gap-2"><span className="text-4xl font-semibold tracking-tight">{Math.round((plannedMinutes / 960) * 100)}%</span><span className="mb-1 text-xs text-white/35">of your day planned</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, plannedMinutes / 960 * 100)}%` }} className="h-full rounded-full bg-[#b99cff]" /></div><div className="mt-5 flex justify-between text-xs text-white/35"><span>Focus {Math.round(plannedMinutes / 60 * .55)}h</span><span>Open space {Math.max(0, 16 - Math.round(plannedMinutes / 60))}h</span></div></div><div className="rounded-2xl border border-[#8de7c1]/15 bg-[#8de7c1]/[.06] p-5"><Coffee className="size-4 text-[#8de7c1]" /><p className="mt-5 text-sm leading-6 text-white/75">You have a calm gap after lunch. A good moment for a walk or a reset.</p><button className="mt-4 text-xs font-medium text-[#8de7c1] hover:underline">View open space →</button></div></div>
          </div>
        </section>
      </div>
      <AnimatePresence>{showComposer && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 grid place-items-center bg-black/60 p-5 backdrop-blur-sm"><motion.form initial={{ scale: .95, y: 10 }} animate={{ scale: 1, y: 0 }} onSubmit={addEvent} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1c1e] p-6 shadow-2xl"><div className="mb-7 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-[#b99cff]">New block</p><h2 className="mt-2 text-2xl font-semibold">Shape your day.</h2></div><button type="button" onClick={() => setShowComposer(false)} className="text-white/40 hover:text-white"><X className="size-5" /></button></div><label className="text-xs text-white/40">What are you making time for?</label><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study for chemistry" className="mt-2 h-12 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /><label className="mt-6 block text-xs text-white/40">Category</label><div className="mt-2 grid grid-cols-2 gap-2">{(Object.keys(colors) as Category[]).map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`rounded-xl border p-3 text-left text-sm transition ${category === item ? "border-[#b99cff] bg-[#b99cff]/10" : "border-white/10 bg-white/[.03]"}`}><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: colors[item] }} />{item}</button>)}</div><Button type="submit" className="mt-7 h-12 w-full rounded-xl bg-[#b99cff] text-[#17121e] hover:bg-[#c8b1ff]">Add to my day <ArrowRight className="size-4" /></Button></motion.form></motion.div>}</AnimatePresence>
    </main>
  );
}
