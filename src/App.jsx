import { useState, useEffect } from "react";
import "./App.css";

const DAILY_GOAL = 2;
const DAILY_QUOTES = [
  "You’ve got this!",
  "Let’s go!",
  "Let’s do this!",
  "One step at a time.",
  "You can do hard things.",
  "Keep going!",
  "Proud of you for showing up.",
  "Small steps count.",
  "You are doing this.",
  "We believe in you.",
];

function getStartOfWeek(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function formatWeekLabel(date = new Date()) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

const EXPOSURES = [
  "👱 Callie",
  "🚗 Car",
  "🏪 Public Places",
  "🎮 Safe Item",
  "🗑 Bins / Laundry",
];
const REQUIRED_EXPOSURES = EXPOSURES.filter((exposure) => exposure !== "🏪 Public Places");

const APP_THEME = {
  purple: "#6d28d9",
  purpleDark: "#4c1d95",
  purpleSoft: "#f3e8ff",
  yellow: "#facc15",
  yellowDark: "#ca8a04",
  yellowSoft: "#fef3c7",
  green: "#22c55e",
  text: "#1f2937",
  panel: "#ffffff",
  muted: "#475569",
};

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDailyGoalDatesFromHistory(history) {
  const byDate = {};

  history.forEach((item) => {
    if (item.type === "wash") return;

    const dateKey = getLocalDateKey(new Date(item.date));
    if (!byDate[dateKey]) {
      byDate[dateKey] = {};
    }

    const exposureName = item.exposure;
    byDate[dateKey][exposureName] = (byDate[dateKey][exposureName] || 0) + 1;
  });

  return new Set(
    Object.entries(byDate)
      .filter(([, counts]) => {
        return REQUIRED_EXPOSURES.every((exposure) => (counts[exposure] || 0) >= DAILY_GOAL);
      })
      .map(([dateKey]) => dateKey),
  );
}

function getStreakFromGoalDates(goalDates) {
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);

  while (true) {
    const dateKey = getLocalDateKey(cursor);
    if (!goalDates.has(dateKey)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getDailyQuote(date = new Date()) {
  const dateKey = getLocalDateKey(date);
  const total = [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DAILY_QUOTES[total % DAILY_QUOTES.length];
}

function getWashTrend(history, todayCount) {
  const countsByDate = {};

  history.forEach((item) => {
    if (item.type !== "wash") return;
    const dateKey = getLocalDateKey(new Date(item.date));
    countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
  });

  const getPeriodTotal = (startOffset) => {
    let total = 0;

    for (let dayOffset = startOffset; dayOffset < startOffset + 7; dayOffset += 1) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const dateKey = getLocalDateKey(date);
      total += dayOffset === 0 ? todayCount : countsByDate[dateKey] || 0;
    }

    return total;
  };

  const recentTotal = getPeriodTotal(0);
  const previousTotal = getPeriodTotal(7);

  return {
    recentTotal,
    previousTotal,
    recentAverage: recentTotal / 7,
    previousAverage: previousTotal / 7,
  };
}

export default function App() {
  const [tab, setTab] = useState("home");
  const today = new Date().toDateString();
  const todayKey = getLocalDateKey();

  const savedDate = localStorage.getItem("washDate");

  let initialWashes = Number(localStorage.getItem("extraWashes")) || 0;

  if (savedDate !== today) {
    initialWashes = 0;
    localStorage.setItem("extraWashes", "0");
    localStorage.setItem("washDate", today);
  }

  const [extraWashes, setExtraWashes] = useState(initialWashes);
  const [pendingWashContext, setPendingWashContext] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("history")) || [];
    } catch {
      return [];
    }
  });

  const [selectedExposure, setSelectedExposure] = useState(null);
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(5);
  const [delay, setDelay] = useState("30 mins");
  const [customExposure, setCustomExposure] = useState("");
  const [quickAddMode, setQuickAddMode] = useState(false);

  const todaysExposureEntries = history.filter((item) => {
    if (item.type === "wash") return false;
    return getLocalDateKey(new Date(item.date)) === todayKey;
  });

  const todayCounts = EXPOSURES.reduce((counts, exposure) => {
    counts[exposure] = todaysExposureEntries.filter((item) => item.exposure === exposure).length;
    return counts;
  }, {});

  const minimumGoalMet = REQUIRED_EXPOSURES.filter(
    (exposure) => todayCounts[exposure] >= DAILY_GOAL,
  ).length;
  const dailyGoalComplete = minimumGoalMet === REQUIRED_EXPOSURES.length;
  const dailyMinimumTotal = REQUIRED_EXPOSURES.length * DAILY_GOAL;
  const completedMinimumTotal = REQUIRED_EXPOSURES.reduce(
    (sum, exposure) => sum + Math.min(todayCounts[exposure], DAILY_GOAL),
    0,
  );
  const customBonusCount = todaysExposureEntries.filter(
    (item) => !EXPOSURES.includes(item.exposure),
  ).length;
  const totalExtra =
    REQUIRED_EXPOSURES.reduce(
      (sum, exposure) => sum + Math.max(todayCounts[exposure] - DAILY_GOAL, 0),
      0,
    ) +
    todayCounts["🏪 Public Places"] +
    customBonusCount;
  const dashboardActions = [
    { label: "👱 Callie", type: "exposure", exposure: "👱 Callie" },
    { label: "🚗 Car", type: "exposure", exposure: "🚗 Car" },
    { label: "🏪 Public Places", type: "exposure", exposure: "🏪 Public Places" },
    { label: "🎮 Safe Item", type: "exposure", exposure: "🎮 Safe Item" },
    { label: "🗑 Bins / Laundry", type: "exposure", exposure: "🗑 Bins / Laundry" },
    { label: "🧼 OCD Washes", type: "wash", exposure: "hand wash" },
  ];
  const dailyGoalDates = getDailyGoalDatesFromHistory(history);
  const streak = getStreakFromGoalDates(dailyGoalDates);
  const dailyQuote = getDailyQuote();
  const washTrend = getWashTrend(history, extraWashes);

  const weeklySummary = EXPOSURES.map((exposure) => {
    const weekStart = getStartOfWeek();
    const exposureCount = history.filter((item) => {
      if (item.type === "wash" || item.exposure !== exposure) return false;
      const itemDate = new Date(item.date);
      return itemDate >= weekStart;
    }).length;

    return { exposure, exposureCount };
  });

  const weeklyTotal = weeklySummary.reduce((sum, entry) => sum + entry.exposureCount, 0);

  useEffect(() => {
    localStorage.setItem("extraWashes", String(extraWashes));
    localStorage.setItem("washDate", new Date().toDateString());
  }, [extraWashes]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const saveQuickExposure = (exposure) => {
    const record = {
      exposure,
      before: 0,
      after: 0,
      delay: "quick add",
      date: new Date().toISOString(),
      type: "exposure",
    };

    setHistory((current) => [record, ...current]);
  };

  const logExtraWash = () => {
    const washRecord = {
      type: "wash",
      title: "🧼 OCD-driven extra hand wash",
      date: new Date().toISOString(),
    };

    setExtraWashes((current) => current + 1);
    setHistory((current) => [washRecord, ...current]);
    setPendingWashContext(washRecord);
  };

  const undoLastWash = () => {
    if (extraWashes === 0) return;

    setPendingWashContext(null);
    setExtraWashes((current) => current - 1);
    setHistory((current) => {
      const todayWashIndex = current.findIndex(
        (item) =>
          item.type === "wash" &&
          getLocalDateKey(new Date(item.date)) === todayKey,
      );

      return todayWashIndex === -1
        ? current
        : current.filter((_, index) => index !== todayWashIndex);
    });
  };

  const saveWashContext = (context) => {
    if (!pendingWashContext) return;

    setHistory((current) =>
      current.map((item) =>
        item === pendingWashContext ? { ...item, context } : item,
      ),
    );
    setPendingWashContext(null);
  };

  const removeExposureEntry = (entry) => {
    if (entry.type === "wash") return;

    const confirmed = window.confirm(
      `Remove the ${entry.exposure} exposure from history? This will also update its daily count.`,
    );

    if (!confirmed) return;
    setHistory((current) => current.filter((item) => item !== entry));
  };

  const saveExposure = () => {
    const exposureName =
      selectedExposure === "Additional Exposure" ? customExposure.trim() : selectedExposure;

    if (!exposureName) {
      return;
    }

    const record = {
      exposure: exposureName,
      before,
      after,
      delay,
      date: new Date().toISOString(),
      type: "exposure",
    };

    setHistory((current) => [record, ...current]);
    setSelectedExposure(null);
    setBefore(5);
    setAfter(5);
    setDelay("30 mins");
    setCustomExposure("");
  };

  return (
    <div
      style={{
        padding: "10px",
        maxWidth: "600px",
        margin: "auto",
        paddingBottom: "80px",
      }}
    >
      <h1 style={{ textAlign: "center", color: APP_THEME.purpleDark, letterSpacing: "0.04em", fontSize: "20px", margin: "4px 0 8px" }}>
        ⭐ OCD Challenge Tracker ⭐
      </h1>

      {tab === "home" && (
        <div
          style={{
            background: "white",
            padding: "12px",
            borderRadius: "12px",
            marginBottom: "8px",
          }}
        >
          {dailyGoalComplete && (
            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7, #facc15)",
                border: `2px solid ${APP_THEME.yellowDark}`,
                borderRadius: "14px",
                padding: "8px 10px",
                marginBottom: "8px",
                boxShadow: "0 8px 18px rgba(250, 204, 21, 0.2)",
              }}
            >
              <strong style={{ fontSize: "16px", display: "block", marginBottom: "4px", color: APP_THEME.purpleDark }}>
                ✨✨ Daily goal complete! Great job! ✨✨
              </strong>
              <div style={{ color: APP_THEME.purpleDark, fontSize: "12px", fontWeight: "700" }}>
                You did your minimum today and extra work counts too.
              </div>
            </div>
          )}

          <div
            style={{
              background: "linear-gradient(135deg, #f3e8ff, #fef3c7)",
              border: `2px solid ${APP_THEME.purple}`,
              borderRadius: "14px",
              padding: "8px 10px",
              marginBottom: "8px",
            }}
          >
            <strong style={{ fontSize: "16px", display: "block", marginBottom: "4px", color: APP_THEME.purpleDark }}>
              ⭐ {dailyQuote} ⭐
            </strong>
            <div style={{ color: APP_THEME.purpleDark, fontSize: "12px", fontWeight: "700" }}>
              Daily minimum: {DAILY_GOAL} each of 4 types. Public Places is a bonus.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              background: "linear-gradient(135deg, #f3e8ff, #fef3c7)",
              border: `2px solid ${APP_THEME.purple}`,
              borderRadius: "14px",
              padding: "6px 10px",
              marginBottom: "8px",
            }}
          >
            <div>
              <div style={{ fontSize: "10px", color: APP_THEME.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ⭐ Current streak
              </div>
              <strong style={{ fontSize: "22px", color: APP_THEME.purpleDark }}>{streak} day{streak === 1 ? "" : "s"}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: APP_THEME.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Types at minimum
              </div>
              <strong style={{ fontSize: "18px", color: APP_THEME.purpleDark }}>
                {minimumGoalMet}/{REQUIRED_EXPOSURES.length}
              </strong>
            </div>
          </div>

          <h2 style={{ margin: "0 0 6px", fontSize: "18px" }}>Today’s Progress</h2>

          <div
            style={{
              marginBottom: "8px",
              padding: "8px 10px",
              background: "linear-gradient(135deg, #f3e8ff, #fef3c7)",
              borderRadius: "12px",
              border: `1px solid ${APP_THEME.purple}`,
            }}
          >
            <strong style={{ color: APP_THEME.purpleDark }}>
              {completedMinimumTotal}/{dailyMinimumTotal} minimum exposures complete
            </strong>
            <div style={{ marginTop: "4px", color: APP_THEME.purpleDark, fontSize: "13px", fontWeight: "700" }}>
              Types at minimum: {minimumGoalMet}/{REQUIRED_EXPOSURES.length} · Bonus exposures: {totalExtra}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            {dashboardActions.map((item) => {
              const isWash = item.type === "wash";
              const count = isWash ? extraWashes : todayCounts[item.exposure] || 0;
              const isRequiredExposure = REQUIRED_EXPOSURES.includes(item.exposure);
              const isComplete = !isWash && isRequiredExposure && count >= DAILY_GOAL;
              const isOverWashLimit = isWash && count > 5;
              const extra = isWash
                ? 0
                : isRequiredExposure
                  ? Math.max(count - DAILY_GOAL, 0)
                  : count;
              const progress = Math.min((count / DAILY_GOAL) * 100, 100);

              return (
                <button
                  className={`dashboard-action${isComplete ? " dashboard-action-complete" : ""}${isOverWashLimit ? " dashboard-action-over-limit" : ""}`}
                  key={item.label}
                  aria-label={isOverWashLimit
                    ? `OCD washes: ${count} today, over 5. Tap to log another wash.`
                    : undefined}
                  onClick={() => {
                    if (isWash) {
                      logExtraWash();
                      return;
                    }

                    setSelectedExposure(item.exposure);
                    setTab("exposures");
                  }}
                >
                  <div
                    className="dashboard-action-heading"
                  >
                    <strong>{item.label}</strong>
                    <span className="dashboard-action-count">
                      {isWash
                        ? `${count} today`
                        : isRequiredExposure
                          ? `${count}/${DAILY_GOAL}`
                          : `${count} bonus`}
                    </span>
                  </div>

                    {!isWash && isRequiredExposure && (
                      <div className="dashboard-action-progress">
                        <div
                          className="dashboard-action-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                  <div className="dashboard-action-footer">
                    <span className="dashboard-action-cta">
                      <span className="dashboard-action-plus" aria-hidden="true">+</span>
                        {isWash ? "Log OCD wash" : "Log details"}
                    </span>
                    {isOverWashLimit && <span className="dashboard-action-alert">Over 5 today</span>}
                    {isRequiredExposure && extra > 0 && (
                      <span className="dashboard-action-extra">+{extra} bonus</span>
                    )}
                    {isComplete && extra === 0 && <span className="dashboard-action-extra">Goal met!</span>}
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      )}

      {tab === "exposures" && (
        <>
          {!selectedExposure && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h2 style={{ margin: 0, color: APP_THEME.purpleDark }}>⭐ Exposure Tasks</h2>
                <button
                  onClick={() => setQuickAddMode((current) => !current)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: `1px solid ${APP_THEME.purple}`,
                    background: quickAddMode ? APP_THEME.yellow : APP_THEME.purpleSoft,
                    cursor: "pointer",
                    color: APP_THEME.purpleDark,
                    fontWeight: "700",
                  }}
                >
                  {quickAddMode ? "Full form" : "Quick add"}
                </button>
              </div>

              {EXPOSURES.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (quickAddMode) {
                      saveQuickExposure(item);
                      return;
                    }
                    setSelectedExposure(item);
                  }}
                  style={{
                    width: "100%",
                    padding: "18px",
                    marginBottom: "12px",
                    borderRadius: "14px",
                    border: `2px solid ${APP_THEME.purple}`,
                    background: "linear-gradient(135deg, #ffffff, #f3e8ff)",
                    fontSize: "18px",
                    color: APP_THEME.purpleDark,
                    fontWeight: "800",
                    textAlign: "left",
                    cursor: "pointer",
                    minHeight: "58px",
                  }}
                >
                  {item}
                </button>
              ))}
              <button
                onClick={() => setSelectedExposure("Additional Exposure")}
                style={{
                  width: "100%",
                  padding: "18px",
                  marginBottom: "12px",
                  borderRadius: "14px",
                  border: `2px solid ${APP_THEME.yellowDark}`,
                  background: "linear-gradient(135deg, #fef3c7, #facc15)",
                  fontSize: "18px",
                  color: APP_THEME.purpleDark,
                  fontWeight: "800",
                  minHeight: "58px",
                }}
              >
                ➕ Additional Exposure
              </button>
            </>
          )}

          {selectedExposure && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
              }}
            >
              <h2>{selectedExposure}</h2>

              {selectedExposure === "Additional Exposure" && (
                <>
                  <p>Exposure Name</p>

                  <input
                    type="text"
                    value={customExposure}
                    onChange={(e) => setCustomExposure(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginBottom: "20px",
                    }}
                  />
                </>
              )}

              <p>Anxiety Before</p>

              <input
                type="range"
                min="0"
                max="10"
                value={before}
                onChange={(e) => setBefore(Number(e.target.value))}
              />

              <p>{before}</p>

              <p>Anxiety After</p>

              <input
                type="range"
                min="0"
                max="10"
                value={after}
                onChange={(e) => setAfter(Number(e.target.value))}
              />

              <p>{after}</p>

              <p>How long before washing?</p>

              <select value={delay} onChange={(e) => setDelay(e.target.value)}>
                <option>15 mins</option>
                <option>30 mins</option>
                <option>1 hour</option>
                <option>2 hours</option>
                <option>All day</option>
              </select>

              <br />
              <br />

              <button
                onClick={saveExposure}
                style={{
                  padding: "12px",
                  background: "#22c55e",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  marginRight: "10px",
                }}
              >
                Save Exposure
              </button>

              <button onClick={() => setSelectedExposure(null)}>Cancel</button>
            </div>
          )}
        </>
      )}

      {tab === "weekly" && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h2 style={{ color: APP_THEME.purpleDark }}>⭐ Weekly Summary</h2>
          <p style={{ marginTop: "-8px", color: APP_THEME.muted }}>{formatWeekLabel()}</p>

          <div
            style={{
              background: "linear-gradient(135deg, #f3e8ff, #fef3c7)",
              borderRadius: "14px",
              padding: "14px 16px",
              marginBottom: "18px",
              border: `2px solid ${APP_THEME.purple}`,
            }}
          >
            <strong style={{ fontSize: "24px", color: APP_THEME.purpleDark }}>{weeklyTotal}</strong>
            <div style={{ color: APP_THEME.purpleDark, fontWeight: "700" }}>total exposures this week</div>
          </div>

          {weeklySummary.map(({ exposure, exposureCount }) => (
            <div
              key={exposure}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #e5e7eb",
                color: APP_THEME.purpleDark,
                fontWeight: "700",
              }}
            >
              <span>⭐ {exposure}</span>
              <strong style={{ color: APP_THEME.yellowDark }}>{exposureCount}</strong>
            </div>
          ))}
        </div>
      )}

      {tab === "washes" && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h2>OCD-Driven Extra Washes</h2>
          <p style={{ color: APP_THEME.muted, lineHeight: 1.5 }}>
            Count only washes prompted by OCD. Routine hand washing after toilet trips or around food is not included.
          </p>

          <div
            style={{
              fontSize: "36px",
              color: APP_THEME.purpleDark,
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            {extraWashes} today
          </div>

          <p style={{ color: APP_THEME.purpleDark, fontWeight: "700" }}>
            Aim for fewer than 5 today, with the number decreasing over time.
          </p>

          <div
            style={{
              margin: "18px 0",
              padding: "14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f3e8ff, #fef3c7)",
              border: `1px solid ${APP_THEME.purple}`,
              color: APP_THEME.purpleDark,
            }}
          >
            <strong>Last 7 days: {washTrend.recentTotal} ({washTrend.recentAverage.toFixed(1)} per day)</strong>
            <div style={{ marginTop: "6px" }}>
              Previous 7 days: {washTrend.previousTotal} ({washTrend.previousAverage.toFixed(1)} per day)
            </div>
            <div style={{ marginTop: "8px", fontWeight: "700" }}>
              {washTrend.recentAverage < washTrend.previousAverage
                ? `Down by ${(washTrend.previousAverage - washTrend.recentAverage).toFixed(1)} per day.`
                : washTrend.recentAverage > washTrend.previousAverage
                  ? `Up by ${(washTrend.recentAverage - washTrend.previousAverage).toFixed(1)} per day.`
                  : "About the same as the previous 7 days."}
            </div>
          </div>

          <button
            onClick={logExtraWash}
            style={{
              width: "100%",
              padding: "16px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "10px",
            }}
          >
            🧼 Log OCD-Driven Wash
          </button>

          <br />
          <br />

          <button
            onClick={undoLastWash}
            style={{
              width: "100%",
              padding: "16px",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "10px",
            }}
          >
            ↩ Undo Last Wash
          </button>
        </div>
      )}

      {tab === "history" && (
        <div>
          <h2 style={{ textAlign: "center" }}>History</h2>

          {history.length === 0 && <p>No entries recorded yet.</p>}

          {Object.entries(
            history.reduce((groups, item) => {
              const date = new Date(item.date).toLocaleDateString();

              if (!groups[date]) {
                groups[date] = [];
              }

              groups[date].push(item);
              return groups;
            }, {}),
          ).map(([date, entries]) => (
            <div key={date} style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  background: "#e5e7eb",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                {date}
              </h3>

              {entries.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "10px",
                    marginBottom: "10px",
                  }}
                >
                  {item.type === "wash" ? (
                    <>
                      <strong>{item.title}</strong>
                      {item.context && <p>Felt: {item.context}</p>}
                    </>
                  ) : (
                    <>
                      <strong>{item.exposure}</strong>
                      <p>Before: {item.before}</p>
                      <p>After: {item.after}</p>
                      <p>Delay: {item.delay}</p>
                    </>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <small>{new Date(item.date).toLocaleTimeString()}</small>
                    {item.type !== "wash" && (
                      <button
                        onClick={() => removeExposureEntry(item)}
                        aria-label={`Remove ${item.exposure} exposure`}
                        style={{
                          border: "1px solid #b91c1c",
                          borderRadius: "8px",
                          padding: "6px 9px",
                          background: "#fff",
                          color: "#991b1b",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {pendingWashContext && (
        <div className="wash-context-prompt" role="region" aria-label="Optional wash context">
          <div className="wash-context-heading">
            <strong>Wash logged.</strong>
            <button
              type="button"
              onClick={() => setPendingWashContext(null)}
              aria-label="Skip wash context"
              className="wash-context-dismiss"
            >
              Skip
            </button>
          </div>
          <div className="wash-context-question">Optional: what did it feel like?</div>
          <div className="wash-context-options">
            {["Not sure", "Sweaty", "Sticky", "Dirty"].map((context) => (
              <button
                type="button"
                key={context}
                onClick={() => saveWashContext(context)}
                className="wash-context-option"
              >
                {context}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(180deg, #ffffff, #f3e8ff)",
          borderTop: `2px solid ${APP_THEME.purple}`,
          display: "flex",
        }}
      >
        <button style={{ flex: 1, padding: "15px", background: "transparent", border: "none", color: APP_THEME.purpleDark, fontWeight: "700" }} onClick={() => setTab("home")}>
          🏠 Home
        </button>

        <button style={{ flex: 1, padding: "15px", background: "transparent", border: "none", color: APP_THEME.purpleDark, fontWeight: "700" }} onClick={() => setTab("exposures")}>
          ✅ Tasks
        </button>

        <button style={{ flex: 1, padding: "15px", background: "transparent", border: "none", color: APP_THEME.purpleDark, fontWeight: "700" }} onClick={() => setTab("weekly")}>
          📅 Week
        </button>

        <button style={{ flex: 1, padding: "15px", background: "transparent", border: "none", color: APP_THEME.purpleDark, fontWeight: "700" }} onClick={() => setTab("washes")}>
          🧼 Washes
        </button>

        <button style={{ flex: 1, padding: "15px", background: "transparent", border: "none", color: APP_THEME.purpleDark, fontWeight: "700" }} onClick={() => setTab("history")}>
          📈 History
        </button>
      </div>
    </div>
  );
}