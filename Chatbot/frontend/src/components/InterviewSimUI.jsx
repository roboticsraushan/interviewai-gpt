import React from "react";

function InterviewSimUI({
  transcript,
  finalTranscript,
  response,
  isRecording,
  isSpeaking,
  aiWaveRef,
  userWaveRef,
  startRecording,
  stopRecording,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold mb-4">🎙️ InterviewAI (Voice Mode)</h2>

      <div className="relative w-48 h-48 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-xl mb-6">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/ed/Elon_Musk_Royal_Society.jpg"
          alt="AI Agent"
          className="rounded-full w-40 h-40 object-cover border-4 border-white"
        />
      </div>

      {isSpeaking ? (
        <div ref={aiWaveRef} className="w-full max-w-xl mb-4" />
      ) : isRecording ? (
        <div ref={userWaveRef} className="w-full max-w-xl mb-4" />
      ) : null}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full text-lg shadow-lg transition"
      >
        {isRecording ? "🛑 Stop Recording" : "🎤 Start Speaking"}
      </button>

      <div className="mt-6 w-full max-w-2xl text-center">
        <h3 className="font-semibold">🗣️ Live Transcript:</h3>
        <p className="text-gray-300 mt-2 whitespace-pre-wrap">{transcript || "(waiting...)"}</p>

        <h3 className="font-semibold mt-4">✅ Final Transcript:</h3>
        <p className="text-white mt-2 whitespace-pre-wrap">{finalTranscript || "(waiting...)"}</p>

        <h3 className="font-semibold mt-4">🤖 AI Response:</h3>
        <p className="text-blue-400 mt-2 whitespace-pre-wrap">{response || "(waiting...)"}</p>
      </div>
    </div>
  );
}

export default InterviewSimUI;
