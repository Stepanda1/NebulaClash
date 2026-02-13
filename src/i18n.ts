export type Language = 'en' | 'ru';

type Copy = {
    paused: string;
    resume: string;
    restart: string;
    sound: string;
    mute: string;
    unmute: string;
    language: string;
    outOfMoves: string;
    shufflePrompt: string;
    finalScore: string;
    tryAgain: string;
    levelUp: string;
    stageComplete: (level: number) => string;
    scoreBonus: string;
    nextLevel: string;
    goal: string;
    points: string;
    moves: string;
    time: string;
    donate: string;
    level: (level: number) => string;
    tutorialSteps: [string, string, string];
    skipTutorial: string;
    swipe: string;
    doubleTap: string;
    combo: (value: number) => string;
};

export const COPY: Record<Language, Copy> = {
    en: {
        paused: 'PAUSED',
        resume: 'RESUME',
        restart: 'RESTART',
        sound: 'SOUND',
        mute: 'Mute',
        unmute: 'Unmute',
        language: 'LANGUAGE',
        outOfMoves: 'Out of Moves!',
        shufflePrompt: 'Time to shuffle things up?',
        finalScore: 'Final Score',
        tryAgain: 'Try Again',
        levelUp: 'LEVEL UP!',
        stageComplete: (level) => `Stage ${level} Complete`,
        scoreBonus: 'Score Bonus',
        nextLevel: 'Next Level',
        goal: 'Goal',
        points: 'points',
        moves: 'Moves',
        time: 'Time',
        donate: 'Donate',
        level: (level) => `Level ${level}`,
        tutorialSteps: [
            'Swipe the highlighted gems to make a line of 3.',
            'Double tap the Bomb to activate it.',
            'Swipe the Lightning to activate it.',
        ],
        skipTutorial: 'Skip tutorial',
        swipe: 'Swipe',
        doubleTap: 'Double tap',
        combo: (value) => `Combo x${value}`,
    },
    ru: {
        paused: 'ПАУЗА',
        resume: 'ПРОДОЛЖИТЬ',
        restart: 'ПЕРЕЗАПУСК',
        sound: 'ЗВУК',
        mute: 'Выключить звук',
        unmute: 'Включить звук',
        language: 'ЯЗЫК',
        outOfMoves: 'Ходы закончились!',
        shufflePrompt: 'Попробуем еще раз?',
        finalScore: 'Итоговый счет',
        tryAgain: 'Играть снова',
        levelUp: 'УРОВЕНЬ ПРОЙДЕН!',
        stageComplete: (level) => `Уровень ${level} завершен`,
        scoreBonus: 'Бонус очков',
        nextLevel: 'Следующий уровень',
        goal: 'Цель',
        points: 'очков',
        moves: 'Ходы',
        time: 'Время',
        donate: 'Донат',
        level: (level) => `Уровень ${level}`,
        tutorialSteps: [
            'Проведи по выделенным кристаллам, чтобы собрать линию из 3.',
            'Дважды нажми на Бомбу, чтобы активировать ее.',
            'Проведи по Молнии, чтобы активировать ее.',
        ],
        skipTutorial: 'Пропустить обучение',
        swipe: 'Свайп',
        doubleTap: 'Двойной тап',
        combo: (value) => `Комбо x${value}`,
    },
};
