import React from 'react';
import { RoundResult, TurnStatus } from '../types';

interface ResultScreenProps {
  results: RoundResult[];
  onRestart: () => void;
  onMenu: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ results, onRestart, onMenu }) => {
  const score = results.filter(r => r.status === TurnStatus.CORRECT).length;

  return (
    <div className="min-h-screen bg-pink-600 p-6 flex flex-col items-center overflow-y-auto">
      <h2 className="text-5xl font-black text-yellow-300 mb-2 perspective-text mt-8">¡Se acabó!</h2>
      
      <div className="bg-white text-black rounded-3xl p-6 w-full max-w-md shadow-2xl mb-8 text-center">
        <p className="text-xl font-bold text-gray-500 uppercase">Puntaje</p>
        <p className="text-8xl font-black text-pink-600">{score}</p>
        <p className="text-gray-400 font-medium">de {results.length} palabras</p>
      </div>

      <div className="w-full max-w-md space-y-3 mb-24">
        {results.map((res, idx) => (
            <div key={idx} className={`flex items-center p-4 rounded-xl shadow-md ${res.status === TurnStatus.CORRECT ? 'bg-green-100 border-l-8 border-green-500' : 'bg-red-100 border-l-8 border-red-500'}`}>
                <div className="flex-1">
                    <span className="text-xl font-bold text-gray-800 block">{res.word}</span>
                </div>
                <div className="text-2xl">
                    {res.status === TurnStatus.CORRECT ? '✅' : '❌'}
                </div>
            </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/10 backdrop-blur-md p-4 flex gap-4 justify-center border-t border-white/20">
        <button 
            onClick={onMenu}
            className="flex-1 max-w-[200px] bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-full shadow-lg transition-transform active:scale-95"
        >
            Menú
        </button>
        <button 
            onClick={onRestart}
            className="flex-1 max-w-[200px] bg-yellow-400 hover:bg-yellow-300 text-pink-700 font-black py-4 rounded-full shadow-lg transition-transform active:scale-95 text-xl"
        >
            Otra Vez
        </button>
      </div>
    </div>
  );
};