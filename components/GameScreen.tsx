import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WordCard, TurnStatus, RoundResult } from '../types';

interface GameScreenProps {
  words: WordCard[];
  onFinish: (results: RoundResult[]) => void;
  gameDuration?: number;
}

export const GameScreen: React.FC<GameScreenProps> = ({ words, onFinish, gameDuration = 60 }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [turnStatus, setTurnStatus] = useState<TurnStatus>(TurnStatus.NEUTRAL);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [sensorActive, setSensorActive] = useState(false);
  
  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);

  // Orientation Logic Refs
  const isTransitioningRef = useRef(false);

  const playSound = useCallback((type: 'correct' | 'pass' | 'tick') => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'pass') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else {
         osc.type = 'square';
         osc.frequency.value = 800;
         gain.gain.setValueAtTime(0.05, now);
         gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
         osc.start(now);
         osc.stop(now + 0.05);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish(results);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      if (timeLeft <= 5) playSound('tick');
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onFinish, results, playSound]);

  const handleNextCard = useCallback((status: TurnStatus) => {
    if (isTransitioningRef.current) return;
    
    isTransitioningRef.current = true;
    setTurnStatus(status);
    
    if (status === TurnStatus.CORRECT) playSound('correct');
    else if (status === TurnStatus.PASS) playSound('pass');

    // Record result
    setResults(prev => [...prev, { word: words[currentWordIndex].word, status }]);

    // Wait briefly to show feedback color, then switch
    setTimeout(() => {
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setTurnStatus(TurnStatus.NEUTRAL);
        isTransitioningRef.current = false;
        // Tilt lock is implicitly handled by gravity check in the event listener
      } else {
        onFinish([...results, { word: words[currentWordIndex].word, status }]);
      }
    }, 800);
  }, [currentWordIndex, words, onFinish, results, playSound]);

  // Keyboard Controls for Web/Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isTransitioningRef.current) return;
        
        if (e.key === 'ArrowDown') {
            handleNextCard(TurnStatus.CORRECT);
        } else if (e.key === 'ArrowUp') {
            handleNextCard(TurnStatus.PASS);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextCard]);


  // Device Motion Handler (Gravity based - Robust for Android)
  useEffect(() => {
    let sensorTimeout: ReturnType<typeof setTimeout>;

    const handleMotion = (event: DeviceMotionEvent) => {
        setSensorActive(true);
        if (isTransitioningRef.current) return;
        
        const accel = event.accelerationIncludingGravity;
        if (!accel) return;

        // Logic:
        // Z-axis detects if screen is facing up (sky) or down (floor).
        // Neutral (Vertical on forehead): Z is near 0.
        // Screen Facing Ceiling (Pass): Z > Threshold
        // Screen Facing Floor (Correct): Z < -Threshold
        
        const z = accel.z || 0;
        
        // Lowered threshold for better sensitivity (approx 20 degrees tilt)
        const THRESHOLD = 3.0;

        if (z > THRESHOLD) {
            // Screen facing UP -> PASS
             handleNextCard(TurnStatus.PASS);
        } else if (z < -THRESHOLD) {
            // Screen facing DOWN -> CORRECT
             handleNextCard(TurnStatus.CORRECT);
        }
    };

    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleMotion);
        // Check if sensor is working after 3 seconds
        sensorTimeout = setTimeout(() => {
            if (!sensorActive) {
                console.warn("No device motion detected.");
            }
        }, 3000);
    }
    
    return () => {
        if (window.DeviceMotionEvent) {
            window.removeEventListener('devicemotion', handleMotion);
        }
        clearTimeout(sensorTimeout);
    }
  }, [handleNextCard]);

  // Background color based on status
  let bgColor = "bg-blue-600";
  let statusText = "";
  
  if (turnStatus === TurnStatus.CORRECT) {
    bgColor = "bg-green-500";
    statusText = "¡ESO!";
  } else if (turnStatus === TurnStatus.PASS) {
    bgColor = "bg-orange-500";
    statusText = "PASO...";
  }

  const currentWord = words[currentWordIndex];
  if (!currentWord) return null; // Safety check

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center transition-colors duration-300 ${bgColor}`}>
      
      {/* Timer Top Center */}
      <div className="absolute top-4 font-bold text-4xl opacity-80 border-4 border-white rounded-full w-20 h-20 flex items-center justify-center bg-black/20 z-10">
        {timeLeft}
      </div>

      {/* Sensor Warning if not active */}
      {!sensorActive && timeLeft < (gameDuration - 3) && (
          <div className="absolute top-24 bg-red-500/80 text-white px-4 py-2 rounded-full text-sm animate-pulse z-20">
              ⚠️ Sensores no detectados. Usa los botones.
          </div>
      )}

      {/* Main Card Content */}
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center relative z-0">
          
          {turnStatus === TurnStatus.NEUTRAL ? (
             <div className="animate-bounce-in w-full max-w-4xl">
                 <h1 className="text-[12vh] md:text-[18vh] leading-none font-black uppercase drop-shadow-md break-words mx-4 perspective-text text-yellow-300">
                    {currentWord.word}
                 </h1>
                 <div className="mt-8 text-xl md:text-2xl opacity-80 font-semibold animate-pulse space-y-2">
                    <p className="hidden md:block">↓ Flecha Abajo: Correcto | ↑ Flecha Arriba: Pasar</p>
                    <p className="md:hidden">Inclina abajo si adivinan &middot; Inclina arriba para pasar</p>
                 </div>
             </div>
          ) : (
             <div className="animate-ping-once">
                <h1 className="text-[10vh] md:text-[12vh] font-black uppercase text-white drop-shadow-lg">
                    {statusText}
                </h1>
             </div>
          )}
      </div>

      {/* Manual Controls (Always visible on Web/Desktop, subtle on mobile) */}
      <div className="absolute bottom-0 w-full flex h-32 opacity-10 md:opacity-100 z-30">
        <button 
            className="flex-1 bg-red-500/50 hover:bg-red-500 flex items-center justify-center text-4xl"
            onClick={() => handleNextCard(TurnStatus.PASS)}
        >
            ❌
        </button>
        <button 
            className="flex-1 bg-green-500/50 hover:bg-green-500 flex items-center justify-center text-4xl"
            onClick={() => handleNextCard(TurnStatus.CORRECT)}
        >
            ✅
        </button>
      </div>
    </div>
  );
};
