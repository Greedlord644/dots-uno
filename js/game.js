"use strict";


/* =========================================================
   DOTS UNO
   HLAVNÍ HERNÍ ENGINE
========================================================= */


const GAME_RUNTIME = {

    slotIndex: null,

    state: null,

    pendingSevenChoice: false,

    playerUnoTimer: null,

    playerUnoResolver: null,

    lukyUnoTimer: null,

    lukyUnoCatchOpen: false,

    lukyPhraseTimer: null,

    emoteCooldownUntil: 0,

    emoteTimer: null,

    lukyTurnRunning: false,

    paused: false
};


/* =========================================================
   EVENTY PRO UI
========================================================= */

function emitGameEvent(
    name,
    detail = {}
) {
    window.dispatchEvent(
        new CustomEvent(
            `dotsuno:${name}`,
            {
                detail
            }
        )
    );
}


/* =========================================================
   STAV
========================================================= */

function getGameState() {
    return GAME_RUNTIME.state;
}


function getActiveSlotIndex() {
    return GAME_RUNTIME.slotIndex;
}


/* =========================================================
   NOVÁ PARTIE
========================================================= */

function startNewGame(slotIndex) {

    clearRuntimeTimers();


    const slot =
        getSaveSlot(slotIndex);


    if (
        !slot ||
        isSaveSlotEmpty(slot)
    ) {
        throw new Error(
            "Nelze spustit hru v prázdném slotu."
        );
    }


    GAME_RUNTIME.slotIndex =
        slotIndex;

    GAME_RUNTIME.pendingSevenChoice =
        false;

    GAME_RUNTIME.paused =
        false;


    const gameNumber =
        getNextGameNumber(
            slotIndex
        );


    const deck =
        shuffleDeck(
            createDeck()
        );


    const playerHand = [];

    const lukyHand = [];


    for (
        let index = 0;
        index < GAME_CONFIG.startingHandSize;
        index += 1
    ) {

        playerHand.push(
            deck.pop()
        );


        lukyHand.push(
            deck.pop()
        );
    }


    const firstDiscard =
        deck.pop();


    const state = {

        version:
            GAME_CONFIG.storageVersion,

        status:
            "playing",

        turn:
            "player",

        playerHand:
            sortHand(
                playerHand
            ),

        lukyHand:
            sortHand(
                lukyHand
            ),

        drawPile:
            deck,

        discardPile:
            [
                firstDiscard
            ],

        currentColor:
            getInitialColor(
                firstDiscard
            ),

        drawPenalty: 0,

        topPenaltyType: null,

        skipChainCount: 0,

        pendingPlayerUno: false,

        pendingLukyUno: false,

        lukyForgotUno: false,

        playerForcedDrawStreak: 0,

        turnCount: 0,

        yellowEventEligible:
            GAME_CONFIG
                .yellowEvent
                .enabled &&
            (
                gameNumber %
                GAME_CONFIG
                    .yellowEvent
                    .everyNthGame
            ) === 0,

        yellowEventAvailable: false,

        yellowEventUsed: false,

        gameNumber,

        startedAt:
            getSaveTimestamp(),

        updatedAt:
            getSaveTimestamp()
    };


    GAME_RUNTIME.state =
        state;


    saveGame();


    emitGameEvent(
        "game-started",
        {
            state,
            slot
        }
    );


    triggerOpeningQuote();


    emitStateChanged();


    return state;
}


/* =========================================================
   POKRAČOVÁNÍ PARTIE
========================================================= */

function continueSavedGame(
    slotIndex
) {

    clearRuntimeTimers();


    const slot =
        getSaveSlot(
            slotIndex
        );


    if (
        !slot ||
        isSaveSlotEmpty(slot)
    ) {
        throw new Error(
            "Slot neexistuje."
        );
    }


    const saved =
        loadCurrentGame(
            slotIndex
        );


    if (!saved) {

        return startNewGame(
            slotIndex
        );
    }


    GAME_RUNTIME.slotIndex =
        slotIndex;


    GAME_RUNTIME.state = {

        ...saved,

        playerForcedDrawStreak:
            normalizeNonNegativeInteger(
                saved.playerForcedDrawStreak
            ),

        turnCount:
            normalizeNonNegativeInteger(
                saved.turnCount
            ),

        yellowEventEligible:
            typeof saved.yellowEventEligible ===
                "boolean"
                ? saved.yellowEventEligible
                : (
                    saved.gameNumber %
                    GAME_CONFIG
                        .yellowEvent
                        .everyNthGame
                ) === 0
    };


    GAME_RUNTIME.pendingSevenChoice =
        false;


    GAME_RUNTIME.paused =
        false;


    emitGameEvent(
        "game-loaded",
        {
            state:
                GAME_RUNTIME.state,

            slot
        }
    );


    emitStateChanged();


    restorePendingUnoState();


    if (
        GAME_RUNTIME.state.turn ===
            "luky" &&
        !GAME_RUNTIME.state
            .pendingPlayerUno
    ) {

        scheduleLukyTurn();
    }


    return GAME_RUNTIME.state;
}


/* =========================================================
   PRVNÍ BARVA
========================================================= */

function getInitialColor(card) {

    if (
        !card ||
        isWildCard(card)
    ) {
        return CARD_COLORS.RED;
    }


    return card.color;
}


/* =========================================================
   VRCHNÍ KARTA
========================================================= */

function getCurrentTopCard() {

    return getTopDiscardCard(
        GAME_RUNTIME.state
    );
}


/* =========================================================
   VALIDACE HRÁČOVA TAHU
========================================================= */

function validatePlayerPlay(
    cardIds
) {

    const state =
        GAME_RUNTIME.state;


    if (!state) {

        return invalidPlay(
            "Hra není spuštěná."
        );
    }


    if (
        state.status !==
        "playing"
    ) {

        return invalidPlay(
            "Partie už skončila."
        );
    }


    if (
        GAME_RUNTIME.paused
    ) {

        return invalidPlay(
            "Hra je pozastavená."
        );
    }


    if (
        GAME_RUNTIME
            .pendingSevenChoice
    ) {

        return invalidPlay(
            "Nejdřív dokonči rozhodnutí o sedmičce."
        );
    }


    if (
        state.turn !==
        "player"
    ) {

        return invalidPlay(
            "Teď hraje Luky."
        );
    }


    const cards =
        getCardsByIds(
            state.playerHand,
            cardIds
        );


    if (
        cards.length === 0 ||
        cards.length !==
            cardIds.length
    ) {

        return invalidPlay(
            "Vybrané karty nejsou v ruce."
        );
    }


    if (
        !isValidCardSelection(
            cards
        )
    ) {

        return invalidPlay(
            "Přes Kuř! lze zahrát pouze stejné karty."
        );
    }


    /* =====================================================
       +2 / +4 ŘETĚZEC
    ===================================================== */

    if (
        state.drawPenalty > 0
    ) {

        if (
            !canCounterDrawStack(
                cards,
                state.topPenaltyType
            )
        ) {

            return invalidPlay(
                "Těmito kartami nelze přehodit dobírací penalizaci."
            );
        }


        return validPlayResult(
            cards
        );
    }


    /* =====================================================
       STŮJ ŘETĚZEC
    ===================================================== */

    if (
        state.skipChainCount > 0
    ) {

        if (
            !canCounterSkip(
                cards
            )
        ) {

            return invalidPlay(
                "Na Stůj lze odpovědět pouze kartou Stůj."
            );
        }


        return validPlayResult(
            cards
        );
    }


    /* =====================================================
       BĚŽNÝ TAH
    ===================================================== */

    const first =
        cards[0];


    if (
        !isCardNormallyPlayable(
            first,
            getCurrentTopCard(),
            state.currentColor
        )
    ) {

        return invalidPlay(
            "Tuto kartu teď nelze zahrát."
        );
    }


    return validPlayResult(
        cards
    );
}


function validPlayResult(cards) {

    return {
        valid: true,

        cards,

        needsColorChoice:
            needsColorChoice(
                cards
            )
    };
}


function invalidPlay(message) {

    return {
        valid: false,

        message,

        cards: [],

        needsColorChoice: false
    };
}


/* =========================================================
   ZAHRÁNÍ KARET HRÁČEM
========================================================= */

async function playerPlayCards(
    cardIds,
    chosenColor = null
) {

    const validation =
        validatePlayerPlay(
            cardIds
        );


    if (!validation.valid) {

        emitGameEvent(
            "invalid-action",
            {
                message:
                    validation.message
            }
        );


        return validation;
    }


    if (
        validation
            .needsColorChoice &&
        !isPlayableColor(
            chosenColor
        )
    ) {

        return {
            valid: false,

            needsColorChoice:
                true,

            cards:
                validation.cards
        };
    }


    const state =
        GAME_RUNTIME.state;


    const cards =
        validation.cards;


    const previousSkipChain =
        state.skipChainCount;


    cancelPlayerUnoTimer();


    state.playerHand =
        removeCardsFromHand(
            state.playerHand,
            cards
        );


    state.playerHand =
        sortHand(
            state.playerHand
        );


    pushCardsToDiscard(
        cards
    );


    updateCurrentColorAfterPlay(
        cards,
        chosenColor
    );


    const effect =
        getSelectionEffect(
            cards
        );


    /* =====================================================
       KUŘ!
    ===================================================== */

    if (
        effect.isKur
    ) {

        emitGameEvent(
            "player-speech",
            {
                text:
                    getKurQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .shortDurationMs
            }
        );
    }


    emitGameEvent(
        "cards-played",
        {
            actor:
                "player",

            cards,

            effect,

            currentColor:
                state.currentColor
        }
    );


    /* =====================================================
       VÝHRA
    ===================================================== */

    if (
        state.playerHand.length ===
        0
    ) {

        await finishGame(
            "player"
        );


        return {
            valid: true,

            finished: true
        };
    }


    state.playerForcedDrawStreak =
        0;


    /* =====================================================
       +2 / +4
    ===================================================== */

    if (
        effect.type ===
            CARD_TYPES.DRAW_TWO ||
        effect.type ===
            CARD_TYPES.WILD_DRAW_FOUR
    ) {

        handleDrawCardPlay(
            "player",
            cards,
            effect
        );


        maybeTriggerHeavyDrawQuote(
            effect.amount
        );


        await handlePlayerUnoAfterPlay();


        saveGame();

        emitStateChanged();


        if (
            !state.pendingPlayerUno
        ) {

            scheduleLukyTurn();
        }


        return {
            valid: true
        };
    }


    /* =====================================================
       STŮJ
    ===================================================== */

    if (
        effect.type ===
        CARD_TYPES.SKIP
    ) {

        /*
            Pokud už Stůj řetězec běžel,
            právě hráč Lukyho Stůj přehodil.
        */

        if (
            previousSkipChain > 0
        ) {

            emitSkipCounterQuote(
                "player",
                previousSkipChain
            );
        }


        handleSkipPlay(
            "player"
        );


        await handlePlayerUnoAfterPlay();


        saveGame();

        emitStateChanged();


        if (
            !state.pendingPlayerUno
        ) {

            scheduleLukyTurn();
        }


        return {
            valid: true
        };
    }


    /* =====================================================
       NULA
    ===================================================== */

    if (
        isZeroCard(
            cards[0]
        )
    ) {

        swapHands();


        emitGameEvent(
            "hands-swapped",
            {
                reason:
                    "zero",

                actor:
                    "player"
            }
        );
    }


    /* =====================================================
       SEDMIČKA

       DŮLEŽITÉ:
       UNO vyhodnotíme až PO rozhodnutí o výměně,
       protože až tehdy víme, s kolika kartami hráč
       skutečně zůstal.
    ===================================================== */

    if (
        isSevenCard(
            cards[0]
        )
    ) {

        GAME_RUNTIME
            .pendingSevenChoice =
            true;


        saveGame();

        emitStateChanged();


        emitGameEvent(
            "seven-choice-requested",
            {}
        );


        return {
            valid: true,

            pendingSevenChoice:
                true
        };
    }


    /* =====================================================
       BĚŽNÁ KARTA / REVERSE

       Reverse v 1v1 nic speciálního nedělá.
    ===================================================== */

    state.turn =
        "luky";


    completeTurn();


    await handlePlayerUnoAfterPlay();


    saveGame();

    emitStateChanged();


    if (
        !state.pendingPlayerUno
    ) {

        scheduleLukyTurn();
    }


    return {
        valid: true
    };
}


/* =========================================================
   ROZHODNUTÍ O SEDMIČCE
========================================================= */

async function resolvePlayerSevenChoice(
    wantsSwap
) {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        !GAME_RUNTIME
            .pendingSevenChoice
    ) {

        return false;
    }


    GAME_RUNTIME
        .pendingSevenChoice =
        false;


    if (wantsSwap) {

        swapHands();


        emitGameEvent(
            "player-speech",
            {
                text:
                    getSevenSwapQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .defaultDurationMs
            }
        );


        emitGameEvent(
            "hands-swapped",
            {
                reason:
                    "seven",

                actor:
                    "player"
            }
        );
    }


    state.turn =
        "luky";


    completeTurn();


    /*
        UNO řešíme až po případné výměně rukou.
    */

    await handlePlayerUnoAfterPlay();


    saveGame();

    emitStateChanged();


    if (
        !state.pendingPlayerUno
    ) {

        scheduleLukyTurn();
    }


    return true;
}


/* =========================================================
   HRÁČ LÍZNE
========================================================= */

function playerDraw() {

    const state =
        GAME_RUNTIME.state;


    if (
        !canPlayerAct()
    ) {

        return false;
    }


    /* =====================================================
       PENALIZACE
    ===================================================== */

    if (
        state.drawPenalty > 0
    ) {

        const amount =
            state.drawPenalty;


        drawCards(
            "player",
            amount
        );


        emitGameEvent(
            "cards-drawn",
            {
                actor:
                    "player",

                amount,

                penalty:
                    true
            }
        );


        clearDrawPenalty();


        state.playerForcedDrawStreak =
            0;


        /*
            Hráč vzal penalizaci a stojí.
            Hraje znovu Luky.
        */

        state.turn =
            "luky";


        completeTurn();


        saveGame();

        emitStateChanged();


        maybeTriggerStrongSituationEmote();


        scheduleLukyTurn();


        return true;
    }


    /*
        Při Stůj se nelíže.
        Hráč musí buď dát vlastní Stůj,
        nebo použít playerAcceptSkip().
    */

    if (
        state.skipChainCount > 0
    ) {

        return false;
    }


    /* =====================================================
       BĚŽNÉ LÍZNUTÍ

       Po líznutí tah okamžitě končí.
    ===================================================== */

    drawCards(
        "player",
        1
    );


    state.playerForcedDrawStreak +=
        1;


    emitGameEvent(
        "cards-drawn",
        {
            actor:
                "player",

            amount:
                1,

            penalty:
                false
        }
    );


    maybeTriggerPlayerDrawReaction();


    state.turn =
        "luky";


    completeTurn();


    saveGame();

    emitStateChanged();


    scheduleLukyTurn();


    return true;
}


/* =========================================================
   HRÁČ PŘIJME STŮJ
========================================================= */

function playerAcceptSkip() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !== "playing" ||
        state.turn !== "player" ||
        state.skipChainCount <= 0 ||
        GAME_RUNTIME.paused
    ) {

        return false;
    }


    clearSkipChain();


    /*
        Poslední Stůj zahrál Luky.
        Hráč stojí a Luky hraje znovu.
    */

    state.turn =
        "luky";


    completeTurn();


    saveGame();

    emitStateChanged();


    scheduleLukyTurn();


    return true;
}


/* =========================================================
   MŮŽE HRÁČ JEDNAT?
========================================================= */

function canPlayerAct() {

    return Boolean(

        GAME_RUNTIME.state &&

        GAME_RUNTIME.state.status ===
            "playing" &&

        GAME_RUNTIME.state.turn ===
            "player" &&

        !GAME_RUNTIME.paused &&

        !GAME_RUNTIME
            .pendingSevenChoice
    );
}


/* =========================================================
   +2 / +4
========================================================= */

function handleDrawCardPlay(
    actor,
    cards,
    effect
) {

    const state =
        GAME_RUNTIME.state;


    state.drawPenalty +=
        effect.amount;


    state.topPenaltyType =
        effect.type;


    state.skipChainCount =
        0;


    state.turn =
        actor === "player"
            ? "luky"
            : "player";


    completeTurn();


    emitGameEvent(
        "draw-stack-changed",
        {
            penalty:
                state.drawPenalty,

            topPenaltyType:
                state.topPenaltyType,

            actor,

            cards
        }
    );
}


function clearDrawPenalty() {

    const state =
        GAME_RUNTIME.state;


    state.drawPenalty =
        0;


    state.topPenaltyType =
        null;
}


/* =========================================================
   STŮJ
========================================================= */

function handleSkipPlay(actor) {

    const state =
        GAME_RUNTIME.state;


    state.skipChainCount +=
        1;


    state.drawPenalty =
        0;


    state.topPenaltyType =
        null;


    state.turn =
        actor === "player"
            ? "luky"
            : "player";


    completeTurn();


    emitGameEvent(
        "skip-chain-changed",
        {
            count:
                state.skipChainCount,

            actor
        }
    );
}


function clearSkipChain() {

    GAME_RUNTIME
        .state
        .skipChainCount =
        0;
}


/* =========================================================
   STŮJ HLÁŠKY
========================================================= */

function emitSkipCounterQuote(
    actor,
    counterNumber
) {

    const text =
        actor === "luky"
            ? getSkipCounterQuote(
                counterNumber
            )
            : getPlayerSkipCounterQuote(
                counterNumber
            );


    emitGameEvent(
        actor === "luky"
            ? "luky-speech"
            : "player-speech",
        {
            text,

            duration:
                GAME_CONFIG
                    .speech
                    .shortDurationMs
        }
    );
}


/* =========================================================
   VÝMĚNA RUKOU
========================================================= */

function swapHands() {

    const state =
        GAME_RUNTIME.state;


    const player =
        state.playerHand;


    state.playerHand =
        sortHand(
            state.lukyHand
        );


    state.lukyHand =
        sortHand(
            player
        );
}


/* =========================================================
   DOBÍRÁNÍ
========================================================= */

function drawCards(
    actor,
    amount
) {

    const state =
        GAME_RUNTIME.state;


    const target =
        actor === "luky"
            ? state.lukyHand
            : state.playerHand;


    for (
        let index = 0;
        index < amount;
        index += 1
    ) {

        const card =
            drawOneCard();


        if (!card) {
            break;
        }


        target.push(
            card
        );
    }


    if (
        actor === "luky"
    ) {

        state.lukyHand =
            sortHand(
                state.lukyHand
            );

    } else {

        state.playerHand =
            sortHand(
                state.playerHand
            );
    }
}


function drawOneCard() {

    const state =
        GAME_RUNTIME.state;


    if (
        state.drawPile.length ===
        0
    ) {

        recycleDiscardPile();
    }


    return (
        state.drawPile.pop() ||
        null
    );
}


/* =========================================================
   OBNOVENÍ BALÍČKU
========================================================= */

function recycleDiscardPile() {

    const state =
        GAME_RUNTIME.state;


    if (
        state.discardPile.length <=
        1
    ) {

        return;
    }


    const top =
        state.discardPile.pop();


    state.drawPile =
        shuffleDeck(
            state.discardPile
        );


    state.discardPile =
        [top];


    emitGameEvent(
        "deck-recycled",
        {}
    );
}


/* =========================================================
   ODHOD
========================================================= */

function pushCardsToDiscard(cards) {

    const state =
        GAME_RUNTIME.state;


    cards.forEach(
        (card) => {

            state.discardPile.push(
                card
            );
        }
    );
}


/* =========================================================
   BARVA
========================================================= */

function updateCurrentColorAfterPlay(
    cards,
    chosenColor
) {

    const state =
        GAME_RUNTIME.state;


    const lastCard =
        cards[
            cards.length - 1
        ];


    if (
        isWildCard(
            lastCard
        )
    ) {

        state.currentColor =
            chosenColor;


        return;
    }


    state.currentColor =
        lastCard.color;
}


function isPlayableColor(color) {

    return [
        CARD_COLORS.RED,
        CARD_COLORS.YELLOW,
        CARD_COLORS.GREEN,
        CARD_COLORS.BLUE
    ].includes(
        color
    );
}


/* =========================================================
   LUKYHO TAH
========================================================= */

function scheduleLukyTurn() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !== "playing" ||
        state.turn !== "luky" ||
        GAME_RUNTIME.paused ||
        GAME_RUNTIME.lukyTurnRunning ||
        state.pendingPlayerUno
    ) {

        return;
    }


    runLukyTurn();
}


async function runLukyTurn() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.turn !== "luky" ||
        state.status !== "playing"
    ) {

        return;
    }


    GAME_RUNTIME.lukyTurnRunning =
        true;


    try {

        await waitForLukyThinking(
            {
                onThinkingStart:
                    (text) => {

                        emitGameEvent(
                            "luky-speech",
                            {
                                text,

                                thinking:
                                    true
                            }
                        );
                    },

                onThinkingEnd:
                    () => {

                        emitGameEvent(
                            "luky-thinking-end",
                            {}
                        );
                    }
            }
        );


        if (
            GAME_RUNTIME.paused ||
            state.status !== "playing" ||
            state.turn !== "luky"
        ) {

            return;
        }


        const decision =
            getLukyDecision(
                state
            );


        await executeLukyDecision(
            decision
        );

    } finally {

        GAME_RUNTIME.lukyTurnRunning =
            false;
    }
}


/* =========================================================
   PROVEDENÍ AI TAHU
========================================================= */

async function executeLukyDecision(
    decision
) {

    const state =
        GAME_RUNTIME.state;


    if (
        !decision ||
        !state
    ) {

        return;
    }


    /* =====================================================
       DOBÍRACÍ PENALIZACE
    ===================================================== */

    if (
        decision.action ===
            "draw" &&
        state.drawPenalty > 0
    ) {

        const amount =
            state.drawPenalty;


        drawCards(
            "luky",
            amount
        );


        emitGameEvent(
            "cards-drawn",
            {
                actor:
                    "luky",

                amount,

                penalty:
                    true
            }
        );


        clearDrawPenalty();


        state.turn =
            "player";


        completeTurn();


        saveGame();

        emitStateChanged();


        /*
            Tady se Lukymu nedařilo,
            takže nedáváme jeho pozitivní emote.
        */


        return;
    }


    /* =====================================================
       LUKY STOJÍ
    ===================================================== */

    if (
        decision.action ===
        "skip"
    ) {

        clearSkipChain();


        /*
            Poslední Stůj zahrál hráč.
            Luky stojí a hráč hraje znovu.
        */

        state.turn =
            "player";


        completeTurn();


        saveGame();

        emitStateChanged();


        return;
    }


    /* =====================================================
       BĚŽNÉ LÍZNUTÍ
    ===================================================== */

    if (
        decision.action ===
        "draw"
    ) {

        drawCards(
            "luky",
            1
        );


        emitGameEvent(
            "cards-drawn",
            {
                actor:
                    "luky",

                amount:
                    1,

                penalty:
                    false
            }
        );


        state.turn =
            "player";


        completeTurn();


        saveGame();

        emitStateChanged();


        return;
    }


    if (
        decision.action !==
        "play"
    ) {

        return;
    }


    const cards =
        decision.cards ||
        [];


    if (
        cards.length ===
        0
    ) {

        state.turn =
            "player";


        completeTurn();


        saveGame();

        emitStateChanged();


        return;
    }


    const previousSkipChain =
        state.skipChainCount;


    state.lukyHand =
        removeCardsFromHand(
            state.lukyHand,
            cards
        );


    state.lukyHand =
        sortHand(
            state.lukyHand
        );


    pushCardsToDiscard(
        cards
    );


    updateCurrentColorAfterPlay(
        cards,
        decision.chosenColor
    );


    const effect =
        getSelectionEffect(
            cards
        );


    emitGameEvent(
        "cards-played",
        {
            actor:
                "luky",

            cards,

            effect,

            currentColor:
                state.currentColor
        }
    );


    /* =====================================================
       VÝHRA LUKYHO
    ===================================================== */

    if (
        state.lukyHand.length ===
        0
    ) {

        await finishGame(
            "luky"
        );


        return;
    }


    /* =====================================================
       +2 / +4
    ===================================================== */

    if (
        effect.type ===
            CARD_TYPES.DRAW_TWO ||
        effect.type ===
            CARD_TYPES.WILD_DRAW_FOUR
    ) {

        handleDrawCardPlay(
            "luky",
            cards,
            effect
        );


        maybeTriggerStrongSituationEmote();


        handleLukyUnoAfterPlay();


        saveGame();

        emitStateChanged();


        return;
    }


    /* =====================================================
       STŮJ
    ===================================================== */

    if (
        effect.type ===
        CARD_TYPES.SKIP
    ) {

        if (
            previousSkipChain > 0
        ) {

            emitSkipCounterQuote(
                "luky",
                previousSkipChain
            );
        }


        handleSkipPlay(
            "luky"
        );


        maybeTriggerMildSituationEmote();


        handleLukyUnoAfterPlay();


        saveGame();

        emitStateChanged();


        return;
    }


    /* =====================================================
       NULA
    ===================================================== */

    if (
        isZeroCard(
            cards[0]
        )
    ) {

        swapHands();


        emitGameEvent(
            "hands-swapped",
            {
                reason:
                    "zero",

                actor:
                    "luky"
            }
        );
    }


    /* =====================================================
       SEDMIČKA
    ===================================================== */

    if (
        isSevenCard(
            cards[0]
        )
    ) {

        if (
            shouldLukySwapOnSeven(
                state
            )
        ) {

            swapHands();


            emitGameEvent(
                "hands-swapped",
                {
                    reason:
                        "seven",

                    actor:
                        "luky"
                }
            );
        }
    }


    state.turn =
        "player";


    completeTurn();


    handleLukyUnoAfterPlay();


    /*
        Pokud má Luky výrazně méně karet,
        může občas reagovat posměšným emotem.
    */

    maybeTriggerLukyCardLeadEmote();


    saveGame();

    emitStateChanged();
}


/* =========================================================
   UNO HRÁČE
========================================================= */

async function handlePlayerUnoAfterPlay() {

    const state =
        GAME_RUNTIME.state;


    if (
        state.playerHand.length !==
        1
    ) {

        state.pendingPlayerUno =
            false;


        return;
    }


    state.pendingPlayerUno =
        true;


    emitGameEvent(
        "player-uno-window-started",
        {
            duration:
                GAME_CONFIG
                    .playerUno
                    .callWindowMs
        }
    );


    await new Promise(
        (resolve) => {

            GAME_RUNTIME
                .playerUnoResolver =
                resolve;


            GAME_RUNTIME
                .playerUnoTimer =
                setTimeout(
                    () => {

                        GAME_RUNTIME
                            .playerUnoTimer =
                            null;


                        GAME_RUNTIME
                            .playerUnoResolver =
                            null;


                        if (
                            !state.pendingPlayerUno
                        ) {

                            resolve();

                            return;
                        }


                        state.pendingPlayerUno =
                            false;


                        drawCards(
                            "player",
                            GAME_CONFIG
                                .playerUno
                                .missedPenaltyCards
                        );


                        emitGameEvent(
                            "luky-speech",
                            {
                                text:
                                    getCaughtUnoQuote(),

                                duration:
                                    GAME_CONFIG
                                        .speech
                                        .defaultDurationMs
                            }
                        );


                        emitGameEvent(
                            "player-missed-uno",
                            {
                                penalty:
                                    GAME_CONFIG
                                        .playerUno
                                        .missedPenaltyCards
                            }
                        );


                        saveGame();

                        emitStateChanged();


                        resolve();


                        if (
                            state.turn ===
                            "luky"
                        ) {

                            scheduleLukyTurn();
                        }
                    },
                    GAME_CONFIG
                        .playerUno
                        .callWindowMs
                );
        }
    );
}


/* =========================================================
   HRÁČ ŘEKNE UNO
========================================================= */

function playerCallUno() {

    const state =
        GAME_RUNTIME.state;


    if (!state) {
        return false;
    }


    if (
        state.pendingPlayerUno &&
        state.playerHand.length ===
            1
    ) {

        state.pendingPlayerUno =
            false;


        emitGameEvent(
            "player-speech",
            {
                text:
                    getPlayerUnoQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .shortDurationMs
            }
        );


        cancelPlayerUnoTimer(
            true
        );


        saveGame();

        emitStateChanged();


        if (
            state.turn ===
            "luky"
        ) {

            scheduleLukyTurn();
        }


        return true;
    }


    /*
        Falešné UNO.
    */

    emitGameEvent(
        "luky-speech",
        {
            text:
                getFalseUnoQuote(),

            duration:
                GAME_CONFIG
                    .speech
                    .defaultDurationMs
        }
    );


    return false;
}


/* =========================================================
   PLAYER UNO TIMER
========================================================= */

function cancelPlayerUnoTimer(
    resolvePromise = false
) {

    if (
        GAME_RUNTIME.playerUnoTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .playerUnoTimer
        );


        GAME_RUNTIME.playerUnoTimer =
            null;
    }


    if (
        resolvePromise &&
        GAME_RUNTIME.playerUnoResolver
    ) {

        const resolver =
            GAME_RUNTIME
                .playerUnoResolver;


        GAME_RUNTIME.playerUnoResolver =
            null;


        resolver();
    }
}


/* =========================================================
   LUKYHO UNO
========================================================= */

function handleLukyUnoAfterPlay() {

    const state =
        GAME_RUNTIME.state;


    if (
        state.lukyHand.length !==
        1
    ) {

        state.pendingLukyUno =
            false;


        state.lukyForgotUno =
            false;


        GAME_RUNTIME
            .lukyUnoCatchOpen =
            false;


        return;
    }


    const forgot =
        shouldLukyForgetUno();


    state.pendingLukyUno =
        forgot;


    state.lukyForgotUno =
        forgot;


    if (forgot) {

        /*
            Nejdřív:
            "Je po všem."

            UNO až později.
        */

        emitGameEvent(
            "luky-speech",
            {
                text:
                    getLukyOneCardQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .defaultDurationMs
            }
        );


        GAME_RUNTIME
            .lukyUnoCatchOpen =
            true;


        const delay =
            getRandomLukyUnoWindow();


        emitGameEvent(
            "luky-uno-forgotten-window",
            {
                duration:
                    delay
            }
        );


        GAME_RUNTIME
            .lukyUnoTimer =
            setTimeout(
                resolveForgottenLukyUno,
                delay
            );


        return;
    }


    /*
        Normální UNO.
    */

    state.pendingLukyUno =
        false;


    state.lukyForgotUno =
        false;


    GAME_RUNTIME
        .lukyUnoCatchOpen =
        false;


    emitGameEvent(
        "luky-speech",
        {
            text:
                getLukyUnoQuote(),

            duration:
                GAME_CONFIG
                    .speech
                    .shortDurationMs
        }
    );


    const delay =
        getRandomLukyAfterUnoDelay();


    GAME_RUNTIME
        .lukyPhraseTimer =
        setTimeout(
            () => {

                if (
                    GAME_RUNTIME.state &&
                    GAME_RUNTIME.state
                        .lukyHand
                        .length ===
                        1
                ) {

                    emitGameEvent(
                        "luky-speech",
                        {
                            text:
                                getLukyOneCardQuote(),

                            duration:
                                GAME_CONFIG
                                    .speech
                                    .defaultDurationMs
                        }
                    );
                }
            },
            delay
        );
}


/* =========================================================
   LUKY SI VZPOMENE
========================================================= */

function resolveForgottenLukyUno() {

    const state =
        GAME_RUNTIME.state;


    GAME_RUNTIME
        .lukyUnoTimer =
        null;


    if (
        !state ||
        !state.pendingLukyUno ||
        state.lukyHand.length !==
            1
    ) {

        GAME_RUNTIME
            .lukyUnoCatchOpen =
            false;


        return;
    }


    state.pendingLukyUno =
        false;


    state.lukyForgotUno =
        false;


    GAME_RUNTIME
        .lukyUnoCatchOpen =
        false;


    emitGameEvent(
        "luky-speech",
        {
            text:
                getLukyUnoQuote(),

            duration:
                GAME_CONFIG
                    .speech
                    .shortDurationMs
        }
    );


    saveGame();

    emitStateChanged();
}


/* =========================================================
   NEŘEKL JSI UNO!
========================================================= */

function playerCatchLukyUno() {

    const state =
        GAME_RUNTIME.state;


    if (!state) {
        return false;
    }


    if (
        GAME_RUNTIME
            .lukyUnoCatchOpen &&
        state.pendingLukyUno &&
        state.lukyHand.length ===
            1
    ) {

        if (
            GAME_RUNTIME
                .lukyUnoTimer
        ) {

            clearTimeout(
                GAME_RUNTIME
                    .lukyUnoTimer
            );


            GAME_RUNTIME
                .lukyUnoTimer =
                null;
        }


        GAME_RUNTIME
            .lukyUnoCatchOpen =
            false;


        state.pendingLukyUno =
            false;


        state.lukyForgotUno =
            false;


        emitGameEvent(
            "player-speech",
            {
                text:
                    getPlayerCaughtLukyUnoQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .defaultDurationMs
            }
        );


        drawCards(
            "luky",
            GAME_CONFIG
                .lukyUno
                .caughtPenaltyCards
        );


        emitGameEvent(
            "cards-drawn",
            {
                actor:
                    "luky",

                amount:
                    GAME_CONFIG
                        .lukyUno
                        .caughtPenaltyCards,

                unoPenalty:
                    true
            }
        );


        const result =
            registerCaughtLukyUnoAchievement();


        announceUnlockedAchievements(
            result.newlyUnlocked
        );


        saveGame();

        emitStateChanged();


        return true;
    }


    emitGameEvent(
        "luky-speech",
        {
            text:
                getLukyCardCountQuote(
                    state.lukyHand.length
                ),

            duration:
                GAME_CONFIG
                    .speech
                    .defaultDurationMs
        }
    );


    return false;
}


/* =========================================================
   OBNOVENÍ UNO PO LOADU
========================================================= */

function restorePendingUnoState() {

    const state =
        GAME_RUNTIME.state;


    if (!state) {
        return;
    }


    if (
        state.pendingPlayerUno &&
        state.playerHand.length ===
            1
    ) {

        state.pendingPlayerUno =
            false;


        handlePlayerUnoAfterPlay();
    }


    if (
        state.pendingLukyUno &&
        state.lukyForgotUno &&
        state.lukyHand.length ===
            1
    ) {

        GAME_RUNTIME
            .lukyUnoCatchOpen =
            true;


        const delay =
            getRandomLukyUnoWindow();


        GAME_RUNTIME
            .lukyUnoTimer =
            setTimeout(
                resolveForgottenLukyUno,
                delay
            );
    }
}


/* =========================================================
   ŽLUTÝ EVENT
========================================================= */

function maybeActivateYellowEvent() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        !state.yellowEventEligible ||
        state.yellowEventAvailable ||
        state.yellowEventUsed
    ) {

        return;
    }


    if (
        state.turnCount < 4
    ) {

        return;
    }


    if (
        randomChance(
            0.12
        )
    ) {

        state.yellowEventAvailable =
            true;


        emitGameEvent(
            "yellow-event-available",
            {}
        );
    }
}


/* =========================================================
   MÁ NĚKDO ŽLUTOU?
========================================================= */

function askLukyAboutYellow() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        !state.yellowEventAvailable ||
        state.yellowEventUsed
    ) {

        return false;
    }


    state.yellowEventUsed =
        true;


    state.yellowEventAvailable =
        false;


    const hasYellow =
        lukyHasYellowCard(
            state
        );


    emitGameEvent(
        "luky-speech",
        {
            text:
                getYellowEventResponse(
                    hasYellow
                ),

            duration:
                GAME_CONFIG
                    .speech
                    .defaultDurationMs
        }
    );


    if (hasYellow) {

        const result =
            registerLukyYellowAchievement();


        announceUnlockedAchievements(
            result.newlyUnlocked
        );
    }


    saveGame();

    emitStateChanged();


    return true;
}


/* =========================================================
   OPENING LUKYHO
========================================================= */

function triggerOpeningQuote() {

    const slotIndex =
        GAME_RUNTIME.slotIndex;


    const slot =
        getSaveSlot(
            slotIndex
        );


    if (!slot) {
        return;
    }


    const history =
        getSlotQuoteHistory(
            slotIndex
        );


    const selection =
        chooseOpeningQuote(
            slot.characterId,
            history
        );


    if (!selection) {
        return;
    }


    registerOpeningQuoteUsage(
        history,
        selection
    );


    saveSlotQuoteHistory(
        slotIndex,
        history
    );


    emitGameEvent(
        "luky-opening-quote",
        {
            quote:
                normalizeQuote(
                    selection.quote
                )
        }
    );
}


/* =========================================================
   SILNÁ REAKCE NA HRÁČOVU PENALIZACI
========================================================= */

function maybeTriggerHeavyDrawQuote(
    amount
) {

    if (
        amount < 4
    ) {
        return;
    }


    const slot =
        getSaveSlot(
            GAME_RUNTIME.slotIndex
        );


    if (!slot) {
        return;
    }


    const text =
        getHeavyDrawReaction(
            slot.characterId
        );


    if (!text) {
        return;
    }


    emitGameEvent(
        "luky-speech",
        {
            text,

            duration:
                GAME_CONFIG
                    .speech
                    .defaultDurationMs,

            priority:
                "character"
        }
    );
}


/* =========================================================
   EMOTE COOLDOWN
========================================================= */

function isEmoteCooldownActive() {

    return (
        Date.now() <
        GAME_RUNTIME
            .emoteCooldownUntil
    );
}


function beginEmoteCooldown() {

    GAME_RUNTIME
        .emoteCooldownUntil =
        Date.now() +
        getRandomEmoteCooldown();
}


/* =========================================================
   SILNÁ VÝHODA LUKYHO
========================================================= */

function maybeTriggerStrongSituationEmote() {

    if (
        isEmoteCooldownActive() ||
        !shouldShowLukyStrongEmote()
    ) {

        return;
    }


    const slot =
        getSaveSlot(
            GAME_RUNTIME.slotIndex
        );


    if (!slot) {
        return;
    }


    if (
        slot.characterId ===
        "96"
    ) {

        if (
            randomChance(
                0.5
            )
        ) {

            showTemporaryEmote(
                "luky",
                getConfiguredLukyEmote(
                    "grin"
                )
            );

        } else {

            showTemporaryEmote(
                "player",
                getConfiguredCharacterEmote(
                    "96",
                    "angry"
                )
            );
        }


        return;
    }


    showTemporaryEmote(
        "luky",
        getConfiguredLukyEmote(
            "grin"
        )
    );
}


/* =========================================================
   MÍRNÁ VÝHODA LUKYHO
========================================================= */

function maybeTriggerMildSituationEmote() {

    if (
        isEmoteCooldownActive() ||
        !shouldShowLukyMildEmote()
    ) {

        return;
    }


    const slot =
        getSaveSlot(
            GAME_RUNTIME.slotIndex
        );


    if (!slot) {
        return;
    }


    if (
        slot.characterId ===
        "96"
    ) {

        if (
            randomChance(
                0.5
            )
        ) {

            showTemporaryEmote(
                "luky",
                getConfiguredLukyEmote(
                    "mild"
                )
            );

        } else {

            showTemporaryEmote(
                "player",
                getConfiguredCharacterEmote(
                    "96",
                    "inDanger"
                )
            );
        }


        return;
    }


    showTemporaryEmote(
        "luky",
        getConfiguredLukyEmote(
            "mild"
        )
    );
}


/* =========================================================
   LUKY MÁ VÝRAZNĚ MÉNĚ KARET
========================================================= */

function maybeTriggerLukyCardLeadEmote() {

    if (
        isEmoteCooldownActive()
    ) {

        return;
    }


    if (
        !isLukyClearlyAhead(
            GAME_RUNTIME.state
        )
    ) {

        return;
    }


    /*
        Ani při velké výhodě se emote
        nemá objevovat pokaždé.
    */

    if (
        !randomChance(
            0.18
        )
    ) {

        return;
    }


    showTemporaryEmote(
        "luky",
        getConfiguredLukyEmote(
            "grin"
        )
    );
}


/* =========================================================
   HRÁČ MUSÍ LÍZAT
========================================================= */

function maybeTriggerPlayerDrawReaction() {

    const state =
        GAME_RUNTIME.state;


    const slot =
        getSaveSlot(
            GAME_RUNTIME.slotIndex
        );


    if (!slot) {
        return;
    }


    /*
        Pavel třikrát po sobě líže.
    */

    if (
        slot.characterId ===
            "96" &&
        state.playerForcedDrawStreak >=
            3
    ) {

        if (
            !isEmoteCooldownActive() &&
            randomChance(
                GAME_CONFIG
                    .emotes
                    .strongSituationChance
            )
        ) {

            showTemporaryEmote(
                "player",
                getConfiguredCharacterEmote(
                    "96",
                    "angry"
                )
            );
        }


        return;
    }


    maybeTriggerMildSituationEmote();
}


/* =========================================================
   EMOTE
========================================================= */

function showTemporaryEmote(
    actor,
    image
) {

    if (
        !image ||
        isEmoteCooldownActive()
    ) {

        return false;
    }


    if (
        GAME_RUNTIME.emoteTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .emoteTimer
        );
    }


    beginEmoteCooldown();


    const duration =
        getRandomEmoteDuration();


    emitGameEvent(
        "emote-start",
        {
            actor,

            image,

            duration
        }
    );


    GAME_RUNTIME
        .emoteTimer =
        setTimeout(
            () => {

                GAME_RUNTIME
                    .emoteTimer =
                    null;


                emitGameEvent(
                    "emote-end",
                    {
                        actor
                    }
                );
            },
            duration
        );


    return true;
}


/* =========================================================
   KONEC PARTIE
========================================================= */

async function finishGame(winner) {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status ===
            "finished"
    ) {

        return;
    }


    state.status =
        "finished";


    clearRuntimeTimers();


    const slotIndex =
        GAME_RUNTIME.slotIndex;


    const oldSlot =
        getSaveSlot(
            slotIndex
        );


    const characterId =
        oldSlot?.characterId;


    let updatedSlot;


    if (
        winner === "player"
    ) {

        updatedSlot =
            registerPlayerWin(
                slotIndex
            );

    } else {

        updatedSlot =
            registerLukyWin(
                slotIndex
            );
    }


    const achievementResult =
        registerFinishedGameForAchievements(
            {
                winner,

                characterId
            }
        );


    announceUnlockedAchievements(
        achievementResult
            .newlyUnlocked
    );


    emitGameEvent(
        "game-over",
        {
            winner,

            characterId,

            slot:
                updatedSlot,

            playerImage:
                getConfiguredPlayerEndImage(
                    characterId,
                    winner === "player"
                        ? "win"
                        : "lose"
                ),

            lukyImage:
                getConfiguredLukyEndImage(
                    winner === "luky"
                        ? "win"
                        : "lose"
                )
        }
    );


    emitStateChanged();
}


/* =========================================================
   ACHIEVEMENT EVENTY
========================================================= */

function announceUnlockedAchievements(
    definitions
) {

    if (
        !Array.isArray(
            definitions
        )
    ) {

        return;
    }


    definitions.forEach(
        (
            definition,
            index
        ) => {

            setTimeout(
                () => {

                    emitGameEvent(
                        "achievement-unlocked",
                        {
                            achievement:
                                definition
                        }
                    );
                },
                index * 700
            );
        }
    );
}


/* =========================================================
   KONEC TAHU
========================================================= */

function completeTurn() {

    const state =
        GAME_RUNTIME.state;


    if (!state) {
        return;
    }


    state.turnCount =
        normalizeNonNegativeInteger(
            state.turnCount
        ) + 1;


    state.updatedAt =
        getSaveTimestamp();


    maybeActivateYellowEvent();
}


/* =========================================================
   SAVE
========================================================= */

function saveGame() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !==
            "playing" ||
        GAME_RUNTIME.slotIndex ===
            null
    ) {

        return;
    }


    state.updatedAt =
        getSaveTimestamp();


    saveCurrentGame(
        GAME_RUNTIME.slotIndex,
        state
    );
}


/* =========================================================
   STATE EVENT
========================================================= */

function emitStateChanged() {

    emitGameEvent(
        "state-changed",
        {
            state:
                GAME_RUNTIME.state,

            slotIndex:
                GAME_RUNTIME.slotIndex
        }
    );
}


/* =========================================================
   PAUSE
========================================================= */

function pauseGame() {

    GAME_RUNTIME.paused =
        true;


    emitGameEvent(
        "game-paused",
        {}
    );
}


function resumeGame() {

    GAME_RUNTIME.paused =
        false;


    emitGameEvent(
        "game-resumed",
        {}
    );


    if (
        GAME_RUNTIME.state
            ?.turn ===
        "luky"
    ) {

        scheduleLukyTurn();
    }
}


/* =========================================================
   ULOŽIT A ODEJÍT
========================================================= */

function saveAndLeaveGame() {

    saveGame();


    clearRuntimeTimers();


    GAME_RUNTIME.paused =
        true;


    emitGameEvent(
        "game-left",
        {
            slotIndex:
                GAME_RUNTIME
                    .slotIndex
        }
    );
}


/* =========================================================
   TIMERY
========================================================= */

function clearRuntimeTimers() {

    cancelPlayerUnoTimer(
        true
    );


    if (
        GAME_RUNTIME
            .lukyUnoTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .lukyUnoTimer
        );


        GAME_RUNTIME.lukyUnoTimer =
            null;
    }


    if (
        GAME_RUNTIME
            .lukyPhraseTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .lukyPhraseTimer
        );


        GAME_RUNTIME.lukyPhraseTimer =
            null;
    }


    if (
        GAME_RUNTIME
            .emoteTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .emoteTimer
        );


        GAME_RUNTIME.emoteTimer =
            null;
    }


    GAME_RUNTIME
        .lukyUnoCatchOpen =
        false;


    GAME_RUNTIME
        .lukyTurnRunning =
        false;
}


/* =========================================================
   DEBUG
========================================================= */

function debugGameState() {

    console.log(
        "DOTS UNO game state:",
        GAME_RUNTIME.state
    );


    return GAME_RUNTIME.state;
}
