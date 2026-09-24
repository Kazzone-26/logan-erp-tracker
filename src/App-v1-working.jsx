import { useState } from "react";
import "./App.css";

export default function App() {
  const [extraWashes, setExtraWashes] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [selectedExposure, setSelectedExposure] = useState(null);

  const exposures = [
    "👧 Callie",
    "🚗 Car",
    "🏪 Public Places",
    "🎮 Safe Item",
    "🗑 Bins / Laundry",
  ];

  function completeExposure() {
    if (!completed.includes(selectedExposure)) {
      setCompleted([...completed, selectedExposure]);
    }
    setSelectedExposure(null);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>OCD Challenge Tracker</h1>

      <div
        style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2>Today's Progress</h2>

        <p>
          Exposures Complete: <strong>{completed.length}</strong>
        </p>

        <p>
          Extra Washes: <strong>{extraWashes} / 5</strong>
        </p>

        <button
          onClick={() => setExtraWashes(extraWashes + 1)}
          style={{
            padding: "12px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          🧼 Log Extra Wash
        </button>
      </div>

      {!selectedExposure && (
        <>
          <h2>Exposure Tasks</h2>

          {exposures.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedExposure(item)}
              style={{
                display: "block",
                width: "100%",
                marginBottom: "10px",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                fontSize: "18px",
                background: completed.includes(item)
                  ? "#dcfce7"
                  : "#ffffff",
              }}
            >
              {completed.includes(item) ? "✅ " : ""}
              {item}
            </button>
          ))}
        </>
      )}

      {selectedExposure && (
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h2>{selectedExposure}</h2>

          <p>Did you complete this exposure?</p>

          <button
            onClick={completeExposure}
            style={{
              padding: "12px",
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "8px",
              marginRight: "10px",
            }}
          >
            ✅ Yes
          </button>

          <button
            onClick={() => setSelectedExposure(null)}
            style={{
              padding: "12px",
              background: "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}