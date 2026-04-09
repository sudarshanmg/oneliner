"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Feather, Heart, Scroll, Clock, GitBranch, Compass, Map, Flame, Star } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

function Rule({
  icon: Icon,
  color,
  title,
  body,
  delay,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <motion.div {...fadeUp(delay)} className="flex gap-4">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: color + "22", border: `1.5px solid ${color}44` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#1a1530] mb-1">{title}</h3>
        <p className="text-sm text-[#6b6080] leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

function Lore({
  number,
  text,
  delay,
}: {
  number: string;
  text: string;
  delay: number;
}) {
  return (
    <motion.div {...fadeUp(delay)} className="flex gap-4 items-start">
      <span
        className="text-2xl font-black flex-shrink-0 leading-none"
        style={{
          fontFamily: "var(--font-lora), Georgia, serif",
          color: "#ff6b35",
          opacity: 0.35,
        }}
      >
        {number}
      </span>
      <p
        className="text-[15px] leading-[1.9] text-[#2d2540]"
        style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
      >
        {text}
      </p>
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f7f3e9" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-5 py-2.5 sticky top-0 z-20"
        style={{
          background: "#ffffff",
          borderBottom: "1.5px solid #e0d9c8",
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "#fff4ee", border: "1.5px solid #ffd5c0" }}
          >
            <BookOpen size={14} className="text-[#ff6b35]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1a1530] leading-none group-hover:text-[#ff6b35] transition-colors">
              One-Sentence <span className="text-[#ff6b35]">MMO</span>
            </h1>
            <p className="text-[9px] text-[#c8bfa8] leading-none mt-0.5">
              A living story · one voice at a time
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/narrator"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:shadow-sm"
            style={{ background: "#faf8f4", color: "#5a5070", border: "1.5px solid #e0d9c8" }}
          >
            <Scroll size={12} className="text-[#f59e0b]" />
            Chronicle
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
            style={{
              background: "linear-gradient(135deg, #ff6b35, #f59e0b)",
              color: "#fff",
              boxShadow: "0 3px 12px rgba(255,107,53,0.35)",
            }}
          >
            <Feather size={12} />
            Enter the World
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1a1530 0%, #2d1a0a 60%, #3d2210 100%)",
          minHeight: "480px",
        }}
      >
        {/* Starfield dots */}
        {Array.from({ length: 48 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: "#fff",
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{ opacity: [null, Math.random() * 0.6 + 0.1, null] as never }}
            transition={{ duration: Math.random() * 4 + 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Warm glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 600,
            height: 300,
            background: "radial-gradient(ellipse, rgba(255,107,53,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
          <motion.div {...fadeUp(0)} className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{
                background: "rgba(255,107,53,0.15)",
                border: "1.5px solid rgba(255,107,53,0.35)",
              }}
            >
              <Compass size={28} className="text-[#ff6b35]" />
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl font-black mb-4 text-white"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            Every world needs{" "}
            <span style={{ color: "#ff6b35" }}>a first word.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="text-lg text-[#c8a882] leading-relaxed max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            One-Sentence MMO is a living, branching story written by strangers — one sentence at a time, forever. There are no characters to level up. No quests to complete. Only the story, and your single line to add to it.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c8a882]">
              <Clock size={11} className="text-[#ff6b35]" /> One sentence per hour
            </div>
            <div className="w-1 h-1 rounded-full bg-[#4a3a28]" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c8a882]">
              <GitBranch size={11} className="text-[#ff6b35]" /> Branch any sentence
            </div>
            <div className="w-1 h-1 rounded-full bg-[#4a3a28]" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c8a882]">
              <Star size={11} className="text-[#ff6b35]" /> No accounts ever
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-20">

        {/* The Lore */}
        <section className="space-y-6">
          <motion.div {...fadeUp(0)}>
            <div className="flex items-center gap-2 mb-6">
              <Map size={14} className="text-[#ff6b35]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff6b35]">The Lore</span>
            </div>
          </motion.div>

          <Lore
            number="I"
            delay={0.05}
            text="Somewhere between here and the edge of imagination lives a story with no author — only contributors. Each line is a door. Behind every door is a world. You hold the key."
          />
          <Lore
            number="II"
            delay={0.1}
            text="The story forks. It always has. One sentence might birth ten children, each pulling the world in a different direction. The path with the most hearts becomes the canon — the official record of this world's history."
          />
          <Lore
            number="III"
            delay={0.15}
            text="At the close of each day, a town crier reads the canonical path aloud and broadcasts the events to all who gather at the Chronicle. History is written by the voted."
          />
        </section>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, #e0d9c8, transparent)" }}
        />

        {/* The Rules */}
        <section className="space-y-8">
          <motion.div {...fadeUp(0)}>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-[#ff6b35]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff6b35]">The Rules of the World</span>
            </div>
            <p className="text-sm text-[#6b6080]">Simple laws govern this realm. Break them, and your sentence shall not pass.</p>
          </motion.div>

          <div className="space-y-7">
            <Rule
              icon={Clock}
              color="#ff6b35"
              title="One sentence per hour"
              body="Your quill rests after each contribution. Wait one full hour before your voice may speak again. Patience is the first virtue of a good storyteller."
              delay={0.05}
            />
            <Rule
              icon={Feather}
              color="#f59e0b"
              title="20 to 280 characters"
              body="Too short and you've said nothing. Too long and you've said too much. Every great sentence knows when to stop. End with a period, an exclamation, or a question mark — leave no sentence dangling."
              delay={0.1}
            />
            <Rule
              icon={GitBranch}
              color="#6BB8FF"
              title="Branch from anywhere"
              body="You don't have to continue the latest thread. Pick any sentence — from the very beginning, from a forgotten branch, from the most obscure corner of the tree — and pull it in a new direction."
              delay={0.15}
            />
            <Rule
              icon={Heart}
              color="#FF7EB3"
              title="Vote for what you love"
              body="One heart per sentence, per traveller. The sentences with the most hearts shape the canonical path — the story the world remembers. Your vote is your voice when your quill is resting."
              delay={0.2}
            />
            <Rule
              icon={Star}
              color="#A8E063"
              title="No accounts. Ever."
              body="You arrive as a stranger with a name the world assigns you — part adjective, part creature, all yours. Your identity lives only in your browser. No email. No password. No tracking. Just you and the story."
              delay={0.25}
            />
          </div>
        </section>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, #e0d9c8, transparent)" }}
        />

        {/* How to navigate */}
        <section className="space-y-6">
          <motion.div {...fadeUp(0)}>
            <div className="flex items-center gap-2 mb-2">
              <Compass size={14} className="text-[#ff6b35]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff6b35]">Navigating the World</span>
            </div>
          </motion.div>

          <div className="grid gap-4">
            {[
              { key: "Pan", desc: "Drag the background to move across the story tree." },
              { key: "Zoom", desc: "Scroll to zoom in on a thread or out to see the whole world." },
              { key: "Drag nodes", desc: "Each sentence card can be repositioned. Rearrange the world to your liking — the branches follow." },
              { key: "Hover a card", desc: "Reveal the Like and Continue buttons. They disappear when you move away." },
              { key: "Recenter", desc: "Lost? Hit the Recenter button in the bottom-right of the canvas to return to the root." },
              { key: "Chronicle", desc: "Visit the Chronicle page to read the AI narrator's daily bulletin on the canonical story." },
            ].map(({ key, desc }, i) => (
              <motion.div
                key={key}
                {...fadeUp(i * 0.05)}
                className="flex gap-3 items-start p-4 rounded-2xl"
                style={{ background: "#fff", border: "1.5px solid #e0d9c8" }}
              >
                <span
                  className="text-[11px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: "#fff4ee", color: "#ff6b35", border: "1px solid #ffd5c0" }}
                >
                  {key}
                </span>
                <p className="text-sm text-[#5a5070] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.div
          {...fadeUp(0)}
          className="text-center py-12 rounded-3xl space-y-5"
          style={{
            background: "linear-gradient(160deg, #1a1530 0%, #2d1a0a 100%)",
            border: "1.5px solid rgba(255,107,53,0.2)",
          }}
        >
          <div className="flex justify-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.15)", border: "1.5px solid rgba(255,107,53,0.3)" }}
            >
              <Feather size={20} className="text-[#ff6b35]" />
            </div>
          </div>
          <div>
            <h2
              className="text-2xl font-black text-white mb-2"
              style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
            >
              The story is waiting.
            </h2>
            <p className="text-sm text-[#c8a882]">Your sentence could change everything.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #ff6b35, #f59e0b)",
              color: "#fff",
              boxShadow: "0 6px 24px rgba(255,107,53,0.45)",
            }}
          >
            <Compass size={14} />
            Enter the World
          </Link>
        </motion.div>

      </div>

      {/* Footer */}
      <div className="text-center py-8 text-[10px] text-[#c8bfa8]">
        One-Sentence MMO · Built with curiosity · A story never truly ends
      </div>
    </div>
  );
}
