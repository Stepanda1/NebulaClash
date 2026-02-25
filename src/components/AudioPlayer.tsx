import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
    isMuted: boolean;
    volume: number; // 0..1
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ isMuted, volume }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Background music: CC0 track (OpenGameArt)
    // Title: "Outer Space Loop"
    // Author: wipics
    // Source: https://opengameart.org/content/outer-space-loop
    // License: https://creativecommons.org/publicdomain/zero/1.0/
    const MUSIC_URL = "/bgm.mp3";

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const clamped = Math.max(0, Math.min(1, volume));
        const scaled = clamped * 0.35;
        audio.muted = isMuted;
        audio.volume = scaled;
    }, [isMuted, volume]);

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
