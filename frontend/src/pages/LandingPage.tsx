import React, { useState, useEffect, useRef } from 'react';
import { TickrLogo } from '../components/TickrLogo';

interface LandingPageProps {
  onEnterApp: (path?: string) => void;
  onOpenSearch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenSearch }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [arrowPos, setArrowPos] = useState({ x: 500, y: 50, angle: 90, visible: true });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // IntersectionObserver state for triggering section cards
  const [activeCards, setActiveCards] = useState<number[]>([]);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const card4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cardRefs = [card1Ref, card2Ref, card3Ref, card4Ref];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-card-index'));
            setActiveCards((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    cardRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  // Update scroll-linked arrow position along the organic vertical spline
  useEffect(() => {
    const updatePathMotion = () => {
      if (!containerRef.current || !pathRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalHeight = rect.height;

      // Scroll progress relative to container height (0.0 to 1.0)
      const scrolledPastTop = -rect.top + windowHeight * 0.35;
      const progress = Math.min(1, Math.max(0, scrolledPastTop / totalHeight));
      setScrollProgress(progress);

      const path = pathRef.current;
      const totalLength = path.getTotalLength();
      if (totalLength === 0) return;

      const currentLen = totalLength * progress;
      const pt = path.getPointAtLength(currentLen);
      const nextPt = path.getPointAtLength(Math.min(totalLength, currentLen + 3));

      // Calculate tangent angle
      const dx = nextPt.x - pt.x;
      const dy = nextPt.y - pt.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      setArrowPos({
        x: pt.x,
        y: pt.y,
        angle: angle,
        visible: progress > 0.01 && progress < 0.99,
      });
    };

    window.addEventListener('scroll', updatePathMotion, { passive: true });
    window.addEventListener('resize', updatePathMotion);
    updatePathMotion();

    return () => {
      window.removeEventListener('scroll', updatePathMotion);
      window.removeEventListener('resize', updatePathMotion);
    };
  }, []);

  const faqs = [
    {
      q: 'How are the cross-session deltas calculated?',
      a: 'Tickr freezes your baseline timestamp and quotes when you acknowledge a session checkpoint. When you return days or weeks later, all price breakouts, volume surges, and corporate catalysts are evaluated against that exact frozen baseline, not an arbitrary 24-hour daily reset.',
    },
    {
      q: 'Where does the causal catalyst news come from?',
      a: 'We aggregate audited material disclosures, Form 8-K / 10-Q filings, exchange announcements, and institutional news wires. Every headline is paired with a verified time-stamp and confidence rating linked to your ticker.',
    },
    {
      q: 'Can I monitor Indian (NSE/BSE) and US (NASDAQ/NYSE) stocks together?',
      a: 'Yes. Tickr natively supports multi-exchange watchlists. You can track NVDA, AAPL, MSFT alongside RELIANCE, TCS, and INFY within the same unified portfolio with localized currency indicators.',
    },
    {
      q: 'Is this meant for active day-trading or high-conviction tracking?',
      a: 'Tickr is built specifically for high-conviction investors, research analysts, and executives who want to cut through the intraday noise and immediately understand what moved and why.',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full pb-28 font-sans text-[#0F172A] bg-transparent overflow-hidden"
    >
      {/* ============================================================ */}
      {/* BACKGROUND SVG FLIGHT PATH WITH GLIDING ARROWHEAD            */}
      {/* ============================================================ */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-visible hidden md:block">
        <svg
          viewBox="0 0 1000 3200"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Trail Gradient for Arrow */}
            <linearGradient id="arrowTrailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.0" />
              <stop offset="70%" stopColor="#0F172A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
            </linearGradient>

            {/* Glowing Arrow Filter */}
            <filter id="arrowShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 1. Underlying Static Muted Flight Path */}
          <path
            d="M 500 120 
               C 520 280, 240 450, 240 680 
               C 240 920, 780 1050, 780 1350 
               C 780 1650, 220 1820, 220 2150 
               C 220 2480, 750 2620, 750 2950"
            stroke="#0F172A"
            strokeOpacity="0.08"
            strokeWidth="2"
            strokeDasharray="6 6"
            fill="none"
          />

          {/* 2. Scroll-Linked Active Drawn Flight Path */}
          <path
            ref={pathRef}
            d="M 500 120 
               C 520 280, 240 450, 240 680 
               C 240 920, 780 1050, 780 1350 
               C 780 1650, 220 1820, 220 2150 
               C 220 2480, 750 2620, 750 2950"
            stroke="#0F172A"
            strokeWidth="2"
            strokeDasharray="3200"
            strokeDashoffset={3200 * (1 - scrollProgress)}
            fill="none"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />

          {/* 3. Gliding Arrowhead at Leading Tip */}
          {arrowPos.visible && (
            <g
              transform={`translate(${arrowPos.x}, ${arrowPos.y}) rotate(${arrowPos.angle})`}
              filter="url(#arrowShadow)"
              style={{ transition: 'transform 0.08s linear' }}
            >
              {/* Arrow Head Polygon */}
              <polygon
                points="-16,-9 6,0 -16,9 -11,0"
                fill="#0F172A"
              />
              {/* Center point core */}
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            </g>
          )}
        </svg>
      </div>

      {/* ============================================================ */}
      {/* 1. HERO SECTION WITH DESKTOP TERMINAL BACKGROUND             */}
      {/* ============================================================ */}
      <section className="relative z-20 mt-2 mb-10 overflow-hidden rounded-md border border-[#1E293B] shadow-xl bg-[#0B132B] text-white">
        {/* Solid Non-Transparent Desktop Terminal Background Image */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src="/hero-market-terminal.jpg"
            alt="Tickr Market Intelligence Terminal Desktop Background"
            className="w-full h-full object-cover object-right md:object-right-top opacity-75"
            loading="eager"
          />
          {/* Executive Linear Gradient Scrim for High Contrast Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B] via-[#0B132B]/90 to-[#0B132B]/40"></div>
          {/* Subtle Bottom Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B132B] to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl">
          {/* Brand Header & Live Indicator */}
          <div className="flex items-center gap-3 mb-6 animate-hero-title">
            <TickrLogo className="w-10 h-10 shrink-0" />
            <span className="font-brand font-extrabold text-3xl tracking-tight text-white">
              Tickr
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold text-amber-300 bg-[#1E293B]/90 border border-amber-500/40 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              Live Market Intelligence Core
            </span>
          </div>

          {/* Main Headline with Strike-Through Aesthetic */}
          <h1 className="font-brand text-4xl sm:text-5xl lg:text-6xl text-white font-extrabold tracking-tight leading-[1.12] mb-6 animate-hero-title">
            Market intelligence, measured{' '}
            <span className="relative inline-block text-[#94A3B8]">
              from 9:30 AM
              <span className="absolute left-0 top-1/2 w-full h-[3px] bg-amber-400 -translate-y-1/2"></span>
            </span>{' '}
            from your last check.
          </h1>

          {/* Value Proposition */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans max-w-2xl mb-8 animate-hero-sub">
            Standard watchlists reset every morning at market open, wiping your mental context. Tickr maintains a persistent baseline ledger across your actual sessions, pairing price drift with verified filings and volume anomalies.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-sans animate-hero-cta">
            <button
              onClick={() => onEnterApp('dashboard')}
              className="px-6 py-3.5 bg-white text-[#0B132B] hover:bg-slate-100 transition-colors duration-150 font-bold cursor-pointer flex items-center gap-2 rounded-sm shadow-md"
            >
              <span>Launch Intelligence Feed</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={() => onEnterApp('watchlists')}
              className="px-5 py-3.5 bg-[#1E293B]/80 hover:bg-[#334155] border border-slate-700 text-white transition-colors duration-150 font-medium cursor-pointer rounded-sm"
            >
              Manage Watchlists
            </button>
            <button
              onClick={onOpenSearch}
              className="px-5 py-3.5 bg-[#1E293B]/60 hover:bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white transition-colors duration-150 flex items-center gap-2 cursor-pointer rounded-sm"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Search Universe (⌘K)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. LIVE MARKET PULSE RIBBON                                  */}
      {/* ============================================================ */}
      <section className="relative z-20 py-7 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-[#64748B] uppercase tracking-wider">
          <span>Market Synchronized Baselines</span>
          <span className="text-[#0F172A] font-medium">Real-Time Pricing</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors duration-150 shadow-sm">
            <span className="text-[11px] text-[#64748B] block font-sans uppercase">S&P 500</span>
            <span className="text-lg font-medium text-[#0F172A] mt-0.5 block tabular-nums">5,815.26</span>
            <span className="text-xs text-[#0F172A] font-medium block mt-0.5">+0.42%</span>
          </div>

          <div className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors duration-150 shadow-sm">
            <span className="text-[11px] text-[#64748B] block font-sans uppercase">NASDAQ 100</span>
            <span className="text-lg font-medium text-[#0F172A] mt-0.5 block tabular-nums">18,518.61</span>
            <span className="text-xs text-[#0F172A] font-medium block mt-0.5">+0.83%</span>
          </div>

          <div className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors duration-150 shadow-sm">
            <span className="text-[11px] text-[#64748B] block font-sans uppercase">NIFTY 50 (NSE)</span>
            <span className="text-lg font-medium text-[#0F172A] mt-0.5 block tabular-nums">24,854.05</span>
            <span className="text-xs text-[#64748B] font-medium block mt-0.5">-0.31%</span>
          </div>

          <div className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors duration-150 shadow-sm">
            <span className="text-[11px] text-[#64748B] block font-sans uppercase">US 10Y YIELD</span>
            <span className="text-lg font-medium text-[#0F172A] mt-0.5 block tabular-nums">4.182%</span>
            <span className="text-xs text-[#64748B] font-medium block mt-0.5">-1.8 bps</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. FEATURE STORYLINE CONNECTED BY FLIGHT PATH                */}
      {/* ============================================================ */}
      <section className="relative z-20 py-16 space-y-16">
        {/* Intro */}
        <div className="text-left max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFFFFF] border border-[#E2E8F0] text-[11px] font-mono text-[#0F172A] font-semibold uppercase tracking-wider rounded-full mb-3 shadow-sm">
            <span className="material-symbols-outlined text-[15px]">timeline</span>
            Cross-Session State Engine
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            Continuous screen watching is exhausting. Continuous context is effortless.
          </h2>
          <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
            Most market platforms blast you with raw numbers without context. Tickr maintains your state between logins, highlighting meaningful structural moves and the exact disclosures behind them.
          </p>
        </div>

        {/* Feature 1: Automatic Checkpoints */}
        <div
          ref={card1Ref}
          data-card-index={1}
          className={`p-7 bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm transition-all duration-500 max-w-3xl ${
            activeCards.includes(1) ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-6'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] font-bold text-xs">
              01
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] font-semibold">
              CROSS-SESSION BASELINES
            </span>
          </div>

          <h3 className="font-sans text-xl font-bold text-[#0F172A] mb-2">
            Catch up across days or weeks in thirty seconds.
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-5 font-sans">
            Every checkpoint acknowledgement freezes your portfolio state. Whether you check in daily, twice a week, or return from travel, every price delta is computed directly from your personal review timestamp.
          </p>

          {/* Visual Checkpoint Ledger Card */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase font-sans">Baseline Checkpoint</span>
              <span className="text-[#0F172A] font-semibold tabular-nums">$118.20</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase font-sans">Current Price</span>
              <span className="text-[#0F172A] font-semibold tabular-nums">$230.36</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase font-sans">Accumulated Drift</span>
              <span className="text-[#0F172A] font-semibold tabular-nums">+94.89%</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase font-sans">Session State</span>
              <span className="text-[#0F172A] font-semibold">Verified Frozen</span>
            </div>
          </div>
        </div>

        {/* Feature 2: Plain English Causal Analysis */}
        <div
          ref={card2Ref}
          data-card-index={2}
          className={`p-7 bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm transition-all duration-500 max-w-3xl ml-auto ${
            activeCards.includes(2) ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-6'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] font-bold text-xs">
              02
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] font-semibold">
              CAUSAL ATTRIBUTION
            </span>
          </div>

          <h3 className="font-sans text-xl font-bold text-[#0F172A] mb-2">
            Every breakout paired with verified regulatory filings.
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-5 font-sans">
            Price movement without context is pure speculation. Tickr links price and volume anomalies directly to SEC filings, earnings transcripts, and audited exchange notices.
          </p>

          {/* Visual Disclosure Card */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
              <span className="font-semibold text-[#0F172A]">SEC FORM 8-K DISCLOSURE</span>
              <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] font-semibold text-[10px]">
                HIGH CONFIDENCE
              </span>
            </div>
            <p className="text-xs font-medium text-[#0F172A] leading-relaxed">
              Enterprise datacenter hardware contracts finalized with major cloud operators, expanding GPU order backlog through Q4.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#64748B]">
              <span>Sources: Reuters • Bloomberg • SEC Edgar</span>
              <span className="text-[#0F172A] font-semibold underline cursor-pointer">
                View Evidence Delta &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* Feature 3: Intraday to a full year */}
        <div
          ref={card3Ref}
          data-card-index={3}
          className={`p-7 bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm transition-all duration-500 max-w-3xl ${
            activeCards.includes(3) ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-6'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] font-bold text-xs">
              03
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] font-semibold">
              ATTENTION ANOMALY FILTER
            </span>
          </div>

          <h3 className="font-sans text-xl font-bold text-[#0F172A] mb-2">
            Filter out everyday chop. Surface genuine outliers.
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-5 font-sans">
            Our state evaluator calculates rolling 20-day volume multipliers and price velocity vectors to compute an actionable 0 to 100 Attention Score, reserving your visual focus for high-conviction events.
          </p>

          {/* Visual Anomaly Intensity Meter */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#64748B]">Volume Anomaly Multiplier</span>
                <span className="text-[#0F172A] font-semibold">4.82x 20D Average</span>
              </div>
              <div className="h-2 w-full bg-[#E2E8F0] overflow-hidden">
                <div className="h-full bg-[#0F172A] w-4/5"></div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-1.5 bg-[#FFFFFF] border border-[#0F172A] text-[#0F172A] font-mono font-bold text-xs">
                85 / 100 ATTENTION
              </div>
              <span className="text-[11px] font-mono text-[#64748B]">CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Feature 4: High-Conviction Triage Queue */}
        <div
          ref={card4Ref}
          data-card-index={4}
          className={`p-7 bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm transition-all duration-500 max-w-3xl ml-auto ${
            activeCards.includes(4) ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-6'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] font-bold text-xs">
              04
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] font-semibold">
              EXECUTIVE TRIAGE QUEUE
            </span>
          </div>

          <h3 className="font-sans text-xl font-bold text-[#0F172A] mb-2">
            A disciplined market workflow that saves hours.
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-5 font-sans">
            Review your highest-ranked alerts in order of significance, inspect the underlying catalyst filings, acknowledge your checkpoint, and stay informed without staring at charts all day.
          </p>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 bg-[#0F172A] text-white font-semibold">
              CRITICAL BREAKOUT
            </span>
            <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] font-medium">
              4.82x VOLUME SURGE
            </span>
            <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B] font-medium">
              21 VERIFIED FILINGS
            </span>
            <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B]">
              STABLE BASELINE
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SYSTEM COMPARISON TABLE                                   */}
      {/* ============================================================ */}
      <section className="relative z-20 py-12 border-t border-[#E2E8F0]">
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] font-semibold">
            SYSTEM COMPARISON
          </span>
          <h2 className="font-sans text-2xl font-bold text-[#0F172A] tracking-tight mt-1">
            Traditional Watchlists vs. Tickr Intelligence Layer
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Designed for institutional clarity rather than continuous intraday screen watching.
          </p>
        </div>

        <div className="overflow-x-auto border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-mono text-[11px] text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold w-1/4">Evaluation Dimension</th>
                <th className="py-3 px-4 font-semibold w-3/8">Traditional Watchlist</th>
                <th className="py-3 px-4 font-semibold w-3/8 text-[#0F172A]">Tickr Intelligence Core</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">Reference Baseline</td>
                <td className="py-3.5 px-4 text-[#64748B]">Previous day close (arbitrary 24h reset)</td>
                <td className="py-3.5 px-4 font-medium text-[#0F172A] bg-[#F8FAFC]/50">
                  Your frozen session checkpoint (cross-session continuity)
                </td>
              </tr>
              <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">Anomaly Detection</td>
                <td className="py-3.5 px-4 text-[#64748B]">Raw 1D % change without volume weighting</td>
                <td className="py-3.5 px-4 font-medium text-[#0F172A] bg-[#F8FAFC]/50">
                  Attention Score (0 to 100) combining velocity & 20D volume
                </td>
              </tr>
              <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">Catalyst Attribution</td>
                <td className="py-3.5 px-4 text-[#64748B]">Unfiltered stream of third-party noise</td>
                <td className="py-3.5 px-4 font-medium text-[#0F172A] bg-[#F8FAFC]/50">
                  Direct linkage to audited SEC filings & verified catalyst wires
                </td>
              </tr>
              <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">Cognitive Workflow</td>
                <td className="py-3.5 px-4 text-[#64748B]">Continuous screen monitoring & mental math</td>
                <td className="py-3.5 px-4 font-medium text-[#0F172A] bg-[#F8FAFC]/50">
                  Instant visual triage of deltas accumulated since you last checked
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. FAQ ACCORDION ("Good questions.")                         */}
      {/* ============================================================ */}
      <section className="relative z-20 py-12 border-t border-[#E2E8F0]">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FFFFFF] border border-[#E2E8F0] text-[10px] font-mono text-[#64748B] font-semibold uppercase rounded-full mb-2">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="font-sans text-3xl font-bold tracking-tight text-[#0F172A]">
            Core architecture & mechanics.
          </h2>
        </div>

        <div className="space-y-3 max-w-3xl">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="bg-[#FFFFFF] border border-[#E2E8F0] transition-colors duration-150 shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full text-left py-4 px-5 flex items-center justify-between gap-4 font-sans text-sm font-semibold text-[#0F172A] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-base font-mono text-[#64748B] transition-transform duration-200">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#F1F5F9] pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FINAL LAUNCHER BANNER                                     */}
      {/* ============================================================ */}
      <section className="relative z-20 pt-8">
        <div className="p-8 sm:p-10 bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-sans text-2xl font-bold text-[#0F172A] tracking-tight">
              Ready to explore your market watchlist?
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-xl font-sans">
              Enter your research terminal to monitor real-time prices, evaluate checkpoint baselines, and inspect catalyst filings.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onEnterApp('dashboard')}
              className="px-6 py-3.5 bg-[#0F172A] text-white hover:bg-[#1E293B] text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-2 rounded-sm shadow-sm"
            >
              <span>Launch Terminal Workspace</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
