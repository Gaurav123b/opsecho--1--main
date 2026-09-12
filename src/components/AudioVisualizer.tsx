import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive || !stream) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = audioContextRef.current;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; // 64 bins
    analyserRef.current = analyser;

    try {
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
    } catch (e) {
      console.error('[AudioVisualizer] Failed to connect stream:', e);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvasCtx = canvas.getContext('2d')!;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const volume = avg / 255.0; // 0.0 to 1.0

      const W = canvas.width;
      const H = canvas.height;
      const centerX = W / 2;
      const centerY = H / 2;
      const radius = Math.min(W, H) / 2 - 4; // Padding for the outer rim

      canvasCtx.clearRect(0, 0, W, H);
      
      // 1. Draw the outer silver/grey rim
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      canvasCtx.fillStyle = '#e5e7eb';
      canvasCtx.fill();

      // 2. Clip to the inner circle and draw dark gradient background
      canvasCtx.save();
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      canvasCtx.clip();
      
      // The deep purple/navy background
      const bgGrad = canvasCtx.createRadialGradient(centerX, centerY - radius * 0.5, 0, centerX, centerY, radius);
      bgGrad.addColorStop(0, '#3b1c54'); 
      bgGrad.addColorStop(1, '#0b112c'); 
      canvasCtx.fillStyle = bgGrad;
      canvasCtx.fillRect(0, 0, W, H);

      // 3. Draw the ribbons using screen blend mode for the glowing overlap effect
      canvasCtx.globalCompositeOperation = 'screen';
      
      const time = Date.now() / 1000;
      
      // Classic Siri Ribbon Colors
      const flares = [
        { color: 'rgba(45, 212, 191, 0.8)', speed: 1.5, freq: Math.PI * 1.5, amp: 30, thick: 20 }, // Cyan
        { color: 'rgba(236, 72, 153, 0.8)', speed: -1.2, freq: Math.PI * 2.0, amp: 40, thick: 25 }, // Pink
        { color: 'rgba(59, 130, 246, 0.8)', speed: 1.8, freq: Math.PI * 1.2, amp: 35, thick: 30 }, // Blue
        { color: 'rgba(16, 185, 129, 0.6)', speed: -1.6, freq: Math.PI * 2.5, amp: 20, thick: 15 }, // Green
        { color: 'rgba(255, 255, 255, 0.7)', speed: 2.0, freq: Math.PI * 1.0, amp: 15, thick: 10 }  // Core White
      ];

      flares.forEach((flare, i) => {
        // Map to frequency bin
        const safeBin = (i * 4) % bufferLength;
        const val = dataArray[safeBin] / 255.0; 
        
        // Scale amplitude and thickness dynamically by audio reactivity
        const activeAmp = flare.amp + (val * 45) + (volume * 35);
        const activeThick = flare.thick + (val * 15) + (volume * 20);
        
        canvasCtx.beginPath();
        
        const segments = 60; // Smoothness of the curve
        
        // Upper edge of the ribbon
        for(let j=0; j<=segments; j++) {
          const normX = j / segments;
          const x = normX * W;
          
          // Taper ends to zero width/amplitude at the edges
          const env = Math.sin(Math.PI * normX); 
          
          // Phase shift based on time and index
          const phase = time * flare.speed + i;
          const yOff = Math.sin(normX * flare.freq + phase) * activeAmp * env;
          
          // Twist gives it 3D depth by varying thickness
          const twist = Math.sin(normX * Math.PI * 3 - time * flare.speed * 1.5);
          const currentThick = activeThick * env * (0.3 + 0.7 * Math.abs(twist));
          
          canvasCtx.lineTo(x, centerY + yOff - currentThick);
        }
        
        // Lower edge of the ribbon (drawn right to left)
        for(let j=segments; j>=0; j--) {
          const normX = j / segments;
          const x = normX * W;
          const env = Math.sin(Math.PI * normX);
          
          const phase = time * flare.speed + i;
          const yOff = Math.sin(normX * flare.freq + phase) * activeAmp * env;
          const twist = Math.sin(normX * Math.PI * 3 - time * flare.speed * 1.5);
          const currentThick = activeThick * env * (0.3 + 0.7 * Math.abs(twist));
          
          canvasCtx.lineTo(x, centerY + yOff + currentThick);
        }
        
        canvasCtx.closePath();
        
        // Soften the flares slightly
        canvasCtx.shadowColor = flare.color;
        canvasCtx.shadowBlur = 10;
        
        canvasCtx.fillStyle = flare.color;
        canvasCtx.fill();
        
        canvasCtx.shadowBlur = 0; // reset
      });
      
      canvasCtx.restore(); // Restore from clipping mask
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    };
  }, [stream, isActive]);

  if (!isActive || !stream) return null;

  return (
    <div className="flex items-center justify-center pointer-events-none drop-shadow-2xl">
      <canvas
        ref={canvasRef}
        width={260}
        height={260}
        style={{ display: 'block', width: '130px', height: '130px' }}
      />
    </div>
  );
};

export default AudioVisualizer;
