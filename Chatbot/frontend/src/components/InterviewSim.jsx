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
    startRecording,
    stopRecording
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
    />
  );
}

export default InterviewSim;
