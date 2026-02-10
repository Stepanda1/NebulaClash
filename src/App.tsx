import React, { useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { useGame } from './hooks/useGame';
import { PauseMenu } from './components/PauseMenu';
import { GameOverMenu } from './components/GameOverMenu';
import { LevelUpModal } from './components/LevelUpModal';
import { StarProgress } from './components/StarProgress';
import { AudioPlayer } from './components/AudioPlayer';
import { Coffee, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { grid, score, moves, level, scoreToNextLevel, isProcessing, isPaused, setIsPaused, selectedTile, explodingIds, handleTileClick, handleRestart, isLevelUp, handleNextLevel } = useGame();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // Game Over only when moves are 0 AND animations are done
  const isGameOver = moves <= 0 && !isProcessing;

  const onRestart = () => {
    handleRestart();
    // setIsPaused(false) is handled in handleRestart hook
  };

  return (
    <div className="flex flex-col items-center justify-between h-full max-h-[900px] w-full max-w-lg mx-auto p-4 safe-area-inset relative overflow-hidden bg-black/30 backdrop-blur-md rounded-[3rem] border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_30px_rgba(255,255,255,0.05)]">

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && !isGameOver && (
          <PauseMenu
            onResume={() => setIsPaused(false)}
            onRestart={onRestart}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(m => !m)}
            volume={volume}
            onVolumeChange={(v) => {
              setVolume(v);
              if (v > 0 && isMuted) setIsMuted(false);
            }}
          />
        )}
        {isGameOver && (
          <GameOverMenu score={score} onRestart={onRestart} />
        )}
        {isLevelUp && (
          <LevelUpModal level={level} score={score} onNextLevel={handleNextLevel} />
        )}
      </AnimatePresence>

      <AudioPlayer isMuted={isMuted} volume={volume} />

      {/* Top Bar: Progress & Settings */}
      <div className="w-full flex flex-col gap-2 z-10">
        <div className="flex justify-between items-start">
          <button
            onClick={() => setIsPaused(true)}
            className="w-12 h-12 rounded-full bg-blue-500 border-4 border-white shadow-lg text-white font-bold active:scale-95 transition-transform flex items-center justify-center p-0 mt-2"
          >
            {/* Pause Icon / Settings */}
            <Settings className="text-white w-6 h-6" />
          </button>

          {/* Star Progress Bar */}
          <div className="flex-1 flex justify-center -mt-1">
            <StarProgress score={score} target={scoreToNextLevel} level={level} />
          </div>

          {/* Donate Button */}
          <a
            href="https://www.donationalerts.com/r/stepanda1"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[76px] h-12 rounded-2xl bg-gradient-to-br from-cyan-300/90 via-sky-300/80 to-blue-300/90 border-2 border-white/70 shadow-[0_8px_18px_rgba(56,189,248,0.55)] backdrop-blur-md flex items-center justify-center gap-1 text-black font-extrabold uppercase tracking-wide transition-all hover:scale-105 active:scale-95 mt-2"
            title="Поддержать разработчика"
            aria-label="Поддержать разработчика"
          >
            <Coffee className="w-4 h-4" />
            <span className="text-[10px]">Donate</span>
          </a>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col justify-center items-center w-full relative">
        {/* Score Popup Placeholder */}
        <div className="flex justify-center items-center h-16 w-full z-10 shrink-0">
          <motion.span
            key={score}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-4xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] stroke-black"
            style={{ WebkitTextStroke: '2px #000' }}
          >
            {score}
          </motion.span>
        </div>

        {/* Board Frame */}
        <div className="relative p-3 bg-white/20 backdrop-blur-xl rounded-3xl border-4 border-white/40 shadow-2xl">
          <GameBoard
            grid={grid}
            selectedTile={selectedTile}
            explodingIds={explodingIds}
            onTileClick={(tile) => !isPaused && handleTileClick(tile)}
          />
        </div>
      </div>

      {/* Bottom Bar: Moves (Left) & Boosters (Right) */}
      <div className="w-full z-10 pb-6 px-4">
        <div className="flex items-end justify-between max-w-md mx-auto relative">
          {/* Moves Counter (Bottom Left) */}
          <div className="flex flex-col items-center justify-center bg-blue-600 w-20 h-20 rounded-2xl border-4 border-white shadow-xl relative z-20">
            <span className="text-white/80 text-[10px] font-bold uppercase mt-1">Moves</span>
            <span className="text-3xl font-black text-white leading-none drop-shadow-md">{moves}</span>
          </div>

          {/* Boosters (Right side) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex items-center gap-2 shadow-xl mb-1 ml-4 flex-1 justify-end">
            {[1, 2, 3].map((i) => (
              <button key={i} className="w-12 h-12 bg-purple-500/20 hover:bg-purple-500/40 border-2 border-purple-400/30 rounded-xl flex items-center justify-center transition-all active:scale-95 group">
                <div className="w-6 h-6 bg-purple-400/20 rounded-md rotate-45 border border-purple-300/20" />
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
