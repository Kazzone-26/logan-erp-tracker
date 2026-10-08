import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("home");

  const today = new Date().toDateString();
const completedDate =
  localStorage.getItem("completedDate");

let initialCompleted =
  JSON.parse(
    localStorage.getItem("completedTasks")
  ) || [];

if (completedDate !== today) {
  initialCompleted = [];

  localStorage.setItem(
    "completedTasks",
    JSON.stringify([])
  );

  localStorage.setItem(
    "completedDate",
    today
  );
}
const savedDate =
  localStorage.getItem("washDate");

let initialWashes =
  Number(localStorage.getItem("extraWashes")) || 0;

if (savedDate !== today) {
  initialWashes = 0;
  localStorage.setItem("extraWashes", "0");
  localStorage.setItem("washDate", today);
}

const [extraWashes, setExtraWashes] =
  useState(initialWashes);

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history")) || []
  );

  const [selectedExposure, setSelectedExposure] = useState(null);
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(5);
  const [delay, setDelay] = useState("30 mins");
const [completedTasks, setCompletedTasks] =
  useState(initialCompleted);

  const exposures = [
    "👱 Callie",
    "🚗 Car",
    "🏪 Public Places",
  "🎮 Safe Item",
   "🗑 Bins / Laundry",
  ];

  useEffect(() => {
  localStorage.setItem(
    "extraWashes",
    extraWashes
  );

  localStorage.setItem(
    "washDate",
    new Date().toDateString()
  );
}, [extraWashes]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const saveExposure = () => {
  const record = {
  exposure: selectedExposure,
  before,
  after,
  delay,
  date: new Date().toISOString(),
};

  setHistory([record, ...history]);

  const updatedCompleted =
  completedTasks.includes(selectedExposure)
    ? completedTasks
    : [...completedTasks, selectedExposure];

  setCompletedTasks(updatedCompleted);

  localStorage.setItem(
    "completedTasks",
    JSON.stringify(updatedCompleted)
  );

  localStorage.setItem(
    "completedDate",
    today
  );

  setSelectedExposure(null);

  setBefore(5);
  setAfter(5);
  setDelay("30 mins");
};

  const completedToday = history.filter(
  (x) =>
    new Date(x.date).toDateString() ===
    new Date().toDateString()
).length;

const callieCount = history.filter(
  (x) => x.exposure === "👱 Callie"
).length;

const carCount = history.filter(
  (x) => x.exposure === "🚗 Car"
).length;

const safeItemCount = history.filter(
  (x) => x.exposure === "🎮 Safe Item"
).length;

const binsCount = history.filter(
  (x) => x.exposure === "🗑 Bins / Laundry"
).length;

const publicCount = history.filter(
  (x) => x.exposure === "🏪 Public Places"
).length;

  const washColour =
    extraWashes <= 3
      ? "#22c55e"
      : extraWashes <= 5
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div
      style={{
        padding: "15px",
        maxWidth: "600px",
        margin: "auto",
        paddingBottom: "80px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        OCD Challenge Tracker
      </h1>

      {tab === "home" && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h2>Today's Progress</h2>

          <p>
  Today's Exposures
</p>
<div
  style={{
    marginTop: "20px",
    padding: "15px",
    background: "#f3f4f6",
    borderRadius: "10px",
  }}
>
  <p>👱 Callie: {callieCount}/2</p>
  <p>🚗 Car: {carCount}/2</p>
  <p>🎮 Safe Item: {safeItemCount}/2</p>
  <p>🗑 Bins/Laundry: {binsCount}/2</p>
  <p>🏪 Public Places: {publicCount}</p>
</div>
<p
  style={{
    fontSize: "24px",
    fontWeight: "bold",
  }}
>
  {completedTasks.length} of {exposures.length}
</p>

          <p>Extra Hand Washes:</p>

          <div
            style={{
              fontSize: "30px",
              color: washColour,
              fontWeight: "bold",
            }}
          >
            {extraWashes} / 5
          </div>

          {extraWashes > 5 && (
            <div
              style={{
                color: "#ef4444",
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              +{extraWashes - 5} over target
            </div>
          )}
        </div>
      )}

      {tab === "exposures" && (
        <>
          {!selectedExposure && (
            <>
              <h2 style={{ textAlign: "center" }}>
                Exposure Tasks
              </h2>

              {exposures.map((item) => (
                <button
  key={item}
  disabled={completedTasks.includes(item)}
  onClick={() =>
    setSelectedExposure(item)
  }
                  style={{
  width: "100%",
  padding: "18px",
  marginBottom: "12px",
  borderRadius: "12px",
  border: completedTasks.includes(item)
    ? "2px solid #22c55e"
    : "1px solid #ddd",
  background: completedTasks.includes(item)
    ? "#dcfce7"
    : "white",
  fontSize: "18px",
  color: "#000000",
  fontWeight: "600",
  textAlign: "left",
  cursor: completedTasks.includes(item)
    ? "default"
    : "pointer",
}}
                >
  {completedTasks.includes(item)
    ? `✅ ${item}`
    : item}
</button>
              ))}
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

              <p>Anxiety Before</p>

              <input
                type="range"
                min="0"
                max="10"
                value={before}
                onChange={(e) =>
                  setBefore(Number(e.target.value))
                }
              />

              <p>{before}</p>

              <p>Anxiety After</p>

              <input
                type="range"
                min="0"
                max="10"
                value={after}
                onChange={(e) =>
                  setAfter(Number(e.target.value))
                }
              />

              <p>{after}</p>

              <p>How long before washing?</p>

              <select
                value={delay}
                onChange={(e) =>
                  setDelay(e.target.value)
                }
              >
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

              <button
                onClick={() =>
                  setSelectedExposure(null)
                }
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {tab === "washes" && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h2>Extra Hand Washes</h2>

          <div
            style={{
              fontSize: "36px",
              color: washColour,
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            {extraWashes} / 5
          </div>

          {extraWashes > 5 && (
            <div
              style={{
                color: "#ef4444",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              +{extraWashes - 5} over today's target
            </div>
          )}

          <button
  onClick={() => {
    setExtraWashes(extraWashes + 1);

    const washRecord = {
      type: "wash",
      title: "🧼 Extra Hand Wash",
      date: new Date().toISOString(),
    };

    setHistory([washRecord, ...history]);
  }}
  style={{
    width: "100%",
    padding: "16px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "10px",
  }}
>
  🧼 Log Extra Hand Wash
</button>


          <br />
          <br />

          <button
  onClick={() => {
    if (extraWashes > 0) {
      setExtraWashes(extraWashes - 1);
    }
  }}
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
    <h2 style={{ textAlign: "center" }}>
      History
    </h2>

    {history.length === 0 && (
      <p>No entries recorded yet.</p>
    )}

    {Object.entries(
      history.reduce((groups, item) => {
        const date = new Date(
          item.date
        ).toLocaleDateString();

        if (!groups[date]) {
          groups[date] = [];
        }

        groups[date].push(item);

        return groups;
      }, {})
    ).map(([date, entries]) => (
      <div
        key={date}
        style={{
          marginBottom: "20px",
        }}
      >
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
  </>
) : (
  <>
    <strong>{item.exposure}</strong>

    <p>Before: {item.before}</p>

    <p>After: {item.after}</p>

    <p>Delay: {item.delay}</p>
  </>
)}

            <small>
              {new Date(
                item.date
              ).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>
    ))}
  </div>
)}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #ddd",
          display: "flex",
        }}
      >
        <button
          style={{ flex: 1, padding: "15px" }}
          onClick={() => setTab("home")}
        >
          🏠 Home
        </button>

        <button
          style={{ flex: 1, padding: "15px" }}
          onClick={() => setTab("exposures")}
        >
          ✅ Tasks
        </button>

        <button
          style={{ flex: 1, padding: "15px" }}
          onClick={() => setTab("washes")}
        >
          🧼 Washes
        </button>

        <button
          style={{ flex: 1, padding: "15px" }}
          onClick={() => setTab("history")}
        >
          📈 History
        </button>
      </div>
    </div>
  );
}