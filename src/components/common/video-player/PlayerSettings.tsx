"use client";

import React, { useEffect, useRef } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

type AvailableSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

interface PlayerSettingsProps {
  show: boolean;
  activeTab: 'speed' | 'quality';
  speed: AvailableSpeed;
  qualities: Array<{ index: number; label: string }>;
  currentQuality: number;
  onTabChange: (tab: 'speed' | 'quality') => void;
  onSpeedChange: (speed: AvailableSpeed) => void;
  onQualityChange: (level: number) => void;
  onToggle: () => void;
  disabled?: boolean;
}

const SPEEDS: AvailableSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const PlayerSettings: React.FC<PlayerSettingsProps> = ({
  show, activeTab, speed, qualities, currentQuality,
  onTabChange, onSpeedChange, onQualityChange, onToggle, disabled = false,
}) => {
  const speedRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const qualityRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll to active item when panel opens or tab changes
  useEffect(() => {
    if (!show) return;
    setTimeout(() => {
      if (activeTab === 'speed') {
        const idx = SPEEDS.findIndex((s) => s === speed);
        speedRefs.current[idx]?.scrollIntoView({ block: 'nearest' });
      } else if (activeTab === 'quality') {
        const idx = qualities.findIndex((q) => q.index === currentQuality);
        qualityRefs.current[idx]?.scrollIntoView({ block: 'nearest' });
      }
    }, 0);
  }, [show, activeTab, speed, currentQuality, qualities]);

  return (
    <div className="relative">
      <button
        onClick={disabled ? undefined : onToggle}
        className={`p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-white ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        aria-label="Settings"
        title={disabled ? "Settings disabled during watch party" : "Settings"}
      >
        <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {show && (
        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px] max-h-[200px] border border-white/20">
          {/* Tab Buttons */}
          <div className="flex mb-2 border-b border-white/20">
            <button
              onClick={() => onTabChange('speed')}
              className={`flex-1 px-2 py-1 text-[10px] sm:text-xs rounded-t transition-colors ${activeTab === 'speed' ? 'text-blue-400 bg-blue-400/20' : 'text-gray-300 hover:text-white'}`}
            >
              Speed
            </button>
            {qualities.length > 0 && (
              <button
                onClick={() => onTabChange('quality')}
                className={`flex-1 px-2 py-1 text-[10px] sm:text-xs rounded-t transition-colors ${activeTab === 'quality' ? 'text-blue-400 bg-blue-400/20' : 'text-gray-300 hover:text-white'}`}
              >
                Quality
              </button>
            )}
          </div>

          {/* Speed Options */}
          {activeTab === 'speed' && (
            <div className="space-y-1 max-h-[56px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {SPEEDS.map((s, idx) => (
                <button
                  key={s}
                  ref={el => { speedRefs.current[idx] = el; }}
                  onClick={() => onSpeedChange(s)}
                  className={`w-full text-left px-2 py-1 text-[10px] sm:text-xs rounded hover:bg-white/10 transition-colors ${speed === s ? 'text-blue-400 bg-blue-400/20' : 'text-white'}`}
                >
                  {s === 1 ? 'Normal' : `${s}x`}
                </button>
              ))}
            </div>
          )}

          {/* Quality Options */}
          {activeTab === 'quality' && qualities.length > 0 && (
            <div className="space-y-1 max-h-[56px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {qualities.map((q, idx) => (
                <button
                  key={q.label}
                  ref={el => { qualityRefs.current[idx] = el; }}
                  onClick={() => onQualityChange(q.index)}
                  className={`w-full text-left px-2 py-1 text-[10px] sm:text-xs rounded hover:bg-white/10 transition-colors ${currentQuality === q.index ? 'text-blue-400 bg-blue-400/20' : 'text-white'}`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

PlayerSettings.displayName = "PlayerSettings";
export default PlayerSettings;
