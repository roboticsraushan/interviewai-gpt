import React, { useState } from "react";

const API_BASE = "http://35.188.170.210:5000"; // Replace with your VM IP

function InterviewSim() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSend = async () => {
    try {
      const res = await fetch(`${API_BASE}/onboarding/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setResponse(data.echo || "No response from server");
    } catch (error) {
      setResponse("Error connecting to backend.");
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <input
        type="text"
        value={input}
        placeholder="Type your intro here"
        onChange={(e) => setInput(e.target.value)}
        style={{ padding: "0.5rem", width: "300px" }}
      />
      <button
        onClick={handleSend}
        style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}
      >
        Send
      </button>
      <div style={{ marginTop: "1rem" }}>
        <strong>Response:</strong> {response}
      </div>
    </div>
  );
}

export default InterviewSim;
