import React from "react";
import { useInterviewSession } from "../hooks/useInterviewSession";
import InterviewChat from "./InterviewChat";

function InterviewSim() {
  const {
    transcript,
    finalTranscript,
    response,
    isRecording,
    isConnected,
    isAISpeaking,
    messages,
    profilingState,
    profileData,
    isProfilingComplete,
    interviewContext,
    startRecording,
    stopRecording,
    resetProfiling
  } = useInterviewSession();

  return (
    <InterviewChat
      messages={messages}
      isRecording={isRecording}
      isConnected={isConnected}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      currentTranscript={transcript}
      isAISpeaking={isAISpeaking}
      isProfilingComplete={isProfilingComplete}
      profilingState={profilingState}
    />
  );
}

export default InterviewSim;
