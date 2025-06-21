import React from "react";
import InterviewSim from "./components/InterviewSim";
import logo from './assets/logo.png'; // Make sure this path is correct for your logo file

function App() {
  return (
    <div style={{
      padding: "2rem",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "black", // Set background color to black
      color: "white",         // Set font color to white for visibility
      display: "flex",        // Enable flexbox
      flexDirection: "column",// Arrange children vertically
      alignItems: "center",   // Center children horizontally
      justifyContent: "center", // Center children vertically (if height allows)
      textAlign: "center",    // Center text content within elements
      minHeight: "100vh"      // Ensure the div takes at least full viewport height
    }}>
      {/* Add the logo image here */}
      <img
        src={logo}
        alt="InterviewAI Logo"
        style={{
          width: '80px', // Adjust width as needed
          height: 'auto', // Maintain aspect ratio
          marginBottom: '1rem' // Space between logo and title
        }}
      />
      <h1> InterviewAI</h1>
      <p>World's Most Personalized Interview Coach </p>
      <InterviewSim />
    </div>
  );
}

export default App;