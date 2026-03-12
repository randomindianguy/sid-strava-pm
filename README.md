# Strava's Flywheel Has a GPS Dependency

**An interactive work sample for Strava's PM Internship (Summer 2026)**

[Live artifact →](https://sid-strava-pm.vercel.app)

---

## The Finding

Strava's engagement flywheel — record, share, get feedback, return — runs on rich activity posts. But every engagement hook (maps, segments, pace charts, elevation profiles, splits, matched runs) is architecturally coupled to GPS data.

As 54% of users now track multiple sports and non-GPS activity types grow fastest, a rising share of activities produce social objects too thin to sustain the content loop. Weight training — the fastest-growing sport type, led by Gen Z — is the proof case.

A single running activity generates ~15 engagement hooks. A weight training activity generates ~5, mostly inert.

## The Root Cause

Strava's public API (`createActivity`) accepts 9 fields. None model exercises, sets, reps, or weight. All 11 stream types are GPS/endurance-specific. Integration partners like Hevy can only stuff structured workout data into the free-text `description` field.

The API was built for GPS. The data model doesn't acknowledge that non-GPS activities exist as structured data.

## The Hypothesis

This is a rendering problem, not a user intent problem. If we transform the same data into a rich social object — volume, muscle split, exercise breakdown, overload signals — engagement metrics on strength posts will approach parity with GPS activity posts. That would prove the flywheel architecture generalizes beyond GPS.

## What's in the Artifact

1. **The Evidence** — Side-by-side engagement hook audit (running vs. weight training), the E = F × I engagement equation applied to both, and the API schema proof
2. **The Prototype** — Current vs. redesigned weight training activity card, using real workout data from a Hevy → Strava sync
3. **12-Week Execution Plan** — How I'd ship this as an intern: instrument, build, A/B test, measure, ship
4. **Risks** — Partnership dynamics, API investment requirements, strategic prioritization

## Data Sources

- Strava Year in Sport 2025 Trend Report
- Strava Public API Documentation (developers.strava.com)
- Real workout data from my own Hevy → Strava integration
- Strava Community Hub developer discussions

---

## Built By

**Sidharth Sundaram**
MS Engineering Management, Purdue University (May 2027)

[sidharthsundaram.com](https://sidharthsundaram.com) · [LinkedIn](https://linkedin.com/in/sidharthsundaram) · sundar84@purdue.edu
