import React, { useState, useRef, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/ui/card';
import { Input } from './components/ui/input';
import { ConversationDisplay } from './components/ConversationDisplay';
import { Mic, MicOff, Play, Square, Loader2 } from 'lucide-react';
import axios from 'axios';

// Types
interface ConversationPart {
  text: string;
}

interface ConversationMessage {
  role: 'user' | 'model';
  parts: ConversationPart[];
}

interface InterviewResponse {
  newHistory: ConversationMessage[];
  responseAudio: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  // State
  const [jobRole, setJobRole] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start interview
  const startInterview = useCallback(async () => {
    if (!jobRole.trim()) {
      setError('Please enter a job role');
      return;
    }

    setIsInterviewStarted(true);
    setError(null);
    
    // Start with an empty conversation to trigger the AI's first message
    try {
      setIsLoading(true);
      
      const response = await axios.post<InterviewResponse>(`${API_BASE_URL}/api/interview`, {
        audio: '', // Empty audio for first message
        conversationHistory: [],
        jobRole: jobRole.trim()
      });

      setConversationHistory(response.data.newHistory);
      
      // Play the AI's first message
      if (response.data.responseAudio) {
        playAudio(response.data.responseAudio);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [jobRole]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Process recorded audio
  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Send to backend
      const response = await axios.post<InterviewResponse>(`${API_BASE_URL}/api/interview`, {
        audio: base64Audio,
        conversationHistory,
        jobRole: jobRole.trim()
      });
      
      // Update conversation history
      setConversationHistory(response.data.newHistory);
      
      // Play AI response
      if (response.data.responseAudio) {
        playAudio(response.data.responseAudio);
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process your answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory, jobRole]);

  // Play audio response
  const playAudio = useCallback((base64Audio: string) => {
    try {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  }, []);

  // Reset interview
  const resetInterview = useCallback(() => {
    setIsInterviewStarted(false);
    setConversationHistory([]);
    setError(null);
    setIsLoading(false);
    setIsRecording(false);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 Career Co-pilot
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Mock Interview Simulator
          </p>
        </div>

        {/* Main Interview Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Setup & Controls */}
          <div className="space-y-6">
            {/* Job Role Input */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Target Job Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="e.g., Junior DevOps Engineer, Frontend Developer..."
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  disabled={isInterviewStarted}
                  className="text-lg"
                />
                {!isInterviewStarted ? (
                  <Button 
                    onClick={startInterview}
                    disabled={!jobRole.trim() || isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting Interview...
                      </>
                    ) : (
                      '🚀 Start Interview'
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={resetInterview}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    🔄 Reset Interview
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recording Controls */}
            {isInterviewStarted && (
              <Card>
                <CardHeader>
                  <CardTitle>🎤 Voice Recording</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to record your answer, then click again to stop
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                      {!isRecording ? (
                        <Button
                          onClick={startRecording}
                          disabled={isLoading}
                          size="lg"
                          className="h-16 w-16 rounded-full"
                        >
                          <Mic className="h-6 w-6" />
                        </Button>
                      ) : (
                        <Button
                          onClick={stopRecording}
                          variant="destructive"
                          size="lg"
                          className="h-16 w-16 rounded-full"
                        >
                          <Square className="h-6 w-6" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      {isRecording ? 'Recording... Click to stop' : 'Click to record'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status & Error Display */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="text-center text-destructive">
                    <p className="font-medium">⚠️ Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Processing your response...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Conversation Display */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>💬 Interview Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <ConversationDisplay conversationHistory={conversationHistory} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        {!isInterviewStarted && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">How it works:</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Enter your target job role above</li>
                  <li>2. Click "Start Interview" to begin</li>
                  <li>3. Listen to the AI interviewer's question</li>
                  <li>4. Click the microphone button and speak your answer</li>
                  <li>5. Click again to stop recording and get feedback</li>
                  <li>6. Continue the conversation until you're satisfied</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden audio element for playing responses */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
