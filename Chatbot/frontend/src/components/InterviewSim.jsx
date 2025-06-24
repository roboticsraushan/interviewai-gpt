import React from "react";
import { useInterviewSession } from "../hooks/useInterviewSession";
import InterviewChat from "./InterviewChat";
import VoiceSelector from "./VoiceSelector";

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
    selectedVoice,
    startRecording,
    stopRecording,
    resetProfiling,
    setSelectedVoice,
    // Voice Activity Detection props
    isAutoModeEnabled,
    vadSettings,
    vadIsListening,
    vadIsSpeaking,
    audioLevel,
    vadInitialized,
    toggleAutoMode,
    updateVadSettings
  } = useInterviewSession();

  return (
    <div className="relative h-screen">
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
        // Voice Activity Detection props
        isAutoModeEnabled={isAutoModeEnabled}
        vadSettings={vadSettings}
        vadIsListening={vadIsListening}
        vadIsSpeaking={vadIsSpeaking}
        audioLevel={audioLevel}
        vadInitialized={vadInitialized}
        onToggleAutoMode={toggleAutoMode}
        onUpdateVadSettings={updateVadSettings}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
      />
      
      {/* Voice Selector - Positioned in top-right corner */}
      <div className="absolute top-4 right-4 z-40">
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
        />
      </div>
    </div>
  );
}

export default InterviewSim;
