"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { BookOpen, Feather, Heart, Scroll, Clock, GitBranch, Compass, Map, Flame, Star, Zap } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return { ref, inView };
}

function RevealDiv({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useReveal();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function RuleCard({ icon: Icon, color, title, body, delay }: {
  icon: React.ElementType; color: string; title: string; body: string; delay: number;
}) {
  const { ref, inView } = useReveal();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease }}
      whileHover={{ scale: 1.015, x: 4 }}
      style={{
        display: "flex", gap: 18, padding: "20px 24px", borderRadius: 20,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${color}25`,
        backdropFilter: "blur(10px)",
        boxShadow: `0 0 0 1px ${color}10, inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "box-shadow 0.3s",
      }}
      onHoverStart={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${color}20, 0 0 0 1px ${color}30, inset 0 1px 0 rgba(255,255,255,0.06)`;
      }}
      onHoverEnd={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${color}10, inset 0 1px 0 rgba(255,255,255,0.04)`;
      }}
    >
      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
        transition={{ duration: 0.4 }}
        style={{
          width: 44, height: 44, borderRadius: 16, flexShrink: 0, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}15`, border: `1px solid ${color}30`,
          boxShadow: `0 0 20px ${color}20`,
        }}
      >
        <Icon size={18} style={{ color }} />
      </motion.div>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.75 }}>{body}</p>
      </div>
    </motion.div>
  );
}

function LoreCard({ number, text, delay }: { number: string; text: string; delay: number }) {
  const { ref, inView } = useReveal();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease }}
      style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
    >
      <span style={{
        fontSize: 48, fontWeight: 900, flexShrink: 0, lineHeight: 1,
        fontFamily: "var(--font-lora), Georgia, serif",
        background: "linear-gradient(135deg, #ff6b35, #f59e0b)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        opacity: 0.6,
      }}>
        {number}
      </span>
      <p style={{
        fontSize: 15, lineHeight: 1.9, paddingTop: 8,
        color: "rgba(255,255,255,0.7)",
        fontFamily: "var(--font-lora), Georgia, serif",
      }}>
        {text}
      </p>
    </motion.div>
  );
}

function NavCard({ label, desc, delay }: { label: string; desc: string; delay: number }) {
  const { ref, inView } = useReveal();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      whileHover={{ scale: 1.02, y: -2 }}
      style={{
        display: "flex", gap: 14, alignItems: "flex-start",
        padding: "16px 20px", borderRadius: 18,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        cursor: "default",
      }}
    >
      <span style={{
        fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999, flexShrink: 0, marginTop: 2,
        background: "rgba(255,107,53,0.15)", color: "#ff6b35",
        border: "1px solid rgba(255,107,53,0.25)", letterSpacing: "0.03em",
      }}>
        {label}
      </span>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{desc}</p>
    </motion.div>
  );
}

// Deterministic seeded random so SSR and client produce identical values
function sr(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: sr(i * 7) * 100,
  y: sr(i * 7 + 1) * 100,
  size: sr(i * 7 + 2) * 2.5 + 0.5,
  duration: sr(i * 7 + 3) * 5 + 3,
  delay: sr(i * 7 + 4) * 4,
  opacity: sr(i * 7 + 5) * 0.5 + 0.08,
}));

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#060410" }}>

      {/* ── Nav ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", position: "sticky", top: 0, zIndex: 20,
        background: "rgba(6,4,16,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)" }}>
            <BookOpen size={14} style={{ color: "#ff6b35" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, background: "linear-gradient(135deg,#ff6b35,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              One-Sentence MMO
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>A living story · one voice at a time</div>
          </div>
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/narrator" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 12, textDecoration: "none", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Scroll size={11} style={{ color: "#f59e0b" }} /> Chronicle
          </Link>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 12, textDecoration: "none", background: "linear-gradient(135deg,#ff6b35,#f59e0b)", color: "#fff", boxShadow: "0 3px 16px rgba(255,107,53,0.4)" }}>
            <Feather size={11} /> Enter the World
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: 560, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Particles */}
        {PARTICLES.map(p => (
          <motion.div
            key={p.id}
            style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: "#fff", opacity: p.opacity, pointerEvents: "none" }}
            animate={{ opacity: [p.opacity, p.opacity * 3, p.opacity], y: [0, -12, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Aurora blobs */}
        <div className="aurora-a" style={{ position: "absolute", width: "65vw", height: "55vh", top: "-15vh", left: "-10vw", background: "radial-gradient(ellipse, rgba(255,107,53,0.12) 0%, transparent 65%)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />
        <div className="aurora-b" style={{ position: "absolute", width: "55vw", height: "50vh", bottom: "-15vh", right: "-10vw", background: "radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 65%)", filter: "blur(70px)", borderRadius: "50%", pointerEvents: "none" }} />
        <div className="aurora-c" style={{ position: "absolute", width: "40vw", height: "35vh", top: "40%", left: "30%", background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 65%)", filter: "blur(60px)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          {/* 3D floating icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.9, ease }}
            style={{ display: "flex", justifyContent: "center", marginBottom: 32, perspective: 600 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotateZ: [0, 2, -2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 80, height: 80, borderRadius: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,107,53,0.12)",
                border: "1px solid rgba(255,107,53,0.3)",
                boxShadow: "0 0 60px rgba(255,107,53,0.25), 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <Compass size={34} style={{ color: "#ff6b35" }} />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            style={{
              fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.1,
              fontFamily: "var(--font-lora), Georgia, serif",
              color: "#fff", marginBottom: 20, letterSpacing: "-0.02em",
            }}
          >
            Every world needs{" "}
            <span className="shimmer-text">a first word.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.28, ease }}
            style={{
              fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.45)",
              maxWidth: 560, margin: "0 auto 36px",
              fontFamily: "var(--font-lora), Georgia, serif",
            }}
          >
            A living, branching story written by strangers — one sentence at a time, forever. No characters. No quests. Just the story, and your single line to add.
          </motion.p>

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42, ease }}
            style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
          >
            {[
              { icon: Clock, label: "1 sentence / hour", color: "#ff6b35" },
              { icon: GitBranch, label: "Branch anywhere", color: "#a78bfa" },
              { icon: Star, label: "No accounts ever", color: "#34d399" },
            ].map(({ icon: Icon, label, color }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.06, y: -2 }}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 12, fontWeight: 600,
                  padding: "8px 16px", borderRadius: 999,
                  background: `${color}12`, color: "rgba(255,255,255,0.65)",
                  border: `1px solid ${color}30`,
                  boxShadow: `0 0 20px ${color}15`,
                }}
              >
                <Icon size={12} style={{ color }} /> {label}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* The Lore */}
        <section style={{ paddingTop: 80, marginBottom: 80 }}>
          <RevealDiv style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <Map size={14} style={{ color: "#ff6b35" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ff6b35" }}>The Lore</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,107,53,0.3), transparent)" }} />
          </RevealDiv>

          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <LoreCard number="I" delay={0} text="Somewhere between here and the edge of imagination lives a story with no author — only contributors. Each line is a door. Behind every door is a world. You hold the key." />
            <LoreCard number="II" delay={0.08} text="The story forks. It always has. One sentence might birth ten children, each pulling the world in a different direction. The path with the most hearts becomes the canon — the official record of this world's history." />
            <LoreCard number="III" delay={0.16} text="At the close of each day, a town crier reads the canonical path aloud and broadcasts the events to all who gather at the Chronicle. History is written by the voted." />
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)", marginBottom: 80 }} />

        {/* The Rules */}
        <section style={{ marginBottom: 80 }}>
          <RevealDiv style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Flame size={14} style={{ color: "#ff6b35" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ff6b35" }}>The Rules of the World</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,107,53,0.3), transparent)" }} />
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginLeft: 24 }}>Simple laws govern this realm. Break them, and your sentence shall not pass.</p>
          </RevealDiv>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <RuleCard icon={Clock} color="#ff6b35" title="One sentence per hour" body="Your quill rests after each contribution. Wait one full hour before your voice may speak again. Patience is the first virtue of a good storyteller." delay={0} />
            <RuleCard icon={Feather} color="#f59e0b" title="20 to 280 characters" body="Too short and you've said nothing. Too long and you've said too much. Every great sentence knows when to stop. End with a period, an exclamation, or a question mark." delay={0.06} />
            <RuleCard icon={GitBranch} color="#6BB8FF" title="Branch from anywhere" body="Pick any sentence — from the root, from a forgotten branch, from the most obscure corner of the tree — and pull it in a new direction." delay={0.12} />
            <RuleCard icon={Heart} color="#FF7EB3" title="Vote for what you love" body="One heart per sentence, per traveller. The sentences with the most hearts shape the canonical path — the story the world remembers." delay={0.18} />
            <RuleCard icon={Star} color="#A8E063" title="No accounts. Ever." body="You arrive as a stranger with a name the world assigns you — part adjective, part creature, all yours. No email. No password. No tracking." delay={0.24} />
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)", marginBottom: 80 }} />

        {/* Navigating */}
        <section style={{ marginBottom: 80 }}>
          <RevealDiv style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <Zap size={14} style={{ color: "#ff6b35" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ff6b35" }}>Navigating the World</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,107,53,0.3), transparent)" }} />
          </RevealDiv>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Pan", desc: "Drag the background to move across the story tree." },
              { label: "Zoom", desc: "Scroll to zoom in on a thread or out to the whole world." },
              { label: "Drag nodes", desc: "Reposition any card — the branches follow live." },
              { label: "Hover", desc: "Reveal Like and Continue buttons on any card." },
              { label: "Recenter", desc: "Lost? Hit Recenter bottom-right to return to the root." },
              { label: "Chronicle", desc: "Daily AI bulletin on the canonical story path." },
            ].map(({ label, desc }, i) => (
              <NavCard key={label} label={label} desc={desc} delay={i * 0.06} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <RevealDiv>
          <motion.div
            whileHover={{ scale: 1.01 }}
            style={{
              position: "relative", overflow: "hidden",
              textAlign: "center", padding: "56px 40px", borderRadius: 32,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,107,53,0.2)",
              boxShadow: "0 0 80px rgba(255,107,53,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Glow blobs */}
            <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 200, background: "radial-gradient(ellipse, rgba(255,107,53,0.15) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: "20%", width: 200, height: 150, background: "radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)", boxShadow: "0 0 40px rgba(255,107,53,0.3)" }}>
                  <Feather size={22} style={{ color: "#ff6b35" }} />
                </div>
              </motion.div>

              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 10, fontFamily: "var(--font-lora), Georgia, serif", letterSpacing: "-0.02em" }}>
                The story is waiting.
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 28, fontFamily: "var(--font-lora)" }}>
                Your sentence could change everything.
              </p>

              <motion.div style={{ display: "flex", justifyContent: "center" }}>
                <Link
                  href="/"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, padding: "12px 28px", borderRadius: 16, textDecoration: "none", background: "linear-gradient(135deg, #ff6b35, #f59e0b)", color: "#fff", boxShadow: "0 8px 32px rgba(255,107,53,0.5)" }}
                >
                  <Compass size={15} /> Enter the World
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </RevealDiv>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "24px", fontSize: 10, color: "rgba(255,255,255,0.15)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        One-Sentence MMO · Built with curiosity · A story never truly ends
      </div>
    </div>
  );
}
