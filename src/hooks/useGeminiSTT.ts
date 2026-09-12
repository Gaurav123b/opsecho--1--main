import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useGeminiSTT (now powered by Web Speech API)
 *
 * Uses the browser's built-in SpeechRecognition API for reliable real-time STT.
 * This replaced the Gemini Live approach which was unreliable in production.
 *
 * When a final transcript is produced, it POSTs to /api/incidents/:id/chat
 * with source:'voice' so the server AI knows it came from voice.
 *
 * The hook accepts the same interface as before so no other files need changes.
 */
export const useGeminiSTT = (
  incidentId: string | undefined,
  isEnabled: boolean,
  agoraTrack: MediaStreamTrack | null,   // kept for interface compatibility
  socket: any,
  onFinalTranscriptPosted?: () => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [mediaStream] = useState<MediaStream | null>(null);  // not used with Web Speech API

  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Post a finalized transcript to the backend for AI analysis
  const postTranscript = useCallback(async (text: string) => {
    if (!incidentId || !text.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/incidents/${incidentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: text.trim(), source: 'voice' }),
      });
      if (!response.ok) {
        console.error('[STT] POST failed:', response.status, await response.text());
      } else {
        console.log('[STT] Voice transcript sent for AI analysis:', text.trim());
        if (onFinalTranscriptPosted) {
          onFinalTranscriptPosted();
        }
      }
    } catch (err) {
      console.error('[STT] Failed to POST transcript:', err);
    }
  }, [incidentId, onFinalTranscriptPosted]);

  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    setIsListening(false);
    setTranscript('');

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;  // prevent auto-restart
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (isActiveRef.current || !incidentId) return;

    // Check if the Web Speech API is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[STT] Web Speech API not supported in this browser.');
      return;
    }

    isActiveRef.current = true;
    setIsListening(true);

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;        // keep listening, don't stop after one phrase
    recognition.interimResults = true;    // show partial results in the UI
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      // Show interim results in the live subtitle overlay
      if (interimText) {
        setTranscript(interimText);
        // Broadcast partial to other room participants
        if (socket) {
          socket.emit('TRANSCRIPT_PARTIAL', { incidentId, text: interimText });
        }
      }

      // When a final phrase is ready, POST it for AI analysis
      if (finalText.trim()) {
        setTranscript('');  // clear overlay
        postTranscript(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is normal when user pauses — just let it auto-restart
      if (event.error === 'no-speech') return;
      console.error('[STT] SpeechRecognition error:', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening
      // (SpeechRecognition stops after long silence or network hiccup)
      if (isActiveRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (isActiveRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (_) {}
          }
        }, 300);
      }
    };

    try {
      recognition.start();
      console.log('[STT] Web Speech API started');
    } catch (err) {
      console.error('[STT] Failed to start recognition:', err);
      isActiveRef.current = false;
      setIsListening(false);
    }
  }, [incidentId, socket, postTranscript]);

  useEffect(() => {
    if (isEnabled && !isActiveRef.current) {
      startListening();
    } else if (!isEnabled && isActiveRef.current) {
      stopListening();
    }

    return () => {
      // Only stop on unmount, not on every re-render
    };
  }, [isEnabled, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { isListening, transcript, mediaStream };
};
