import React, { useState, useEffect } from 'react';
import { fetchChilangoWords } from './services/geminiService';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { GameState, WordCard, RoundResult } from './types';

// Extend Window interface for iOS permission and Screen Lock
declare global {
  interface Window {
    DeviceOrientationEvent: any;
    DeviceMotionEvent: any;
  }
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [words, setWords] = useState<WordCard[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [loadingText, setLoadingText] = useState("Cargando");
  const [isPortrait, setIsPortrait] = useState(false);

  // Monitor orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    // Check initially
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Loading animation effect
  useEffect(() => {
    if (gameState === GameState.LOADING) {
      const interval = setInterval(() => {
        setLoadingText(prev => prev.length > 10 ? "Cargando" : prev + ".");
      }, 300);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  const requestPermissionsAndStart = async () => {
    // 1. Fullscreen (Android mainly)
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
    } catch (e) {
        console.warn("Fullscreen request failed", e);
    }

    // 2. iOS Permissions
    if (
      typeof window.DeviceMotionEvent !== 'undefined' &&
      typeof window.DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const permissionState = await window.DeviceMotionEvent.requestPermission();
        if (permissionState === 'granted') {
           startGameSequence();
        } else {
          alert('Se requiere acceso al movimiento para jugar moviendo el celular.');
          startGameSequence();
        }
      } catch (error) {
        console.error(error);
        startGameSequence();
      }
    } else {
      // Android / Desktop
      startGameSequence();
    }
  };

  const startGameSequence = async () => {
    setGameState(GameState.LOADING);
    
    // 3. Wake Lock (Keep screen on)
    if ('wakeLock' in navigator) {
        try {
            // @ts-ignore
            await navigator.wakeLock.request('screen');
        } catch (err) {
            console.warn("Wake Lock failed", err);
        }
    }

    // 4. Orientation Lock (Force Landscape)
    // @ts-ignore
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        try {
            // @ts-ignore
            await window.screen.orientation.lock('landscape');
        } catch (err) {
             console.warn("Orientation lock failed (may need standalone PWA mode)", err);
        }
    }

    const fetchedWords = await fetchChilangoWords();
    setWords(fetchedWords);
    setGameState(GameState.INSTRUCTIONS);
  };

  const handleStartPlaying = () => {
    setGameState(GameState.PLAYING);
  };

  const handleFinishGame = (roundResults: RoundResult[]) => {
    setResults(roundResults);
    // Exit fullscreen if desired, or keep it.
    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(e => console.warn(e));
    }
    setGameState(GameState.FINISHED);
  };

  // Orientation Warning Overlay
  const showRotationWarning = isPortrait && (gameState === GameState.PLAYING || gameState === GameState.INSTRUCTIONS);

  return (
    <div className="min-h-screen font-sans">
      
      {/* ROTATION WARNING OVERLAY */}
      {showRotationWarning && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white p-8 text-center animate-pulse">
            <div className="text-6xl mb-4">🔄</div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">¡Gira tu celular!</h2>
            <p className="text-xl">Este juego funciona mejor con el teléfono en horizontal.</p>
        </div>
      )}

      {/* MENU SCREEN */}
      {gameState === GameState.MENU && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 via-pink-600 to-red-500 p-6 text-center">
            <div className="mb-10 animate-bounce">
                <h1 className="text-6xl font-black text-yellow-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] transform -rotate-6">
                    CHILANGO
                </h1>
                <h1 className="text-6xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] transform rotate-2">
                    GUESS
                </h1>
            </div>

            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl border border-white/30 max-w-sm mb-10 shadow-xl">
                <p className="text-white text-lg font-medium leading-relaxed">
                    ¡Adivina la palabra chilanga!
                    <br/><br/>
                    En móvil: Ponte el cel en la frente.
                    <br/>
                    En PC: Usa el teclado o mouse.
                </p>
            </div>

            <button 
                onClick={requestPermissionsAndStart}
                className="bg-yellow-400 hover:bg-yellow-300 text-pink-800 text-2xl font-black py-6 px-12 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95"
            >
                ¡A JUGAR!
            </button>
            
            <p className="mt-6 text-sm text-white/60">
                Compatible con Android y iOS
            </p>
        </div>
      )}

      {/* LOADING SCREEN */}
      {gameState === GameState.LOADING && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-900">
            <div className="w-16 h-16 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin mb-8"></div>
            <h2 className="text-3xl text-white font-bold">{loadingText}</h2>
            <p className="text-indigo-300 mt-4">Consultando con la banda...</p>
        </div>
      )}

      {/* INSTRUCTIONS PRE-GAME */}
      {gameState === GameState.INSTRUCTIONS && (
          <div className="flex flex-col items-center justify-center min-h-screen bg-black p-8 text-center" onClick={handleStartPlaying}>
              <div className="space-y-8 max-w-2xl w-full">
                <h2 className="text-4xl font-bold text-yellow-400">Instrucciones</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <h3 className="text-white font-bold text-xl mb-2 border-b border-gray-600 pb-2">📱 En Celular</h3>
                        <p className="text-gray-300 text-sm mb-2">Pon el celular en tu frente (horizontal).</p>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">⬇️</span>
                            <span className="text-green-400 font-bold">Inclina abajo:</span> <span className="text-gray-400">Correcto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">⬆️</span>
                            <span className="text-red-400 font-bold">Inclina arriba:</span> <span className="text-gray-400">Pasar</span>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <h3 className="text-white font-bold text-xl mb-2 border-b border-gray-600 pb-2">💻 En PC / Web</h3>
                        <p className="text-gray-300 text-sm mb-2">Usa el teclado o los botones en pantalla.</p>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-gray-700 px-2 py-1 rounded text-white text-xs">Flecha Abajo</span>
                            <span className="text-green-400 font-bold">= Correcto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-700 px-2 py-1 rounded text-white text-xs">Flecha Arriba</span>
                            <span className="text-red-400 font-bold">= Pasar</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleStartPlaying} 
                    className="w-full bg-white text-black font-black text-2xl py-6 rounded-xl animate-pulse hover:bg-gray-200 transition-colors"
                >
                    EMPEZAR YA
                </button>
              </div>
          </div>
      )}

      {/* GAME SCREEN */}
      {gameState === GameState.PLAYING && (
        <GameScreen words={words} onFinish={handleFinishGame} />
      )}

      {/* RESULTS SCREEN */}
      {gameState === GameState.FINISHED && (
        <ResultScreen 
            results={results} 
            onRestart={requestPermissionsAndStart} 
            onMenu={() => setGameState(GameState.MENU)} 
        />
      )}
    </div>
  );
};

export default App;