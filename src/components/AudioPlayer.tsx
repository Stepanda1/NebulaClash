import React, { useEffect, useRef } from 'react';

export type AudioTrackMode = 'lobby' | 'level' | 'boss';

interface AudioPlayerProps {
    isMuted: boolean;
    volume: number; // 0..1
    mode: AudioTrackMode;
}

const MUSIC_URL = "/bgm.mp3";

const TRACK_PRESETS: Record<AudioTrackMode, { volumeScale: number; playbackRate: number; startTime: number }> = {
    lobby: { volumeScale: 0.2, playbackRate: 0.93, startTime: 0 },
    level: { volumeScale: 0.28, playbackRate: 0.99, startTime: 18 },
    boss: { volumeScale: 0.34, playbackRate: 1.08, startTime: 42 },
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ isMuted, volume, mode }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const modeRef = useRef<AudioTrackMode>(mode);

    // Background music: CC0 track (OpenGameArt)
    // Title: "Outer Space Loop"
    // Author: wipics
    // Source: https://opengameart.org/content/outer-space-loop
    // License: https://creativecommons.org/publicdomain/zero/1.0/

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const clamped = Math.max(0, Math.min(1, volume));
        const preset = TRACK_PRESETS[mode];
        const scaled = clamped * preset.volumeScale;
        audio.muted = isMuted;
        audio.volume = scaled;
    }, [isMuted, mode, volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const preset = TRACK_PRESETS[mode];
        const applyPreset = (resetPosition: boolean) => {
            audio.playbackRate = preset.playbackRate;
            audio.defaultPlaybackRate = preset.playbackRate;
            try {
                (audio as HTMLAudioElement & { preservesPitch?: boolean; mozPreservesPitch?: boolean; webkitPreservesPitch?: boolean }).preservesPitch = false;
                (audio as HTMLAudioElement & { mozPreservesPitch?: boolean }).mozPreservesPitch = false;
                (audio as HTMLAudioElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false;
            } catch {
                // Pitch preservation toggle is browser-specific.
            }

            if (!resetPosition) return;
            if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
            const safeTarget = Math.max(0, Math.min(preset.startTime, Math.max(0, audio.duration - 0.35)));
            if (Math.abs(audio.currentTime - safeTarget) > 1.25) {
                audio.currentTime = safeTarget;
            }
        };

        const modeChanged = modeRef.current !== mode;
        modeRef.current = mode;

        if (audio.readyState >= 1) {
            applyPreset(modeChanged);
            return;
        }

        const handleMetadata = () => applyPreset(modeChanged);
        audio.addEventListener('loadedmetadata', handleMetadata);
        return () => {
            audio.removeEventListener('loadedmetadata', handleMetadata);
        };
    }, [mode]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const tryPlay = () => {
            if (audio.paused) {
                audio.play().catch(() => null);
            }
        };

        const handleFirstInteraction = () => {
            tryPlay();
        };

        const handleCanPlay = () => {
            tryPlay();
        };

        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('loadeddata', handleCanPlay);

        window.addEventListener('pointerdown', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);
        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('touchstart', handleFirstInteraction);

        tryPlay();

        return () => {
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('loadeddata', handleCanPlay);
            window.removeEventListener('pointerdown', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (!isMuted) {
            if (audio.paused) {
                audio.play().catch(() => null);
            }
        }
    }, [isMuted]);

    return <audio ref={audioRef} src={MUSIC_URL} loop preload="auto" playsInline autoPlay />;
};
