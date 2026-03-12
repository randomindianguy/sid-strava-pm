import { useState, useEffect, useRef } from "react";

const STRAVA_ORANGE = "#FC4C02";
const BG_PRIMARY = "#000000";
const BG_CARD = "#141414";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#CCCCCC";
const TEXT_MUTED = "#909090";
const BORDER_SUBTLE = "#2a2a2a";
const GREEN = "#22C55E";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes progressFill { from { width: 0%; } to { width: 100%; } }
`;

const runningHooks = [
  { label: "Route map with GPS trace", category: "visual" },
  { label: "6-metric stat grid", category: "data" },
  { label: "Group activity tagging", category: "social" },
  { label: "Shoe/gear tracking", category: "data" },
  { label: "Athlete Intelligence AI summary", category: "premium" },
  { label: "Workout Analysis with laps", category: "premium" },
  { label: "3D Route Flyover", category: "premium" },
  { label: "Best Efforts with PR badges", category: "reward" },
  { label: "Performance Predictions", category: "premium" },
  { label: "Results: efforts, segments, achievements", category: "reward" },
  { label: "Segment placement with medals", category: "reward" },
  { label: "Splits table with pace bars", category: "data" },
  { label: "Pace chart visualization", category: "visual" },
  { label: "Elevation profile chart", category: "visual" },
  { label: "Matched Runs comparison", category: "premium" },
];

const weightHooks = [
  { label: "Text wall behind 'Read more...'", category: "data" },
  { label: "Elapsed time", category: "data" },
  { label: "Generic streak badge", category: "reward" },
  { label: "Partner logo (Hevy)", category: "other" },
  { label: "Kudos count", category: "social" },
];

const workoutExercises = [
  { name: "Pull Up (Assisted)", sets: [{ w: 0, r: 2 }], muscle: "back" },
  { name: "Single Arm Cable Row", sets: [{ w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 6 }], muscle: "back" },
  { name: "Incline Bench Press (DB)", sets: [{ w: 25, r: 8 }, { w: 27.5, r: 8 }, { w: 27.5, r: 8 }], muscle: "chest" },
  { name: "Preacher Curl (Barbell)", sets: [{ w: 30, r: 8 }, { w: 40, r: 10 }, { w: 40, r: 8 }], muscle: "arms" },
  { name: "Bicep Curl (Dumbbell)", sets: [{ w: 15, r: 10 }, { w: 15, r: 12 }, { w: 15, r: 12 }], muscle: "arms" },
  { name: "Stair Machine", sets: [{ w: 0, r: 0, note: "5 min" }], muscle: "legs" },
];

const apiFields = [
  { name: "name", type: "String", desc: "Activity name" },
  { name: "sport_type", type: "String", desc: '"WeightTraining"' },
  { name: "start_date_local", type: "Date", desc: "Timestamp" },
  { name: "elapsed_time", type: "Integer", desc: "Duration in seconds" },
  { name: "description", type: "String", desc: "Free text \u2014 where Hevy dumps everything", hl: true },
  { name: "distance", type: "Float", desc: "In meters" },
  { name: "trainer", type: "Integer", desc: "Trainer flag" },
  { name: "commute", type: "Integer", desc: "Commute flag" },
];

const streamTypes = ["AltitudeStream","CadenceStream","DistanceStream","HeartrateStream","LatLngStream","MovingStream","PowerStream","SmoothGradeStream","SmoothVelocityStream","TemperatureStream","TimeStream"];
const missingModels = ["ExerciseSet","RepCount","WeightLifted","MuscleGroup","ExerciseStream","VolumeMetric"];

const totalVolume = workoutExercises.reduce((s, e) => s + e.sets.reduce((a, set) => a + set.w * set.r, 0), 0);
const totalSets = workoutExercises.reduce((s, e) => s + e.sets.length, 0);
const totalReps = workoutExercises.reduce((s, e) => s + e.sets.reduce((a, set) => a + set.r, 0), 0);

const muscleGroups = { back: 0, chest: 0, arms: 0, legs: 0 };
workoutExercises.forEach(ex => { const v = ex.sets.reduce((s, set) => s + set.w * set.r, 0); if (muscleGroups[ex.muscle] !== undefined) muscleGroups[ex.muscle] += v; });
const maxMuscleVol = Math.max(...Object.values(muscleGroups));

function FadeIn({ children, delay = 0 }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 }); if (ref.current) o.observe(ref.current); return () => o.disconnect(); }, []);
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>{children}</div>;
}

function Label({ children }) { return <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: STRAVA_ORANGE, marginBottom: "12px" }}>{children}</div>; }
function Divider() { return <div style={{ height: "1px", background: BORDER_SUBTLE, margin: "80px 0" }} />; }
function Wrap({ children }) { return <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>{children}</div>; }
function P({ children }) { return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", lineHeight: 1.7, color: TEXT_SECONDARY, margin: "0 0 16px", maxWidth: "600px" }}>{children}</p>; }
function H2({ children }) { return <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, lineHeight: 1.2, margin: "0 0 16px", color: TEXT_PRIMARY }}>{children}</h2>; }
function Card({ children, style = {} }) { return <div style={{ background: BG_CARD, borderRadius: "12px", padding: "28px", border: `1px solid ${BORDER_SUBTLE}`, ...style }}>{children}</div>; }

function HookPill({ label, category, dim }) {
  const c = { visual: "#3B82F6", data: "#8B5CF6", social: "#EC4899", reward: "#F59E0B", premium: STRAVA_ORANGE, other: TEXT_MUTED };
  return <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: `1px solid ${dim ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`, fontSize: "13px", color: dim ? "#BBBBBB" : TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif", opacity: dim ? 0.85 : 1 }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dim ? "#888" : c[category] || TEXT_MUTED, flexShrink: 0 }} />{label}</div>;
}

function CurrentCard() {
  return (
    <div style={{ background: BG_CARD, borderRadius: "12px", padding: "24px", border: `1px solid ${BORDER_SUBTLE}`, height: "100%",  }}>
      <div style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>Workout A</div>
      <div style={{ fontSize: "13px", color: TEXT_MUTED, marginBottom: "20px" }}>Logged with Hevy</div>
      <div style={{ fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.8, marginBottom: "16px", maxHeight: "120px", overflow: "hidden", position: "relative" }}>
        <div>Pull Up (Assisted)</div><div style={{ color: TEXT_MUTED }}>Set 1: 0 lbs x 2</div>
        <div style={{ marginTop: "8px" }}>Single Arm Cable Row</div><div style={{ color: TEXT_MUTED }}>Set 1: 93 lbs x 8</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "48px", background: `linear-gradient(transparent, ${BG_CARD})` }} />
      </div>
      <div style={{ fontSize: "13px", color: STRAVA_ORANGE, marginBottom: "20px" }}>Read more...</div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(252,76,2,0.08)", borderRadius: "8px", marginBottom: "20px" }}>
        <span style={{ fontSize: "16px" }}>🔥</span><span style={{ fontSize: "13px", color: TEXT_SECONDARY }}>You reached a 3 week streak!</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: "16px" }}>
        <span style={{ fontSize: "13px", color: TEXT_MUTED }}>Elapsed Time</span><span style={{ fontSize: "18px", fontWeight: 600 }}>43:35</span>
      </div>
      <div style={{ marginTop: "16px", fontSize: "12px", color: TEXT_MUTED, textAlign: "center" }}>2 gave kudos</div>
    </div>
  );
}

function RedesignedCard({ week = 1 }) {
  return (
    <div style={{ background: BG_CARD, borderRadius: "12px", padding: "24px", border: `1px solid ${BORDER_SUBTLE}`, height: "100%",  }}>
      <div style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>Workout A — Upper Body Pull</div>
      <div style={{ fontSize: "13px", color: TEXT_MUTED, marginBottom: "20px" }}>Logged with Hevy · 43:35 · 6 exercises</div>

      {/* Volume summary with trend badge */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {[{ v: totalVolume.toLocaleString(), l: "lbs lifted" }, { v: totalSets, l: "sets" }, { v: totalReps, l: "reps" }].map((x, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "12px", textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{x.v}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: TEXT_MUTED, marginTop: "2px" }}>{x.l}</div>
            {week >= 4 && i === 0 && (
              <div style={{
                position: "absolute", top: "6px", right: "6px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", fontWeight: 600,
                color: GREEN, background: "rgba(34,197,94,0.12)", padding: "2px 6px", borderRadius: "4px",
                animation: "fadeSlideIn 0.5s ease forwards",
              }}>{week >= 8 ? "↑ 18%" : "↑ 8%"}</div>
            )}
          </div>
        ))}
      </div>

      {/* Muscle split */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", fontWeight: 500, color: TEXT_MUTED, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Muscle Split</div>
        {Object.entries(muscleGroups).filter(([, v]) => v > 0).map(([m, v]) => (
          <div key={m} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ fontSize: "12px", color: TEXT_SECONDARY, width: "48px", textTransform: "capitalize" }}>{m}</div>
            <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${(v / maxMuscleVol) * 100}%`, height: "100%", background: m === "back" ? "#3B82F6" : m === "chest" ? "#8B5CF6" : m === "arms" ? "#EC4899" : GREEN, borderRadius: "3px", transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: TEXT_MUTED, width: "50px", textAlign: "right" }}>{v.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Exercises */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", fontWeight: 500, color: TEXT_MUTED, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Exercises</div>
        {workoutExercises.filter(e => e.sets[0].w > 0).slice(0, 4).map((ex, i) => {
          const top = Math.max(...ex.sets.map(s => s.w));
          const vol = ex.sets.reduce((s, set) => s + set.w * set.r, 0);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
              <div><div style={{ fontSize: "13px" }}>{ex.name}</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: TEXT_MUTED, marginTop: "2px" }}>{ex.sets.length} sets · top set {top} lbs</div></div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: TEXT_SECONDARY }}>{vol.toLocaleString()} lbs</div>
            </div>
          );
        })}
      </div>

      {/* Week 4+: Progressive overload */}
      <div style={{
        opacity: week >= 4 ? 1 : 0,
        transition: "opacity 0.5s ease",
        marginBottom: "16px",
        pointerEvents: week >= 4 ? "auto" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "8px" }}>
          <span style={{ fontSize: "14px" }}>📈</span><span style={{ fontSize: "13px", color: GREEN }}>Cable Row: +5 lbs vs. week 1 · Curl volume PR</span>
        </div>
      </div>

      {/* Week 8+: Social edge */}
      <div style={{
        opacity: week >= 8 ? 1 : 0,
        transition: "opacity 0.5s ease 0.15s",
        marginBottom: "16px",
        pointerEvents: week >= 8 ? "auto" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "8px" }}>
          <span style={{ fontSize: "14px" }}>👥</span><span style={{ fontSize: "13px", color: "#60A5FA" }}>12 athletes logged this workout this week · You're top 20% by volume</span>
        </div>
      </div>

      {/* Subscription upsell */}
      <div style={{ padding: "14px", background: "linear-gradient(135deg, rgba(252,76,2,0.08), rgba(252,76,2,0.02))", border: "1px solid rgba(252,76,2,0.15)", borderRadius: "8px", transition: "all 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}><span style={{ fontSize: "10px" }}>🔒</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: STRAVA_ORANGE, letterSpacing: "1px" }}>SUBSCRIBER INSIGHT</span></div>
        <div style={{ fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.5 }}>
          {week < 4 ? "Track your lift trends over time. Subscribe to see progressive overload and volume analysis." :
           week < 8 ? "Your back volume is up 12% this month. At this rate, you'll hit a Cable Row PR by week 6..." :
           "You've gained 18% back strength in 8 weeks. See how you compare to athletes at your level →"}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ weeks, title, description, isLast }) {
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(252,76,2,0.1)", border: `2px solid ${STRAVA_ORANGE}`, display: "flex", alignItems: "center", justifyContent: "center" }} />
        {!isLast && <div style={{ width: "2px", flex: 1, background: BORDER_SUBTLE, minHeight: "40px" }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : "32px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: STRAVA_ORANGE, letterSpacing: "1px", marginBottom: "4px" }}>{weeks}</div>
        <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>{title}</div>
        <div style={{ fontSize: "14px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>{description}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [week, setWeek] = useState(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const weeks = [1, 4, 8];

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setWeek(prev => {
        const idx = weeks.indexOf(prev);
        return weeks[(idx + 1) % weeks.length];
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const handleWeekClick = (w) => { setAutoPlay(false); setWeek(w); };

  return (
    <><style>{fonts}</style>
    <div style={{ background: BG_PRIMARY, color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>

      {/* ═══ SITUATION → COMPLICATION → ANSWER ═══ */}
      <Wrap><div style={{ paddingTop: "80px" }}>
        <FadeIn>
          <Label>Strava PM Internship · Summer 2026</Label>
          <P>Strava built one of the best engagement flywheels in fitness. A runner records an activity and gets a rich social object — maps, pace charts, splits, segment placements, PR badges — that generates kudos, comments, and return visits. That feedback loop drives habit formation and subscription conversion. It works.</P>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, lineHeight: 1.15, margin: "32px 0 20px" }}>
            But the flywheel is hardcoded to GPS.<br /><span style={{ color: TEXT_MUTED }}>And its fastest-growing users are proving it.</span>
          </h1>
          <P>As 54% of users now track multiple activities and non-GPS sport types grow fastest — weight training, walking, yoga, indoor workouts — a rising share of activities produce social objects too thin to sustain the content loop.</P>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "32px 0 12px" }}>
            {[{ v: "54%", l: "of users track multiple sports" }, { v: "2×", l: "Gen Z vs Gen X say lifting is primary sport" }, { v: "+25%", l: "women's weight training uploads YoY" }].map((s, i) => (
              <div key={i} style={{ background: BG_CARD, border: `1px solid ${BORDER_SUBTLE}`, borderRadius: "8px", padding: "14px 18px", flex: "1 1 180px" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: STRAVA_ORANGE }}>{s.v}</div>
                <div style={{ fontSize: "12px", color: TEXT_MUTED, marginTop: "2px" }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: TEXT_MUTED }}>Source: Strava Year in Sport 2025 Trend Report</div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ marginTop: "48px", padding: "24px", background: "rgba(252,76,2,0.04)", border: "1px solid rgba(252,76,2,0.15)", borderRadius: "10px", borderLeft: `3px solid ${STRAVA_ORANGE}` }}>
            <Label>My Hypothesis</Label>
            <div style={{ fontSize: "18px", fontWeight: 600, lineHeight: 1.5, marginBottom: "12px" }}>This is a rendering problem, not a user intent problem.</div>
            <P>Weight trainers aren't disengaged because they don't want social feedback — they're disengaged because their activity post gives followers nothing to engage with. If we render the same data as a rich social object, engagement metrics on strength posts will approach parity with GPS posts — proving the flywheel architecture generalizes beyond GPS.</P>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div style={{ marginTop: "24px", padding: "20px 24px", background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER_SUBTLE}`, borderRadius: "10px" }}>
            <div style={{ fontSize: "14px", color: TEXT_SECONDARY, lineHeight: 1.7 }}>
              <strong style={{ color: TEXT_PRIMARY }}>A fair question: why hasn't Strava done this?</strong> Their recent bets tell a clear story — Runna acquisition (running), Instant Workouts (running), Routes redesign (GPS). Every major investment doubles down on endurance. Revenue grew to $415M in 2025. That strategy is working. This project isn't arguing it's wrong. It's arguing that the flywheel architecture Strava built for GPS is more valuable than they realize — and a 12-week experiment can prove whether it generalizes, at low cost and low risk to the core business.
            </div>
          </div>
        </FadeIn>
      </div><Divider /></Wrap>

      {/* ═══ REASON 1: The engagement gap ═══ */}
      <Wrap>
        <FadeIn><Label>Reason 1</Label><H2>The same athlete gets two different products.</H2>
          <P>A single running activity generates ~15 engagement hooks. A weight training activity generates ~5, mostly inert. The UGC content loop — post, get feedback, return, post again — can't grip a text wall.</P>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}><span style={{ fontSize: "48px", fontWeight: 700 }}>15</span><span style={{ fontSize: "14px", color: TEXT_MUTED }}>engagement hooks</span></div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>🏃 Running Activity</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{runningHooks.map((h, i) => <HookPill key={i} {...h} />)}</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}><span style={{ fontSize: "48px", fontWeight: 700, color: "#AAA" }}>5</span><span style={{ fontSize: "14px", color: TEXT_MUTED }}>engagement hooks</span></div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>🏋️ Weight Training Activity</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{weightHooks.map((h, i) => <HookPill key={i} {...h} dim />)}</div>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <Card>
            <Label>Why This Matters — Engagement Equation</Label>
            <div style={{ fontSize: "28px", fontWeight: 700, textAlign: "center", margin: "8px 0 16px" }}>E = F × I</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>For runners, Strava drives both</div>
                <div style={{ fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.6 }}><strong style={{ color: TEXT_PRIMARY }}>Frequency:</strong> Social feedback pulls you back. <strong style={{ color: TEXT_PRIMARY }}>Intensity:</strong> Rich data means time analyzing, exploring segments, comparing splits.</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>For lifters, Strava drives neither</div>
                <div style={{ fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.6 }}><strong style={{ color: TEXT_PRIMARY }}>Frequency:</strong> Gym habit drives return, not Strava. <strong style={{ color: TEXT_PRIMARY }}>Intensity:</strong> Nothing to analyze, explore, or compare.</div>
              </div>
            </div>
            <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", borderLeft: `2px solid ${TEXT_MUTED}` }}>
              <div style={{ fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>Beyond engagement, the GPS dependency prevents Strava from building <strong style={{ color: TEXT_PRIMARY }}>switching costs</strong> for non-GPS users. A runner's Strava history — segment PRs, route library, fitness score trajectory — makes leaving costly. A weight trainer's history is a pile of text blobs. They could delete Strava tomorrow and lose nothing.</div>
            </div>
          </Card>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Card style={{ marginTop: "24px" }}>
            <Label>Who's affected</Label>
            <div style={{ display: "grid", gap: "12px" }}>
              {[
                { actor: "Weight trainers", impact: "Feedback loop doesn't form → no Strava habit → churn or stay casual forever" },
                { actor: "Their followers", impact: "Feed fills with 'Workout — 45 min' posts nobody can engage with → feed quality dilutes" },
                { actor: "Partners (Hevy, etc.)", impact: "'Logged with Hevy' gets zero visibility on a text wall → weak marketing for the partner ecosystem" },
                { actor: "Strava's business", impact: "No subscription upsell surface for strength users → can't tease Athlete Intelligence when there's no data to analyze" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", fontSize: "13px", lineHeight: 1.5 }}>
                  <div style={{ color: STRAVA_ORANGE, fontWeight: 600, minWidth: "130px", flexShrink: 0 }}>{a.actor}</div>
                  <div style={{ color: TEXT_SECONDARY }}>{a.impact}</div>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
        <Divider />
      </Wrap>

      {/* ═══ REASON 2: The root cause ═══ */}
      <Wrap>
        <FadeIn><Label>Reason 2</Label><H2>The API has no data model for strength.</H2>
          <P>Strava's <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "3px" }}>createActivity</code> endpoint accepts 9 fields. None model exercises, sets, reps, or weight. All 11 stream types are GPS/endurance-specific. Partners like Hevy can only stuff structured data into the free-text description field. This isn't a feature gap — it's an infrastructure decision.</P>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: TEXT_MUTED, fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Field</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: TEXT_MUTED, fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: TEXT_MUTED, fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Purpose</th>
                </tr></thead>
                <tbody>{apiFields.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
                    <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: f.hl ? STRAVA_ORANGE : TEXT_PRIMARY }}>{f.name}</td>
                    <td style={{ padding: "8px 12px", color: TEXT_MUTED }}>{f.type}</td>
                    <td style={{ padding: "8px 12px", color: f.hl ? STRAVA_ORANGE : TEXT_SECONDARY }}>{f.desc}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ marginTop: "20px" }}>
              <div style={{ fontSize: "12px", color: TEXT_MUTED, marginBottom: "8px" }}>11 available stream types — all GPS/endurance:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{streamTypes.map((s, i) => <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.07)", color: "#BBBBBB" }}>{s}</span>)}</div>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "12px", color: TEXT_MUTED, marginBottom: "8px" }}>0 models for strength data. These don't exist:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{missingModels.map((s, i) => <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(252,76,2,0.08)", color: STRAVA_ORANGE, border: "1px dashed rgba(252,76,2,0.2)" }}>{s}</span>)}</div>
            </div>
            <div style={{ marginTop: "20px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: TEXT_MUTED }}>Source: developers.strava.com/docs/reference — verified March 2026</div>
          </Card>
        </FadeIn>
        <Divider />
      </Wrap>

      {/* ═══ REASON 3: The solution ═══ */}
      <Wrap>
        <FadeIn><Label>Reason 3</Label><H2>The data already exists. It just isn't rendered.</H2>
          <P>Using real workout data from my own Hevy → Strava sync. Left: what Strava shows today. Right: what's possible with the same data, rendered as a social object worth engaging with.</P>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: TEXT_MUTED, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>Reward evolution over time</div>
            <div style={{ display: "flex", gap: "4px", background: BG_CARD, borderRadius: "8px", padding: "4px", width: "fit-content", position: "relative" }}>
              {[{ w: 1, label: "Week 1 — Basics" }, { w: 4, label: "Week 4 — Overload" }, { w: 8, label: "Week 8 — Social" }].map(({ w, label }) => (
                <button key={w} onClick={() => handleWeekClick(w)} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 500, padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
                  background: week === w ? STRAVA_ORANGE : "transparent", color: week === w ? "#fff" : TEXT_MUTED, transition: "all 0.2s ease",
                  position: "relative", overflow: "hidden",
                }}>
                  {label}
                  {week === w && autoPlay && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, height: "2px",
                      background: "rgba(255,255,255,0.4)", borderRadius: "1px",
                      animation: "progressFill 3.5s linear",
                    }} />
                  )}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "12px", color: TEXT_MUTED, marginTop: "8px", lineHeight: 1.5 }}>
              {week === 1 ? "Day one: parsed text data rendered as volume summary, muscle split, and exercise breakdown. No comparison data yet." :
               week === 4 ? "With 4 weeks of history, progressive overload signals appear. Continuous rewards based on your own trajectory." :
               "By week 8, enough behavioral data to introduce social edges — rival matching, community benchmarks. Variable rewards earned, not assumed."}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: STRAVA_ORANGE, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>Current</div>
              <CurrentCard />
            </div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: GREEN, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>Redesigned — {week === 1 ? "Week 1" : week === 4 ? "Week 4" : "Week 8"}</div>
              <RedesignedCard week={week} />
            </div>
          </div>
        </FadeIn>
        <Divider />
      </Wrap>

      {/* ═══ EXECUTION ═══ */}
      <Wrap>
        <FadeIn><Label>Execution</Label><H2>How I'd ship this in 12 weeks.</H2></FadeIn>
        <FadeIn delay={0.1}>
          <TimelineItem weeks="WEEKS 1–3" title="Instrument + Define" description="Map semi-structured text patterns in description fields from Hevy, Apple Health, and Garmin syncs. Build a parser that extracts exercise names, sets, reps, and weights from the text blob. Define which fields are reliably parseable vs. noisy. Scope what a structured API extension would look like. Interview 15–20 multi-sport users to validate the rendering gap affects engagement." />
          <TimelineItem weeks="WEEKS 4–8" title="Build + A/B Test" description="Build the rich rendering layer using parsed description data. A/B test against current text display for new weight training activities. Primary metrics: kudos per activity, comments per activity, feed engagement rate on strength posts, return visits within 48 hours of posting." />
          <TimelineItem weeks="WEEKS 9–11" title="Measure Downstream Impact" description="Does richer rendering increase subscription trial starts for strength-primary users? Does it shift engagement bucket distribution (casual → core)? Measure whether the flywheel architecture generalizes beyond GPS." />
          <TimelineItem weeks="WEEK 12" title="Ship or Iterate" description="Ship to production or iterate based on data. Document findings on non-GPS activity rendering. Recommend next sport types (yoga, hiking, indoor cycling) to apply the same treatment." isLast />
        </FadeIn>
        <Divider />
      </Wrap>

      {/* ═══ RISKS ═══ */}
      <Wrap>
        <FadeIn><Label>Risks I'd Validate</Label>
          <div style={{ display: "grid", gap: "16px" }}>
            {[
              { t: "Partnership tension", d: "Building richer strength rendering could be seen as competing with Hevy/Strong/Fitbod. The framing matters: this makes partner data MORE visible, not less. 'Logged with Hevy' gets far more visibility on an engaging post than on a text wall." },
              { t: "API investment", d: "The full vision (lift PRs, progressive overload, volume trends) requires structured API fields — not just parsed text. The 12-week scope tests whether rendering improvements alone move metrics enough to justify the deeper infrastructure investment." },
              { t: "Strategic prioritization", d: "Strava may intentionally focus on GPS sports. This project tests whether the flywheel architecture generalizes — if non-GPS rendering moves engagement, it builds the case. If it doesn't, that's also a clear signal." },
            ].map((r, i) => (
              <Card key={i} style={{ padding: "20px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{r.t}</div>
                <div style={{ fontSize: "14px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>{r.d}</div>
              </Card>
            ))}
          </div>
        </FadeIn>
      </Wrap>

      {/* ═══ FOOTER ═══ */}
      <Wrap><div style={{ padding: "80px 0 60px", textAlign: "center" }}>
        <FadeIn><div style={{ fontSize: "14px", color: TEXT_MUTED, lineHeight: 1.7 }}>
          Built by <a href="https://sidharthsundaram.com" target="_blank" rel="noopener" style={{ color: STRAVA_ORANGE, textDecoration: "none" }}>Sidharth Sundaram</a>
          {" "}·{" "}<a href="https://linkedin.com/in/sidharthsundaram" target="_blank" rel="noopener" style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>LinkedIn</a>
          {" "}·{" "}<a href="mailto:sundar84@purdue.edu" style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>sundar84@purdue.edu</a>
          <br />MS Engineering Management, Purdue University · Summer 2026
        </div></FadeIn>
      </div></Wrap>

    </div></>
  );
}
