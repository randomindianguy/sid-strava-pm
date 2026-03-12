import { useState, useEffect, useRef } from "react";

const STRAVA_ORANGE = "#FC4C02";
const BG_PRIMARY = "#000000";
const BG_CARD = "#141414";
const BG_CARD_HOVER = "#1a1a1a";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#CCCCCC";
const TEXT_MUTED = "#909090";
const BORDER_SUBTLE = "#2a2a2a";

const fonts = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
`;

// ─── Data ────────────────────────────────────────────────────────────
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

const workoutData = {
  title: "Workout A",
  source: "Hevy",
  date: "March 2, 2026",
  duration: "43:35",
  exercises: [
    { name: "Pull Up (Assisted)", sets: [{ w: 0, r: 2 }], muscle: "back" },
    { name: "Single Arm Cable Row", sets: [{ w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 8 }, { w: 93, r: 6 }], muscle: "back" },
    { name: "Incline Bench Press (DB)", sets: [{ w: 25, r: 8 }, { w: 27.5, r: 8 }, { w: 27.5, r: 8 }], muscle: "chest" },
    { name: "Preacher Curl (Barbell)", sets: [{ w: 30, r: 8 }, { w: 40, r: 10 }, { w: 40, r: 8 }], muscle: "arms" },
    { name: "Bicep Curl (Dumbbell)", sets: [{ w: 15, r: 10 }, { w: 15, r: 12 }, { w: 15, r: 12 }], muscle: "arms" },
    { name: "Stair Machine", sets: [{ w: 0, r: 0, note: "5 min" }], muscle: "legs" },
  ],
};

const apiFields = [
  { name: "name", type: "String", desc: "Activity name", gps: false },
  { name: "sport_type", type: "String", desc: '"WeightTraining"', gps: false },
  { name: "start_date_local", type: "Date", desc: "Timestamp", gps: false },
  { name: "elapsed_time", type: "Integer", desc: "Duration in seconds", gps: false },
  { name: "description", type: "String", desc: "Free text (where Hevy dumps everything)", gps: false },
  { name: "distance", type: "Float", desc: "In meters", gps: true },
  { name: "trainer", type: "Integer", desc: "Trainer flag", gps: true },
  { name: "commute", type: "Integer", desc: "Commute flag", gps: true },
];

const streamTypes = [
  "AltitudeStream", "CadenceStream", "DistanceStream", "HeartrateStream",
  "LatLngStream", "MovingStream", "PowerStream", "SmoothGradeStream",
  "SmoothVelocityStream", "TemperatureStream", "TimeStream"
];

const missingModels = [
  "ExerciseSet", "RepCount", "WeightLifted", "MuscleGroup", "ExerciseStream", "VolumeMetric"
];

// ─── Utility ─────────────────────────────────────────────────────────
const totalVolume = workoutData.exercises.reduce((sum, ex) => {
  return sum + ex.sets.reduce((s, set) => s + (set.w * set.r), 0);
}, 0);

const totalSets = workoutData.exercises.reduce((s, ex) => s + ex.sets.length, 0);
const totalReps = workoutData.exercises.reduce((s, ex) => s + ex.sets.reduce((r, set) => r + set.r, 0), 0);

const muscleGroups = { back: 0, chest: 0, arms: 0, legs: 0 };
workoutData.exercises.forEach(ex => {
  const vol = ex.sets.reduce((s, set) => s + (set.w * set.r), 0);
  if (muscleGroups[ex.muscle] !== undefined) muscleGroups[ex.muscle] += vol;
});
const maxMuscleVol = Math.max(...Object.values(muscleGroups));

// ─── Components ──────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "11px",
      fontWeight: 500,
      letterSpacing: "2px",
      textTransform: "uppercase",
      color: STRAVA_ORANGE,
      marginBottom: "12px",
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: BORDER_SUBTLE, margin: "80px 0" }} />;
}

function HookPill({ label, category, dim }) {
  const colors = {
    visual: "#3B82F6",
    data: "#8B5CF6",
    social: "#EC4899",
    reward: "#F59E0B",
    premium: STRAVA_ORANGE,
    other: TEXT_MUTED,
  };
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "6px",
      background: dim ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${dim ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`,
      fontSize: "13px",
      color: dim ? "#BBBBBB" : TEXT_SECONDARY,
      fontFamily: "'DM Sans', sans-serif",
      opacity: dim ? 0.85 : 1,
    }}>
      <span style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: dim ? "#888888" : colors[category] || TEXT_MUTED,
        flexShrink: 0,
      }} />
      {label}
    </div>
  );
}

function BigNumber({ number, label, unit, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "48px",
        fontWeight: 700,
        color: color || TEXT_PRIMARY,
        lineHeight: 1,
      }}>
        {number}{unit && <span style={{ fontSize: "20px", fontWeight: 400, color: TEXT_MUTED }}>{unit}</span>}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: TEXT_MUTED,
        marginTop: "8px",
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Current Weight Training Card ────────────────────────────────────
function CurrentCard() {
  return (
    <div style={{
      background: BG_CARD,
      borderRadius: "12px",
      padding: "24px",
      border: `1px solid ${BORDER_SUBTLE}`,
      height: "100%",
    }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "20px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "4px" }}>
        Workout A
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_MUTED, marginBottom: "20px" }}>
        Logged with Hevy
      </div>

      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "13px",
        color: TEXT_SECONDARY,
        lineHeight: 1.8,
        marginBottom: "16px",
        maxHeight: "120px",
        overflow: "hidden",
        position: "relative",
      }}>
        <div>Pull Up (Assisted)</div>
        <div style={{ color: TEXT_MUTED }}>Set 1: 0 lbs x 2</div>
        <div style={{ marginTop: "8px" }}>Single Arm Cable Row</div>
        <div style={{ color: TEXT_MUTED }}>Set 1: 93 lbs x 8</div>
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "48px",
          background: `linear-gradient(transparent, ${BG_CARD})`,
        }} />
      </div>

      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "13px",
        color: STRAVA_ORANGE,
        marginBottom: "20px",
        cursor: "pointer",
      }}>
        Read more...
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(252, 76, 2, 0.08)",
        borderRadius: "8px",
        marginBottom: "20px",
      }}>
        <span style={{ fontSize: "16px" }}>🔥</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_SECONDARY }}>
          You reached a 3 week streak!
        </span>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${BORDER_SUBTLE}`,
        paddingTop: "16px",
      }}>
        <div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_MUTED }}>
            Elapsed Time
          </span>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontWeight: 600, color: TEXT_PRIMARY }}>
          43:35
        </div>
      </div>

      <div style={{
        marginTop: "16px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "12px",
        color: TEXT_MUTED,
        textAlign: "center",
      }}>
        2 gave kudos
      </div>
    </div>
  );
}

// ─── Redesigned Weight Training Card ─────────────────────────────────
function RedesignedCard() {
  return (
    <div style={{
      background: BG_CARD,
      borderRadius: "12px",
      padding: "24px",
      border: `1px solid ${BORDER_SUBTLE}`,
      height: "100%",
    }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "20px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "4px" }}>
        Workout A — Upper Body Pull
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_MUTED, marginBottom: "20px" }}>
        Logged with Hevy · 43:35 · 6 exercises
      </div>

      {/* Volume Summary */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px",
        marginBottom: "20px",
      }}>
        {[
          { val: totalVolume.toLocaleString(), label: "lbs lifted" },
          { val: totalSets, label: "sets" },
          { val: totalReps, label: "reps" },
        ].map((item, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "8px",
            padding: "12px",
            textAlign: "center",
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "20px", fontWeight: 700, color: TEXT_PRIMARY }}>
              {item.val}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: TEXT_MUTED, letterSpacing: "0.5px", marginTop: "2px" }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Muscle Split */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500, color: TEXT_MUTED, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Muscle Split
        </div>
        {Object.entries(muscleGroups).filter(([, v]) => v > 0).map(([muscle, vol]) => (
          <div key={muscle} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: TEXT_SECONDARY, width: "48px", textTransform: "capitalize" }}>
              {muscle}
            </div>
            <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                width: `${(vol / maxMuscleVol) * 100}%`,
                height: "100%",
                background: muscle === "back" ? "#3B82F6" : muscle === "chest" ? "#8B5CF6" : muscle === "arms" ? "#EC4899" : "#22C55E",
                borderRadius: "3px",
                transition: "width 0.8s ease",
              }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: TEXT_MUTED, width: "50px", textAlign: "right" }}>
              {vol.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Breakdown */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500, color: TEXT_MUTED, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Exercises
        </div>
        {workoutData.exercises.filter(e => e.sets[0].w > 0).slice(0, 4).map((ex, i) => {
          const topSet = Math.max(...ex.sets.map(s => s.w));
          const totalExVol = ex.sets.reduce((s, set) => s + set.w * set.r, 0);
          return (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: `1px solid ${BORDER_SUBTLE}`,
            }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_PRIMARY }}>
                  {ex.name}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: TEXT_MUTED, marginTop: "2px" }}>
                  {ex.sets.length} sets · top set {topSet} lbs
                </div>
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: TEXT_SECONDARY,
              }}>
                {totalExVol.toLocaleString()} lbs
              </div>
            </div>
          );
        })}
      </div>

      {/* PR / Overload Hint */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(34, 197, 94, 0.08)",
        border: "1px solid rgba(34, 197, 94, 0.15)",
        borderRadius: "8px",
        marginBottom: "16px",
      }}>
        <span style={{ fontSize: "14px" }}>📈</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#22C55E" }}>
          Cable Row: +5 lbs vs. last week · Curl volume PR
        </span>
      </div>

      {/* Premium Upsell Teaser */}
      <div style={{
        padding: "14px",
        background: `linear-gradient(135deg, rgba(252,76,2,0.08), rgba(252,76,2,0.02))`,
        border: `1px solid rgba(252,76,2,0.15)`,
        borderRadius: "8px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <span style={{ fontSize: "10px" }}>🔒</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: STRAVA_ORANGE, letterSpacing: "1px" }}>
            SUBSCRIBER INSIGHT
          </span>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.5 }}>
          Your back volume is up 12% this month. At this rate, you'll hit a Cable Row PR by week 6...
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────
function TimelineItem({ weeks, title, description, isLast }) {
  return (
    <div style={{ display: "flex", gap: "20px", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "rgba(252,76,2,0.1)",
          border: `2px solid ${STRAVA_ORANGE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          fontWeight: 500,
          color: STRAVA_ORANGE,
        }} />
        {!isLast && (
          <div style={{ width: "2px", flex: 1, background: BORDER_SUBTLE, minHeight: "40px" }} />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : "32px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: STRAVA_ORANGE, letterSpacing: "1px", marginBottom: "4px" }}>
          {weeks}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "6px" }}>
          {title}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
export default function App() {

  return (
    <>
      <style>{fonts}</style>
      <div style={{
        background: BG_PRIMARY,
        color: TEXT_PRIMARY,
        fontFamily: "'DM Sans', sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
      }}>
        {/* ─── Hero ───────────────────────────────────────────── */}
        <div style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "80px 24px 0",
        }}>
          <FadeIn>
            <SectionLabel>Strava PM Internship · Summer 2026</SectionLabel>
            <h1 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 700,
              lineHeight: 1.15,
              color: TEXT_PRIMARY,
              margin: "0 0 20px",
            }}>
              Strava's flywheel is hardcoded to GPS.
              <br />
              <span style={{ color: TEXT_MUTED }}>Its fastest-growing users are proving it.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: TEXT_SECONDARY,
              margin: "0 0 16px",
              maxWidth: "600px",
            }}>
              Strava's engagement flywheel — record, share, get feedback, return — runs on rich activity posts. But every engagement hook is architecturally coupled to GPS data: maps, segments, pace charts, elevation profiles, splits, matched runs.
            </p>
            <p style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: TEXT_SECONDARY,
              margin: "0 0 40px",
              maxWidth: "600px",
            }}>
              As 54% of users now track multiple activities and non-GPS sports grow fastest, a rising share of activities produce social objects too thin to sustain the content loop. Weight training — the fastest-growing sport type, led by Gen Z — is the proof case.
            </p>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}>
              {[
                { val: "54%", label: "of users track multiple sports" },
                { val: "2×", label: "Gen Z vs Gen X say lifting is primary sport" },
                { val: "+25%", label: "women's weight training uploads YoY" },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: BG_CARD,
                  border: `1px solid ${BORDER_SUBTLE}`,
                  borderRadius: "8px",
                  padding: "14px 18px",
                  flex: "1 1 180px",
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "24px", fontWeight: 700, color: STRAVA_ORANGE }}>
                    {stat.val}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: TEXT_MUTED, marginTop: "2px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: TEXT_MUTED, marginBottom: "0" }}>
              Source: Strava Year in Sport 2025 Trend Report
            </div>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div style={{
              marginTop: "40px",
              padding: "24px",
              background: "rgba(252, 76, 2, 0.04)",
              border: `1px solid rgba(252, 76, 2, 0.15)`,
              borderRadius: "10px",
              borderLeft: `3px solid ${STRAVA_ORANGE}`,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: STRAVA_ORANGE, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>
                My Hypothesis
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", color: TEXT_PRIMARY, lineHeight: 1.6, marginBottom: "12px" }}>
                This is a rendering problem, not a user intent problem. Weight trainers aren't disengaged because they don't want social feedback — they're disengaged because their activity post gives followers nothing to engage with.
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                If we transform the same data into a rich social object — volume, muscle split, exercise breakdown, overload signals — engagement metrics on strength posts will approach parity with GPS activity posts. That would prove the flywheel architecture generalizes beyond GPS.
              </div>
            </div>
          </FadeIn>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <Divider />
        </div>

        {/* ─── Section 1: The Evidence ────────────────────────── */}
        <div style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "0 24px",
        }}>
          <FadeIn>
            <SectionLabel>01 — The Evidence</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 700,
              lineHeight: 1.2,
              margin: "0 0 12px",
            }}>
              Same athlete. Same day. Two different products.
            </h2>
            <p style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: TEXT_SECONDARY,
              margin: "0 0 40px",
              maxWidth: "560px",
            }}>
              A single running activity generates ~15 engagement hooks — rich visual content that drives kudos, comments, and return visits. A weight training activity generates ~5, mostly inert. The content loop can't grip.
            </p>
          </FadeIn>

          {/* Side by side hook count */}
          <FadeIn delay={0.1}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "40px",
            }}>
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "16px",
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "48px", fontWeight: 700, color: TEXT_PRIMARY }}>15</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: TEXT_MUTED }}>engagement hooks</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "12px" }}>
                  🏃 Running Activity
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {runningHooks.map((h, i) => <HookPill key={i} {...h} />)}
                </div>
              </div>

              <div>
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "16px",
                }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "48px", fontWeight: 700, color: "#AAAAAA" }}>5</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: TEXT_MUTED }}>engagement hooks</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "12px" }}>
                  🏋️ Weight Training Activity
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {weightHooks.map((h, i) => <HookPill key={i} {...h} dim />)}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* E = F × I */}
          <FadeIn delay={0.15}>
            <div style={{
              background: BG_CARD,
              border: `1px solid ${BORDER_SUBTLE}`,
              borderRadius: "12px",
              padding: "28px",
              marginBottom: "40px",
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: STRAVA_ORANGE, letterSpacing: "1.5px", marginBottom: "16px" }}>
                WHY THIS MATTERS — ENGAGEMENT EQUATION
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "28px",
                fontWeight: 700,
                color: TEXT_PRIMARY,
                marginBottom: "16px",
                textAlign: "center",
              }}>
                E = F × I
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "6px" }}>
                    For runners, Strava drives both
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                    <strong style={{ color: TEXT_PRIMARY }}>Frequency:</strong> Social feedback pulls you back to post again.{" "}
                    <strong style={{ color: TEXT_PRIMARY }}>Intensity:</strong> Rich data means time spent analyzing, exploring segments, comparing splits.
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "6px" }}>
                    For lifters, Strava drives neither
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                    <strong style={{ color: TEXT_PRIMARY }}>Frequency:</strong> Gym habit drives return, not Strava.{" "}
                    <strong style={{ color: TEXT_PRIMARY }}>Intensity:</strong> Nothing to analyze, explore, or compare. In and out.
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* API Schema Evidence */}
          <FadeIn delay={0.2}>
            <div style={{
              background: BG_CARD,
              border: `1px solid ${BORDER_SUBTLE}`,
              borderRadius: "12px",
              padding: "28px",
              marginBottom: "0",
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: STRAVA_ORANGE, letterSpacing: "1.5px", marginBottom: "8px" }}>
                THE ROOT CAUSE — API SCHEMA
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: TEXT_SECONDARY, lineHeight: 1.6, margin: "0 0 20px" }}>
                Strava's <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "3px" }}>createActivity</code> endpoint accepts 9 fields. None model exercises, sets, reps, or weight. Partners like Hevy can only stuff structured data into the free-text <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "3px" }}>description</code> field.
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: TEXT_MUTED, fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Field</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: TEXT_MUTED, fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Type</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: TEXT_MUTED, fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiFields.map((f, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
                        <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: f.name === "description" ? STRAVA_ORANGE : TEXT_PRIMARY }}>
                          {f.name}
                        </td>
                        <td style={{ padding: "8px 12px", color: TEXT_MUTED }}>{f.type}</td>
                        <td style={{ padding: "8px 12px", color: f.name === "description" ? STRAVA_ORANGE : TEXT_SECONDARY }}>{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "20px" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: TEXT_MUTED, marginBottom: "8px" }}>
                  11 available stream types — all GPS/endurance:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {streamTypes.map((s, i) => (
                    <span key={i} style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.07)",
                      color: "#BBBBBB",
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: TEXT_MUTED, marginBottom: "8px" }}>
                  0 models for strength data. These don't exist:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {missingModels.map((s, i) => (
                    <span key={i} style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: "rgba(252, 76, 2, 0.08)",
                      color: STRAVA_ORANGE,
                      border: `1px dashed rgba(252,76,2,0.2)`,
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <Divider />
        </div>

        {/* ─── Section 2: The Prototype ───────────────────────── */}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <FadeIn>
            <SectionLabel>02 — The Prototype</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 700,
              lineHeight: 1.2,
              margin: "0 0 12px",
            }}>
              Same data. Different rendering.
            </h2>
            <p style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: TEXT_SECONDARY,
              margin: "0 0 32px",
              maxWidth: "560px",
            }}>
              Using real workout data from a Hevy → Strava sync. Left: what Strava shows today. Right: what's possible with the same data, rendered as a social object.
            </p>
          </FadeIn>

          {/* Toggle */}
          <FadeIn delay={0.15}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "0" }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: STRAVA_ORANGE, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>
                  Current
                </div>
                <CurrentCard />
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#22C55E", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>
                  Redesigned
                </div>
                <RedesignedCard />
              </div>
            </div>
          </FadeIn>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <Divider />
        </div>

        {/* ─── Section 3: How I'd Ship This ───────────────────── */}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <FadeIn>
            <SectionLabel>03 — How I'd Ship This</SectionLabel>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 700,
              lineHeight: 1.2,
              margin: "0 0 32px",
            }}>
              12-week execution plan
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TimelineItem
              weeks="WEEKS 1–3"
              title="Instrument + Define"
              description="Audit structured data flowing from Hevy, Apple Health, and Garmin for weight training activities. Map parseable fields from description text. Define the minimum viable rich activity card. Interview 15–20 multi-sport users to validate the rendering gap affects engagement."
            />
            <TimelineItem
              weeks="WEEKS 4–8"
              title="Build + A/B Test"
              description="Build the rich rendering layer for weight training activities. A/B test against current text display. Primary metrics: kudos per activity, comments per activity, feed engagement rate on strength posts, return visits within 48 hours of posting."
            />
            <TimelineItem
              weeks="WEEKS 9–11"
              title="Measure Downstream Impact"
              description="Does richer rendering increase subscription trial starts for strength-primary users? Does it shift engagement bucket distribution (casual → core)? Measure whether the flywheel architecture generalizes beyond GPS."
            />
            <TimelineItem
              weeks="WEEK 12"
              title="Ship or Iterate"
              description="Ship to production or iterate based on data. Document findings on non-GPS activity rendering. Recommend next sport types (yoga, hiking, indoor cycling) to apply the same treatment."
              isLast
            />
          </FadeIn>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <Divider />
        </div>

        {/* ─── Risks ──────────────────────────────────────────── */}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
          <FadeIn>
            <SectionLabel>Risks I'd Validate</SectionLabel>
            <div style={{
              display: "grid",
              gap: "16px",
              marginBottom: "0",
            }}>
              {[
                {
                  title: "Partnership tension",
                  desc: "Building richer strength rendering could be seen as competing with Hevy/Strong/Fitbod. The framing matters: this makes partner data MORE visible, not less. 'Logged with Hevy' gets far more visibility on an engaging post than on a text wall.",
                },
                {
                  title: "API investment",
                  desc: "The full vision (lift PRs, progressive overload, volume trends) requires structured API fields — not just parsed text. The 12-week scope tests whether rendering improvements alone move metrics enough to justify the deeper infrastructure investment.",
                },
                {
                  title: "Strategic prioritization",
                  desc: "Strava may intentionally focus on GPS sports. This project tests whether the flywheel architecture generalizes — if non-GPS rendering moves engagement, it builds the case for expanding Strava's identity. If it doesn't, that's also a clear signal.",
                },
              ].map((risk, i) => (
                <div key={i} style={{
                  background: BG_CARD,
                  border: `1px solid ${BORDER_SUBTLE}`,
                  borderRadius: "10px",
                  padding: "20px",
                }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "6px" }}>
                    {risk.title}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                    {risk.desc}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* ─── Footer ─────────────────────────────────────────── */}
        <div style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "80px 24px 60px",
          textAlign: "center",
        }}>
          <FadeIn>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              color: TEXT_MUTED,
              lineHeight: 1.7,
            }}>
              Built by{" "}
              <a href="https://sidharthsundaram.com" target="_blank" rel="noopener" style={{ color: STRAVA_ORANGE, textDecoration: "none" }}>
                Sidharth Sundaram
              </a>
              {" "}·{" "}
              <a href="https://linkedin.com/in/sidharthsundaram" target="_blank" rel="noopener" style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>
                LinkedIn
              </a>
              {" "}·{" "}
              <a href="mailto:sundar84@purdue.edu" style={{ color: TEXT_SECONDARY, textDecoration: "none" }}>
                sundar84@purdue.edu
              </a>
              <br />
              MS Engineering Management, Purdue University · Summer 2026
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
}
