import React from "react";
import InterviewSim from "./components/InterviewSim";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>🎤 InterviewAI Simulator</h1>
      <p>Start your mock interview by entering a message below:</p>
      <InterviewSim />
    </div>
  );
}

export default App;
