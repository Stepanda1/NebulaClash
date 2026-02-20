export type Language = 'en' | 'ru';

type Copy = {
    paused: string;
    resume: string;
    restart: string;
    exitGame: string;
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
    shop: string;
    coins: string;
    coinsAmount: (amount: number) => string;
    buyExtraMoves: string;
    buyExtraTime: string;
    notEnoughCoins: string;
    boughtExtraMoves: (amount: number) => string;
    boughtExtraTime: (amount: number) => string;
    buyCoins: string;
    payRealMoney: string;
    openPayment: string;
    paymentNote: string;
    shopPackUnavailable: string;
    payoutToSberHint: string;
    legal: string;
    offer: string;
    privacy: string;
    refunds: string;
    contacts: string;
    close: string;
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
        exitGame: 'EXIT GAME',
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
        shop: 'Shop',
        coins: 'Space coins',
        coinsAmount: (amount) => `${amount} coins`,
        buyExtraMoves: 'Buy +5 moves',
        buyExtraTime: 'Buy +30 sec',
        notEnoughCoins: 'Not enough coins',
        boughtExtraMoves: (amount) => `Added +${amount} moves`,
        boughtExtraTime: (amount) => `Added +${amount} sec`,
        buyCoins: 'Buy coins',
        payRealMoney: 'Real money',
        openPayment: 'Pay',
        paymentNote: 'For auto top-up, connect provider webhook to your backend.',
        shopPackUnavailable: 'Payment service is unavailable right now',
        payoutToSberHint: 'Withdraw to Sber in Lava: Balance -> Payout details -> SBP -> Sberbank.',
        legal: 'Legal',
        offer: 'Offer',
        privacy: 'Privacy',
        refunds: 'Refunds',
        contacts: 'Contacts',
        close: 'Close',
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
        exitGame: 'ВЫЙТИ ИЗ ИГРЫ',
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
        shop: 'Магазин',
        coins: 'Космические монеты',
        coinsAmount: (amount) => `${amount} монет`,
        buyExtraMoves: 'Купить +5 ходов',
        buyExtraTime: 'Купить +30 сек',
        notEnoughCoins: 'Недостаточно монет',
        boughtExtraMoves: (amount) => `Добавлено +${amount} ходов`,
        boughtExtraTime: (amount) => `Добавлено +${amount} сек`,
        buyCoins: 'Купить монеты',
        payRealMoney: 'Реальные деньги',
        openPayment: 'Оплатить',
        paymentNote: 'Для автозачисления подключите вебхук провайдера к вашему бэкенду.',
        shopPackUnavailable: 'Платежный сервис сейчас недоступен',
        payoutToSberHint: 'Вывод на Сбер в Lava: Баланс -> Реквизиты вывода -> СБП -> Сбербанк.',
        legal: 'Документы',
        offer: 'Оферта',
        privacy: 'Конфиденциальность',
        refunds: 'Возврат',
        contacts: 'Контакты',
        close: 'Закрыть',
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

