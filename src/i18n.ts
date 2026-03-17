export type Language = 'en' | 'ru' | 'zh';

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
    zh: {
        paused: '已暂停',
        resume: '继续',
        restart: '重新开始',
        exitGame: '退出游戏',
        sound: '声音',
        mute: '静音',
        unmute: '取消静音',
        language: '语言',
        outOfMoves: '步数用完了！',
        shufflePrompt: '要重新洗牌吗？',
        finalScore: '最终得分',
        tryAgain: '再试一次',
        levelUp: '关卡完成！',
        stageComplete: (level) => `第 ${level} 关完成`,
        scoreBonus: '分数奖励',
        nextLevel: '下一关',
        goal: '目标',
        points: '分',
        moves: '步数',
        time: '时间',
        shop: '商店',
        coins: '星际金币',
        coinsAmount: (amount) => `${amount} 金币`,
        buyExtraMoves: '购买 +5 步',
        buyExtraTime: '购买 +30 秒',
        notEnoughCoins: '金币不足',
        boughtExtraMoves: (amount) => `已增加 +${amount} 步`,
        boughtExtraTime: (amount) => `已增加 +${amount} 秒`,
        buyCoins: '购买金币',
        payRealMoney: '真实货币',
        openPayment: '支付',
        paymentNote: '如需自动到账，请将支付提供商的 webhook 连接到后端。',
        shopPackUnavailable: '支付服务当前不可用',
        payoutToSberHint: 'Lava 提现到 Sber：余额 -> 提现资料 -> SBP -> Sberbank。',
        legal: '法律信息',
        offer: '报价条款',
        privacy: '隐私',
        refunds: '退款',
        contacts: '联系方式',
        close: '关闭',
        level: (level) => `第 ${level} 关`,
        tutorialSteps: [
            '滑动高亮宝石，组成 3 个相连的匹配。',
            '双击炸弹即可触发它。',
            '滑动闪电道具即可触发它。',
        ],
        skipTutorial: '跳过教程',
        swipe: '滑动',
        doubleTap: '双击',
        combo: (value) => `连击 x${value}`,
    },
};

