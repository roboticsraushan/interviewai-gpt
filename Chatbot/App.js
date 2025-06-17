import React, { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://34.44.243.178:5000/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setResult({ error: "Something went wrong. Please try again." });
    }

    setLoading(false);
  };

  const getColor = (score) => {
    if (score >= 70) return "#ff4d4f"; // High
    if (score >= 40) return "#faad14"; // Medium
    return "#52c41a"; // Low
  };

  const getRisk = (score) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Moderate Risk";
    return "Low Risk";
  };

  return (
    <div className="App" style={{ padding: "40px", fontFamily: "Arial, sans-serif", background: "#f8fbff", minHeight: "100vh" }}>
      <h1 style={{ color: "#2c3e50" }}>🧒 Infant Health Screening Assistant</h1>
      <p style={{ color: "#555", marginBottom: "30px" }}>
        Enter your infant's symptoms below to check for common serious health conditions using IMNCI/WHO/IAP screening standards.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "700px", margin: "auto", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Describe symptoms, e.g., 'My baby has fast breathing and yellow eyes'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Screening..." : "Screen"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "40px",
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            maxWidth: "700px",
            width: "100%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            marginInline: "auto",
          }}
        >
          <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>
            Screening Result
          </h2>

          {result.error ? (
            <div style={{ color: "red" }}>{result.error}</div>
          ) : result.screenable === false ? (
            <div
              style={{
                backgroundColor: "#fff4e5",
                padding: "15px",
                borderRadius: "8px",
                color: "#b36b00",
                fontWeight: "500",
              }}
            >
              ⚠️ <strong>Note:</strong> {result.response}
            </div>
          ) : (
            <>
              {Object.entries(result)
                .filter(
                  ([key]) =>
                    key !== "screenable" &&
                    key !== "response" &&
                    key !== "other_issue_detected"
                )
                .sort(([, a], [, b]) => b - a)
                .map(([condition, score], index) => (
                  <div key={index} style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <strong style={{ textTransform: "capitalize" }}>
                        {condition.replace("_", " ")}
                      </strong>
                      <span
                        style={{
                          backgroundColor: getColor(score),
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        {getRisk(score)}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#e0e0e0",
                        borderRadius: "8px",
                        overflow: "hidden",
                        height: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: `${score}%`,
                          height: "100%",
                          backgroundColor: getColor(score),
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}

              {/* Raw text response */}
              {result.response && (
                <div
                  style={{
                    marginTop: "30px",
                    padding: "15px",
                    backgroundColor: "#f0f8ff",
                    borderLeft: "4px solid #007bff",
                    borderRadius: "8px",
                    fontStyle: "italic",
                    color: "#333",
                  }}
                >
                  <strong>Explanation:</strong> {result.response}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
import React, { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://34.44.243.178:5000/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setResult({ error: "Something went wrong. Please try again." });
    }

    setLoading(false);
  };

  const getColor = (score) => {
    if (score >= 70) return "#ff4d4f"; // High
    if (score >= 40) return "#faad14"; // Medium
    return "#52c41a"; // Low
  };

  const getRisk = (score) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Moderate Risk";
    return "Low Risk";
  };

  return (
    <div className="App" style={{ padding: "40px", fontFamily: "Arial, sans-serif", background: "#f8fbff", minHeight: "100vh" }}>
      <h1 style={{ color: "#2c3e50" }}>🧒 Infant Health Screening Assistant</h1>
      <p style={{ color: "#555", marginBottom: "30px" }}>
        Enter your infant's symptoms below to check for common serious health conditions using IMNCI/WHO/IAP screening standards.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "700px", margin: "auto", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Describe symptoms, e.g., 'My baby has fast breathing and yellow eyes'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Screening..." : "Screen"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "40px",
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            maxWidth: "700px",
            width: "100%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            marginInline: "auto",
          }}
        >
          <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>
            Screening Result
          </h2>

          {result.error ? (
            <div style={{ color: "red" }}>{result.error}</div>
          ) : result.screenable === false ? (
            <div
              style={{
                backgroundColor: "#fff4e5",
                padding: "15px",
                borderRadius: "8px",
                color: "#b36b00",
                fontWeight: "500",
              }}
            >
              ⚠️ <strong>Note:</strong> {result.response}
            </div>
          ) : (
            <>
              {Object.entries(result)
                .filter(
                  ([key]) =>
                    key !== "screenable" &&
                    key !== "response" &&
                    key !== "other_issue_detected"
                )
                .sort(([, a], [, b]) => b - a)
                .map(([condition, score], index) => (
                  <div key={index} style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <strong style={{ textTransform: "capitalize" }}>
                        {condition.replace("_", " ")}
                      </strong>
                      <span
                        style={{
                          backgroundColor: getColor(score),
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        {getRisk(score)}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#e0e0e0",
                        borderRadius: "8px",
                        overflow: "hidden",
                        height: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: `${score}%`,
                          height: "100%",
                          backgroundColor: getColor(score),
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}

              {/* Raw text response */}
              {result.response && (
                <div
                  style={{
                    marginTop: "30px",
                    padding: "15px",
                    backgroundColor: "#f0f8ff",
                    borderLeft: "4px solid #007bff",
                    borderRadius: "8px",
                    fontStyle: "italic",
                    color: "#333",
                  }}
                >
                  <strong>Explanation:</strong> {result.response}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
