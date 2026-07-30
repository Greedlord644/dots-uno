"use strict";


/* =========================================================
   DOTS UNO
   HLAVNÍ HERNÍ ENGINE

   Řeší:
   - novou / uloženou partii
   - tahy hráče a Lukyho
   - +2 / +4 řetězce
   - Stůj řetězce
   - 0 / 7
   - Kuř!
   - UNO
   - historii partie
   - poslední akci
   - emoty
   - achievementy
   - žlutý event
   - konec partie
========================================================= */


const GAME_RUNTIME = {

    slotIndex:
        null,

    state:
        null,

    pendingSevenChoice:
        false,

    playerUnoTimer:
        null,

    playerUnoResolver:
        null,

    lukyUnoTimer:
        null,

    lukyUnoCatchOpen:
        false,

    lukyPhraseTimer:
        null,

    ambientSpeechTimer:
        null,

    ambientSpecificUsed:
        0,

    ambientUsedKeys:
        new Set(),

    yellowEventTimer:
        null,

    yellowEventHideTimer:
        null,

    emoteCooldownUntil:
        0,

    emoteTimer:
        null,

    characterReactionTimer:
        null,

    lukyEmoteSuppressedUntil:
        0,

    mildEmoteTimestamps:
        [],

    lukyJustAcceptedSkip:
        false,

    lukyTurnRunning:
        false,

    paused:
        false
};


/* =========================================================
   EVENTY
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

function startNewGame(
    slotIndex
) {

    clearRuntimeTimers();


    const slot =
        getSaveSlot(
            slotIndex
        );


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
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


    GAME_RUNTIME
        .lukyJustAcceptedSkip =
        false;


    GAME_RUNTIME
        .mildEmoteTimestamps =
        [];


    const gameNumber =
        getNextGameNumber(
            slotIndex
        );


    const deck =
        shuffleDeck(
            createDeck()
        );


    const playerHand =
        [];


    const lukyHand =
        [];


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

        drawPenalty:
            0,

        topPenaltyType:
            null,

        skipChainCount:
            0,

        pendingPlayerUno:
            false,

        pendingLukyUno:
            false,

        lukyForgotUno:
            false,

        lukyUnoSaid:
            false,

        playerUnoDeferred:
            false,

        playerUnoSaid:
            false,

        playerForcedDrawStreak:
            0,

        turnCount:
            0,

        history:
            [],

        lastAction:
            null,

        yellowEventEligible:
            shouldGameUseRegularYellowEvent(
                slotIndex,
                gameNumber
            ),

        yellowEventAvailable:
            false,

        yellowEventUsed:
            false,

        gameNumber,

        startedAt:
            getSaveTimestamp(),

        updatedAt:
            getSaveTimestamp()
    };


    GAME_RUNTIME.state =
        state;


    addHistory({
        actor:
            "system",

        type:
            "game-start",

        text:
            "Partie začala."
    });


    saveGame();


    emitGameEvent(
        "game-started",
        {
            state,

            slot
        }
    );


    triggerOpeningQuote();


    resetAmbientSpeechState();

    scheduleAmbientSpeech();

    scheduleFirstUseYellowEventIfNeeded();


    emitStateChanged();


    return state;
}


/* =========================================================
   POKRAČOVÁNÍ
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
        isSaveSlotEmpty(
            slot
        )
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

        history:
            Array.isArray(
                saved.history
            )
                ? saved.history
                : [],

        lastAction:
            saved.lastAction ||
            null,

        lukyUnoSaid:
            Boolean(
                saved.lukyUnoSaid
            ),

        playerUnoDeferred:
            Boolean(
                saved.playerUnoDeferred
            ),

        playerUnoSaid:
            Boolean(
                saved.playerUnoSaid
            ),

        playerForcedDrawStreak:
            normalizeNonNegativeInteger(
                saved.playerForcedDrawStreak
            ),

        turnCount:
            normalizeNonNegativeInteger(
                saved.turnCount
            )
    };


    GAME_RUNTIME.pendingSevenChoice =
        false;


    GAME_RUNTIME.paused =
        false;


    GAME_RUNTIME
        .lukyJustAcceptedSkip =
        false;


    GAME_RUNTIME
        .mildEmoteTimestamps =
        [];


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


    resetAmbientSpeechState();

    scheduleAmbientSpeech();

    scheduleFirstUseYellowEventIfNeeded();


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

function getInitialColor(
    card
) {

    if (
        !card ||
        isWildCard(
            card
        )
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
   HISTORIE
========================================================= */

function addHistory({
    actor = "system",
    type = "info",
    text = "",
    cards = [],
    amount = null,
    color = null,
    unoSaid = null
} = {}) {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        !GAME_CONFIG
            .history
            .enabled
    ) {

        return null;
    }


    const entry =
        createHistoryEntry({
            actor,
            type,
            text,
            cards,
            amount,
            color,
            unoSaid
        });


    const result =
        appendGameHistoryEntry(
            state,
            entry
        );


    if (result) {

        /*
            Poslední veřejná akce má popisovat hráče nebo Lukyho.
            Systémové pomocné záznamy (např. zamíchání balíčku)
            nesmí přepsat důležitou informaci v poli stavu hry.
        */

        if (
            actor === "player" ||
            actor === "luky"
        ) {

            state.lastAction = {
                ...result
            };
        }


        emitGameEvent(
            "history-changed",
            {
                entry:
                    result,

                history:
                    state.history
            }
        );
    }


    return result;
}


/* =========================================================
   JMÉNO HRÁČE
========================================================= */

function getCurrentPlayerName() {

    const slot =
        GAME_RUNTIME.slotIndex ===
            null
            ? null
            : getSaveSlot(
                GAME_RUNTIME.slotIndex
            );


    return (
        getCharacterName(
            slot?.characterId
        ) ||
        "Hráč"
    );
}


/* =========================================================
   POPIS KARTY PRO HISTORII
========================================================= */

function getHistoryCardText(
    card
) {

    if (!card) {

        return "kartu";
    }


    const color =
        getHistoryColorName(
            card.color
        );


    if (
        card.type ===
        CARD_TYPES.NUMBER
    ) {

        return `${color} ${card.value}`;
    }


    if (
        card.type ===
        CARD_TYPES.SKIP
    ) {

        return `${color} Stůj`;
    }


    if (
        card.type ===
        CARD_TYPES.REVERSE
    ) {

        return `${color} Změnu směru`;
    }


    if (
        card.type ===
        CARD_TYPES.DRAW_TWO
    ) {

        return `${color} +2`;
    }


    if (
        card.type ===
        CARD_TYPES.WILD_DRAW_FOUR
    ) {

        return "divokou +4";
    }


    if (
        card.type ===
        CARD_TYPES.WILD
    ) {

        return "divokou kartu";
    }


    return "kartu";
}


function getHistoryColorName(
    color
) {

    switch (
        color
    ) {

        case CARD_COLORS.RED:
            return "červenou";

        case CARD_COLORS.YELLOW:
            return "žlutou";

        case CARD_COLORS.GREEN:
            return "zelenou";

        case CARD_COLORS.BLUE:
            return "modrou";

        default:
            return "";
    }
}


/* =========================================================
   POPIS ZAHRANÝCH KARET
========================================================= */

function getPlayedCardsHistoryText(
    actorName,
    cards,
    chosenColor = null
) {

    if (
        !Array.isArray(
            cards
        ) ||
        cards.length === 0
    ) {

        return `${actorName} zahrál kartu.`;
    }


    const wildCard =
        cards.find(
            (card) =>
                isWildCard(
                    card
                )
        );


    if (wildCard) {

        const colorText =
            getHistoryColorName(
                chosenColor
            );


        if (colorText) {

            return `${actorName} změnil barvu na ${colorText}.`;
        }


        return `${actorName} změnil barvu.`;
    }


    if (
        cards.length === 1
    ) {

        return (
            `${actorName} zahrál ` +
            `${getHistoryCardText(cards[0])}.`
        );
    }


    return (
        `${actorName} zahrál ${cards.length}× ` +
        `${getHistoryCardText(cards[0])} – Kuř!`
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
       DOBÍRACÍ ŘETĚZEC
    ===================================================== */

    if (
        state.drawPenalty >
        0
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
       STŮJ
    ===================================================== */

    if (
        state.skipChainCount >
        0
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


function validPlayResult(
    cards
) {

    return {

        valid:
            true,

        cards,

        needsColorChoice:
            needsColorChoice(
                cards
            )
    };
}


function invalidPlay(
    message
) {

    return {

        valid:
            false,

        message,

        cards:
            [],

        needsColorChoice:
            false
    };
}


/* =========================================================
   HRÁČ ZAHRÁL KARTY
========================================================= */

async function playerPlayCards(
    cardIds,
    chosenColor = null
) {

    const validation =
        validatePlayerPlay(
            cardIds
        );


    if (
        !validation.valid
    ) {

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
        validation.needsColorChoice &&
        !isPlayableColor(
            chosenColor
        )
    ) {

        return {

            valid:
                false,

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


    state.playerUnoDeferred =
        false;


    if (
        state.playerHand.length !==
        1
    ) {

        state.playerUnoSaid =
            false;
    }


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


    addHistory({
        actor:
            "player",

        type:
            "play",

        text:
            getPlayedCardsHistoryText(
                getCurrentPlayerName(),
                cards,
                state.currentColor
            ),

        cards,

        color:
            state.currentColor
    });

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

            valid:
                true,

            finished:
                true
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
            valid:
                true
        };
    }


    /* =====================================================
       STŮJ
    ===================================================== */

    if (
        effect.type ===
        CARD_TYPES.SKIP
    ) {

        if (
            previousSkipChain >
            0
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
            valid:
                true
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


        maybeReactToBadSwap(
            "player"
        );


        addHistory({
            actor:
                "system",

            type:
                "hand-swap",

            text:
                "Hráči si vyměnili karty kvůli nule."
        });


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
    ===================================================== */

    if (
        isSevenCard(
            cards[0]
        )
    ) {

        GAME_RUNTIME
            .pendingSevenChoice =
            true;


        state.playerUnoDeferred =
            state.playerHand.length ===
            1;


        saveGame();


        emitStateChanged();


        emitGameEvent(
            "seven-choice-requested",
            {}
        );


        return {

            valid:
                true,

            pendingSevenChoice:
                true
        };
    }


    /* =====================================================
       BĚŽNÁ KARTA / REVERSE
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
        valid:
            true
    };
}


/* =========================================================
   SEDMIČKA – HRÁČOVO ROZHODNUTÍ
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


    emitGameEvent(
        "luky-thinking-end",
        {}
    );


    if (wantsSwap) {

        swapHands();


        maybeReactToBadSwap(
            "player"
        );


        addHistory({
            actor:
                "player",

            type:
                "seven-swap",

            text:
                `${getCurrentPlayerName()} si vyměnil karty s Lukym.`
        });


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

    } else {

        addHistory({
            actor:
                "player",

            type:
                "seven-keep",

            text:
                `${getCurrentPlayerName()} si ponechal svoje karty.`
        });
    }


    state.playerUnoDeferred =
        false;


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


    if (
        state.drawPenalty >
        0
    ) {

        const amount =
            state.drawPenalty;


        drawCards(
            "player",
            amount
        );


        addHistory({
            actor:
                "player",

            type:
                "draw",

            text:
                `${getCurrentPlayerName()} si lízl ${formatHistoryCardAmount(amount)}.`,

            amount
        });


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


        state.turn =
            "luky";


        completeTurn();


        saveGame();


        emitStateChanged();


        if (
            amount >=
            4
        ) {

            forceLukyGrinEmote();

            maybeReactToBadDraw(
                "player",
                amount
            );

        } else {

            maybeTriggerStrongSituationEmote();
        }


        scheduleLukyTurn();


        return true;
    }


    if (
        state.skipChainCount >
        0
    ) {

        return false;
    }


    drawCards(
        "player",
        1
    );


    state.playerForcedDrawStreak +=
        1;


    addHistory({
        actor:
            "player",

        type:
            "draw",

        text:
            `${getCurrentPlayerName()} si lízl kartu.`,

        amount:
            1
    });


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
   ČESKÝ POČET KARET DO HISTORIE
========================================================= */

function formatHistoryCardAmount(
    amount
) {

    if (
        amount ===
        1
    ) {

        return "kartu";
    }


    if (
        amount >= 2 &&
        amount <= 4
    ) {

        return `${amount} karty`;
    }


    return `${amount} karet`;
}


/* =========================================================
   HRÁČ PŘIJME STŮJ
========================================================= */

function playerAcceptSkip() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !==
            "playing" ||
        state.turn !==
            "player" ||
        state.skipChainCount <=
            0 ||
        GAME_RUNTIME.paused
    ) {

        return false;
    }


    const lukyWonSkipExchange =
        state.skipChainCount >=
        2;


    addHistory({
        actor:
            "player",

        type:
            "skip",

        text:
            `${getCurrentPlayerName()} stojí.`
    });


    clearSkipChain();


    if (
        lukyWonSkipExchange
    ) {

        forceLukyGrinEmote();

        emitDanyBadSituationQuote();
    }


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
        actor ===
            "player"
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

function handleSkipPlay(
    actor
) {

    const state =
        GAME_RUNTIME.state;


    state.skipChainCount +=
        1;


    state.drawPenalty =
        0;


    state.topPenaltyType =
        null;


    state.turn =
        actor ===
            "player"
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
        actor ===
            "luky"
            ? getSkipCounterQuote(
                counterNumber
            )
            : getPlayerSkipCounterQuote(
                counterNumber
            );


    emitGameEvent(
        actor ===
            "luky"
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


    const oldPlayerHand =
        state.playerHand;


    state.playerHand =
        sortHand(
            state.lukyHand
        );


    state.lukyHand =
        sortHand(
            oldPlayerHand
        );


    resetLukyUnoState();
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
        actor ===
            "luky"
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
        actor ===
        "luky"
    ) {

        state.lukyHand =
            sortHand(
                state.lukyHand
            );


        if (
            state.lukyHand.length !==
            1
        ) {

            resetLukyUnoState();
        }

    } else {

        state.playerHand =
            sortHand(
                state.playerHand
            );


        if (
            state.playerHand.length !==
            1
        ) {

            state.pendingPlayerUno =
                false;


            state.playerUnoDeferred =
                false;


            state.playerUnoSaid =
                false;


            cancelPlayerUnoTimer(
                true
            );
        }
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


    const topCard =
        state.discardPile.pop();


    state.drawPile =
        shuffleDeck(
            state.discardPile
        );


    state.discardPile =
        [
            topCard
        ];


    addHistory({
        actor:
            "system",

        type:
            "deck-recycled",

        text:
            "Odhazovací balíček byl zamíchán do nového dobíracího balíčku."
    });


    emitGameEvent(
        "deck-recycled",
        {}
    );
}


/* =========================================================
   ODHOD
========================================================= */

function pushCardsToDiscard(
    cards
) {

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
            cards.length -
            1
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


function isPlayableColor(
    color
) {

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
        state.status !==
            "playing" ||
        state.turn !==
            "luky" ||
        GAME_RUNTIME.paused ||
        GAME_RUNTIME
            .lukyTurnRunning ||
        state.pendingPlayerUno ||
        state.playerUnoDeferred
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
        state.turn !==
            "luky" ||
        state.status !==
            "playing"
    ) {

        return;
    }


    GAME_RUNTIME
        .lukyTurnRunning =
        true;


    try {

        const fastRepeatedSkipResponse =
            Boolean(
                GAME_RUNTIME
                    .lukyJustAcceptedSkip &&
                state.skipChainCount >
                    0
            );


        if (
            fastRepeatedSkipResponse
        ) {

            await waitForFastLukySkipResponse();

        } else {

            await waitForLukyThinking({

                gameState:
                    state,

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
            });
        }


        if (
            GAME_RUNTIME.paused ||
            state.status !==
                "playing" ||
            state.turn !==
                "luky"
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

        GAME_RUNTIME
            .lukyTurnRunning =
            false;
    }
}


function waitForFastLukySkipResponse() {

    const delay =
        300 +
        Math.floor(
            Math.random() *
            701
        );


    return new Promise(
        (resolve) => {

            setTimeout(
                resolve,
                delay
            );
        }
    );
}


/* =========================================================
   LUKYHO ROZHODNUTÍ
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


    if (
        decision.action ===
            "draw" &&
        state.drawPenalty >
            0
    ) {

        const amount =
            state.drawPenalty;


        drawCards(
            "luky",
            amount
        );


        addHistory({
            actor:
                "luky",

            type:
                "draw",

            text:
                `Luky si lízl ${formatHistoryCardAmount(amount)}.`,

            amount
        });


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


        maybeReactToBadDraw(
            "luky",
            amount
        );


        clearDrawPenalty();


        GAME_RUNTIME
            .lukyJustAcceptedSkip =
            false;


        state.turn =
            "player";


        completeTurn();


        saveGame();


        emitStateChanged();


        return;
    }


    if (
        decision.action ===
        "skip"
    ) {

        const lukyLostSkipExchange =
            state.skipChainCount >=
            2;


        addHistory({
            actor:
                "luky",

            type:
                "skip",

            text:
                "Luky stojí."
        });


        clearSkipChain();


        if (
            lukyLostSkipExchange
        ) {

            emitLukyBadSituationQuote();
        }


        GAME_RUNTIME
            .lukyJustAcceptedSkip =
            true;


        state.turn =
            "player";


        completeTurn();


        saveGame();


        emitStateChanged();


        return;
    }


    if (
        decision.action ===
        "draw"
    ) {

        drawCards(
            "luky",
            1
        );


        addHistory({
            actor:
                "luky",

            type:
                "draw",

            text:
                "Luky si lízl kartu.",

            amount:
                1
        });


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


        GAME_RUNTIME
            .lukyJustAcceptedSkip =
            false;


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


    GAME_RUNTIME
        .lukyJustAcceptedSkip =
        false;


    resetLukyUnoState();


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


    addHistory({
        actor:
            "luky",

        type:
            "play",

        text:
            getPlayedCardsHistoryText(
                "Luky",
                cards,
                state.currentColor
            ),

        cards,

        color:
            state.currentColor
    });


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


    if (
        state.lukyHand.length ===
        0
    ) {

        await finishGame(
            "luky"
        );


        return;
    }


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


    if (
        effect.type ===
        CARD_TYPES.SKIP
    ) {

        if (
            previousSkipChain >
            0
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


    if (
        isZeroCard(
            cards[0]
        )
    ) {

        swapHands();


        maybeReactToBadSwap(
            "luky"
        );


        addHistory({
            actor:
                "system",

            type:
                "hand-swap",

            text:
                "Hráči si vyměnili karty kvůli nule."
        });


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


            maybeReactToBadSwap(
                "luky"
            );


            addHistory({
                actor:
                    "luky",

                type:
                    "seven-swap",

                text:
                    "Luky si vyměnil karty s hráčem."
            });


            emitGameEvent(
                "hands-swapped",
                {
                    reason:
                        "seven",

                    actor:
                        "luky"
                }
            );

        } else {

            addHistory({
                actor:
                    "luky",

                type:
                    "seven-keep",

                text:
                    "Luky si ponechal svoje karty."
            });
        }
    }


    state.turn =
        "player";


    completeTurn();


    handleLukyUnoAfterPlay();


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
        !state
    ) {

        return;
    }


    if (
        state.playerUnoDeferred
    ) {

        return;
    }


    if (
        state.playerHand.length !==
        1
    ) {

        state.pendingPlayerUno =
            false;


        state.playerUnoSaid =
            false;


        cancelPlayerUnoTimer(
            true
        );


        return;
    }


    /*
        Pokud už byl tap na UNO zaregistrován,
        nesmí se následně otevřít nové penalizační
        okno ani hráče potrestat.
    */

    if (
        state.playerUnoSaid
    ) {

        state.pendingPlayerUno =
            false;


        cancelPlayerUnoTimer(
            true
        );


        return;
    }


    state.pendingPlayerUno =
        true;


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
                            !state.pendingPlayerUno ||
                            state.playerUnoSaid
                        ) {

                            state.pendingPlayerUno =
                                false;


                            resolve();

                            return;
                        }


                        state.pendingPlayerUno =
                            false;


                        const penalty =
                            GAME_CONFIG
                                .playerUno
                                .missedPenaltyCards;


                        const playerName =
                            getCurrentPlayerName();


                        const missedUnoText =
                            `${playerName} neřekl UNO a proto si líže ${formatHistoryCardAmount(penalty)}.`;


                        drawCards(
                            "player",
                            penalty
                        );


                        state.playerUnoSaid =
                            false;


                        addHistory({
                            actor:
                                "player",

                            type:
                                "uno-missed",

                            text:
                                missedUnoText,

                            amount:
                                penalty,

                            unoSaid:
                                false
                        });


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
                                penalty,

                                playerName,

                                text:
                                    missedUnoText
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


    if (
        !state ||
        state.status !==
            "playing"
    ) {

        return false;
    }


    if (
        state.playerHand.length ===
        1
    ) {

        /*
            Jeden úspěšný tap je definitivní.
            Opakovaný event z touch/click už nic
            dalšího neprovede, ale stále vrací true.
        */

        if (
            state.playerUnoSaid
        ) {

            return true;
        }


        state.playerUnoSaid =
            true;


        state.pendingPlayerUno =
            false;


        emitGameEvent(
            "luky-thinking-end",
            {}
        );


        addHistory({
            actor:
                "player",

            type:
                "uno",

            text:
                `${getCurrentPlayerName()} řekl UNO!`,

            unoSaid:
                true
        });


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


    if (
        state.playerHand.length >=
        2
    ) {

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
    }


    return false;
}


/* =========================================================
   PLAYER UNO TIMER
========================================================= */

function cancelPlayerUnoTimer(
    resolvePromise = false
) {

    if (
        GAME_RUNTIME
            .playerUnoTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .playerUnoTimer
        );


        GAME_RUNTIME
            .playerUnoTimer =
            null;
    }


    if (
        resolvePromise &&
        GAME_RUNTIME
            .playerUnoResolver
    ) {

        const resolver =
            GAME_RUNTIME
                .playerUnoResolver;


        GAME_RUNTIME
            .playerUnoResolver =
            null;


        resolver();
    }
}


/* =========================================================
   RESET LUKY UNO
========================================================= */

function resetLukyUnoState() {

    const state =
        GAME_RUNTIME.state;


    if (!state) {

        return;
    }


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


    state.pendingLukyUno =
        false;


    state.lukyForgotUno =
        false;


    state.lukyUnoSaid =
        false;


    GAME_RUNTIME
        .lukyUnoCatchOpen =
        false;
}


/* =========================================================
   LUKYHO UNO
========================================================= */

function registerLukyUnoAnnouncement() {

    const state =
        GAME_RUNTIME.state;


    const previousPlayText =
        (
            state?.lastAction?.actor ===
                "luky" &&
            state?.lastAction?.type ===
                "play"
        )
            ? state.lastAction.text
            : "";


    const entry =
        addHistory({
            actor:
                "luky",

            type:
                "uno",

            text:
                "Luky řekl UNO!",

            unoSaid:
                true
        });


    if (
        previousPlayText &&
        entry
    ) {

        state.lastAction = {
            ...entry,

            text:
                `${previousPlayText} Luky řekl UNO!`
        };
    }


    return entry;
}


function handleLukyUnoAfterPlay() {

    const state =
        GAME_RUNTIME.state;


    if (
        state.lukyHand.length !==
        1
    ) {

        resetLukyUnoState();


        return;
    }


    const forgot =
        shouldLukyForgetUno();


    state.lukyUnoSaid =
        false;


    if (forgot) {

        state.pendingLukyUno =
            true;


        state.lukyForgotUno =
            true;


        GAME_RUNTIME
            .lukyUnoCatchOpen =
            true;


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


        addHistory({
            actor:
                "system",

            type:
                "luky-one-card",

            text:
                "Lukymu zbývá jedna karta."
        });


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


    state.pendingLukyUno =
        false;


    state.lukyForgotUno =
        false;


    state.lukyUnoSaid =
        true;


    GAME_RUNTIME
        .lukyUnoCatchOpen =
        false;


    registerLukyUnoAnnouncement();


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
   LUKY SI VZPOMENE NA UNO
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


    state.lukyUnoSaid =
        true;


    GAME_RUNTIME
        .lukyUnoCatchOpen =
        false;


    registerLukyUnoAnnouncement();


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
        state.lukyForgotUno &&
        state.lukyHand.length ===
            1 &&
        !state.lukyUnoSaid
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


        state.lukyUnoSaid =
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


        addHistory({
            actor:
                "player",

            type:
                "uno-catch",

            text:
                `${getCurrentPlayerName()} nachytal Lukyho, že neřekl UNO.`,

            unoSaid:
                false
        });


        drawCards(
            "luky",
            GAME_CONFIG
                .lukyUno
                .caughtPenaltyCards
        );


        addHistory({
            actor:
                "luky",

            type:
                "uno-penalty",

            text:
                "Luky si za neřečené UNO lízl 2 karty.",

            amount:
                GAME_CONFIG
                    .lukyUno
                    .caughtPenaltyCards,

            unoSaid:
                false
        });


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


        emitGameEvent(
            "luky-speech",
            {
                text:
                    getLukyCaughtUnoPenaltyQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .defaultDurationMs
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


    if (
        state.lukyHand.length ===
            1 &&
        state.lukyUnoSaid
    ) {

        emitGameEvent(
            "luky-speech",
            {
                text:
                    getLukyUnoAlreadySaidQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .defaultDurationMs
            }
        );


        return false;
    }


    if (
        state.lukyHand.length >
        1
    ) {

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
        state.playerUnoDeferred
    ) {

        return;
    }


    if (
        state.pendingPlayerUno &&
        state.playerHand.length ===
            1 &&
        !state.playerUnoSaid
    ) {

        state.pendingPlayerUno =
            false;


        handlePlayerUnoAfterPlay();
    }


    if (
        state.pendingLukyUno &&
        state.lukyForgotUno &&
        !state.lukyUnoSaid &&
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
   PRVNÍ POUŽITÍ ŽLUTÉHO EVENTU
========================================================= */

function getYellowFirstUseStorageKey(
    slotIndex
) {

    const slot =
        getSaveSlot(
            slotIndex
        );


    return (
        `${GAME_CONFIG.storage.rootKey}.yellowFirstUse.` +
        `${slotIndex}.` +
        `${slot?.createdAt || "unknown"}`
    );
}


function hasUsedYellowEventInSlot(
    slotIndex
) {

    if (
        slotIndex ===
        null ||
        slotIndex ===
        undefined
    ) {

        return false;
    }


    try {

        return (
            localStorage.getItem(
                getYellowFirstUseStorageKey(
                    slotIndex
                )
            ) ===
            "1"
        );

    } catch (error) {

        console.warn(
            "Nepodařilo se načíst stav prvního yellow eventu.",
            error
        );


        return false;
    }
}


function markYellowEventUsedInSlot(
    slotIndex
) {

    if (
        slotIndex ===
        null ||
        slotIndex ===
        undefined
    ) {

        return;
    }


    try {

        localStorage.setItem(
            getYellowFirstUseStorageKey(
                slotIndex
            ),
            "1"
        );

    } catch (error) {

        console.warn(
            "Nepodařilo se uložit stav prvního yellow eventu.",
            error
        );
    }
}


function shouldGameUseRegularYellowEvent(
    slotIndex,
    gameNumber
) {

    if (
        !GAME_CONFIG
            .yellowEvent
            .enabled
    ) {

        return false;
    }


    if (
        GAME_CONFIG
            .yellowEvent
            .firstUseGuaranteed &&
        !hasUsedYellowEventInSlot(
            slotIndex
        )
    ) {

        return false;
    }


    return (
        gameNumber %
        GAME_CONFIG
            .yellowEvent
            .everyNthGame
    ) === 0;
}


/* =========================================================
   MŮŽE SE TEĎ NABÍDNOUT ŽLUTÝ EVENT?
========================================================= */

function canOfferYellowEventNow(
    state = GAME_RUNTIME.state
) {

    return Boolean(

        state &&

        state.status ===
            "playing" &&

        state.turn ===
            "luky" &&

        !GAME_RUNTIME.paused &&

        !GAME_RUNTIME
            .pendingSevenChoice &&

        !state.pendingPlayerUno &&

        !state.playerUnoDeferred &&

        !state.pendingLukyUno
    );
}


/* =========================================================
   ZOBRAZENÍ ŽLUTÉHO EVENTU
========================================================= */

function activateYellowEvent({
    firstUse = false,
    duration = null
} = {}) {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !==
            "playing" ||
        state.yellowEventUsed ||
        state.yellowEventAvailable ||
        !canOfferYellowEventNow(
            state
        )
    ) {

        return false;
    }


    state.yellowEventAvailable =
        true;


    emitGameEvent(
        "yellow-event-available",
        {
            firstUse,

            duration
        }
    );


    saveGame();


    emitStateChanged();


    if (
        firstUse &&
        Number(duration) >
            0
    ) {

        if (
            GAME_RUNTIME
                .yellowEventHideTimer
        ) {

            clearTimeout(
                GAME_RUNTIME
                    .yellowEventHideTimer
            );
        }


        GAME_RUNTIME
            .yellowEventHideTimer =
            setTimeout(
                () => {

                    GAME_RUNTIME
                        .yellowEventHideTimer =
                        null;


                    const activeState =
                        GAME_RUNTIME.state;


                    if (
                        !activeState ||
                        activeState.status !==
                            "playing" ||
                        activeState.yellowEventUsed
                    ) {

                        return;
                    }


                    activeState
                        .yellowEventAvailable =
                        false;


                    saveGame();


                    emitStateChanged();
                },
                duration
            );
    }


    return true;
}


/* =========================================================
   PRVNÍ GARANTOVANÝ ŽLUTÝ EVENT
========================================================= */

function scheduleFirstUseYellowEventIfNeeded() {

    clearYellowEventTimers();


    const state =
        GAME_RUNTIME.state;


    const slotIndex =
        GAME_RUNTIME.slotIndex;


    if (
        !state ||
        state.status !==
            "playing" ||
        slotIndex ===
            null ||
        !GAME_CONFIG
            .yellowEvent
            .enabled ||
        !GAME_CONFIG
            .yellowEvent
            .firstUseGuaranteed ||
        hasUsedYellowEventInSlot(
            slotIndex
        ) ||
        state.yellowEventUsed
    ) {

        return;
    }


    const delay =
        getRandomFirstYellowEventDelay();


    GAME_RUNTIME
        .yellowEventTimer =
        setTimeout(
            tryActivateFirstUseYellowEvent,
            delay
        );
}


function tryActivateFirstUseYellowEvent() {

    GAME_RUNTIME
        .yellowEventTimer =
        null;


    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !==
            "playing" ||
        state.yellowEventUsed ||
        hasUsedYellowEventInSlot(
            GAME_RUNTIME.slotIndex
        )
    ) {

        return;
    }


    if (
        !canOfferYellowEventNow(
            state
        )
    ) {

        GAME_RUNTIME
            .yellowEventTimer =
            setTimeout(
                tryActivateFirstUseYellowEvent,
                700
            );


        return;
    }


    activateYellowEvent({
        firstUse:
            true,

        duration:
            GAME_CONFIG
                .yellowEvent
                .firstUseWindowMs
    });
}


function clearYellowEventTimers() {

    if (
        GAME_RUNTIME
            .yellowEventTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .yellowEventTimer
        );


        GAME_RUNTIME
            .yellowEventTimer =
            null;
    }


    if (
        GAME_RUNTIME
            .yellowEventHideTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .yellowEventHideTimer
        );


        GAME_RUNTIME
            .yellowEventHideTimer =
            null;
    }
}


/* =========================================================
   BĚŽNÝ ŽLUTÝ EVENT
========================================================= */

function maybeActivateYellowEvent() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        !state.yellowEventEligible ||
        state.yellowEventAvailable ||
        state.yellowEventUsed ||
        !canOfferYellowEventNow(
            state
        )
    ) {

        return;
    }


    if (
        state.turnCount <
        4
    ) {

        return;
    }


    if (
        randomChance(
            0.12
        )
    ) {

        activateYellowEvent({
            firstUse:
                false
        });
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


    clearYellowEventTimers();


    state.yellowEventUsed =
        true;


    state.yellowEventAvailable =
        false;


    markYellowEventUsedInSlot(
        GAME_RUNTIME.slotIndex
    );


    const hasYellow =
        lukyHasYellowCard(
            state
        );


    addHistory({
        actor:
            "player",

        type:
            "yellow-question",

        text:
            `${getCurrentPlayerName()} se zeptal: „Má někdo žlutou?“`
    });


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


    addHistory({
        actor:
            "luky",

        type:
            "yellow-answer",

        text:
            hasYellow
                ? "Luky odpověděl: „Já.“"
                : "Luky mlčel."
    });


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
   OPENING HLÁŠKA
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


    const normalizedQuote =
        normalizeQuote(
            selection.quote
        );


    emitGameEvent(
        "luky-opening-quote",
        {
            quote:
                normalizedQuote
        }
    );


    scheduleQuoteCharacterReaction(
        normalizedQuote,
        {
            delayMs:
                normalizedQuote?.type ===
                    "sequence"
                    ? (
                        Math.min(
                            3200,
                            GAME_CONFIG
                                .speech
                                .openingDurationMs
                        ) +
                        2000
                    )
                    : 2000
        }
    );
}


/* =========================================================
   PRŮBĚŽNÉ LUKYHO HLÁŠKY
========================================================= */

function resetAmbientSpeechState() {

    if (
        GAME_RUNTIME
            .ambientSpeechTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .ambientSpeechTimer
        );
    }


    GAME_RUNTIME
        .ambientSpeechTimer =
        null;


    GAME_RUNTIME
        .ambientSpecificUsed =
        0;


    GAME_RUNTIME
        .ambientUsedKeys =
        new Set();
}


function scheduleAmbientSpeech() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !==
            "playing" ||
        !GAME_CONFIG
            .speech
            .ambientEnabled
    ) {

        return;
    }


    if (
        GAME_RUNTIME
            .ambientSpeechTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .ambientSpeechTimer
        );
    }


    GAME_RUNTIME
        .ambientSpeechTimer =
        setTimeout(
            () => {

                GAME_RUNTIME
                    .ambientSpeechTimer =
                    null;


                triggerAmbientSpeech();


                scheduleAmbientSpeech();
            },
            getRandomAmbientSpeechDelay()
        );
}


function triggerAmbientSpeech() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !==
            "playing" ||
        GAME_RUNTIME.paused
    ) {

        return false;
    }


    if (
        state.pendingPlayerUno ||
        state.pendingLukyUno ||
        state.skipChainCount >
            0 ||
        state.drawPenalty >
            0 ||
        GAME_RUNTIME
            .pendingSevenChoice
    ) {

        return false;
    }


    const slot =
        getSaveSlot(
            GAME_RUNTIME.slotIndex
        );


    if (!slot) {

        return false;
    }


    const specificQuotes =
        getCharacterOpeningQuotes(
            slot.characterId
        );


    const generalQuotes =
        getGeneralOpeningQuotes();


    let candidates =
        [];


    if (
        GAME_RUNTIME
            .ambientSpecificUsed <
        GAME_CONFIG
            .speech
            .specificAmbientMaxPerGame &&
        specificQuotes.length >
            0
    ) {

        candidates =
            specificQuotes.map(
                (quote, index) => ({
                    type:
                        "specific",

                    key:
                        `specific-${slot.characterId}-${index}`,

                    quote
                })
            );

    } else {

        candidates =
            generalQuotes.map(
                (text, index) => ({
                    type:
                        "general",

                    key:
                        `general-${index}`,

                    quote: {
                        type:
                            "single",

                        text
                    }
                })
            );
    }


    const unused =
        candidates.filter(
            (candidate) =>
                !GAME_RUNTIME
                    .ambientUsedKeys
                    .has(
                        candidate.key
                    )
        );


    const pool =
        unused.length >
            0
            ? unused
            : candidates;


    if (
        pool.length ===
        0
    ) {

        return false;
    }


    const selected =
        pool[
            randomInteger(
                0,
                pool.length - 1
            )
        ];


    const normalized =
        normalizeQuote(
            selected.quote
        );


    const text =
        ambientQuoteToText(
            normalized
        );


    if (!text) {

        return false;
    }


    GAME_RUNTIME
        .ambientUsedKeys
        .add(
            selected.key
        );


    if (
        selected.type ===
        "specific"
    ) {

        GAME_RUNTIME
            .ambientSpecificUsed +=
            1;
    }


    emitGameEvent(
        "luky-speech",
        {
            text,

            duration:
                GAME_CONFIG
                    .speech
                    .defaultDurationMs,

            ambient:
                true
        }
    );


    scheduleQuoteCharacterReaction(
        normalized,
        {
            delayMs:
                2000
        }
    );


    return true;
}


function ambientQuoteToText(
    quote
) {

    if (!quote) {

        return "";
    }


    if (
        quote.type ===
        "single"
    ) {

        return quote.text ||
            "";
    }


    if (
        quote.type ===
            "sequence" &&
        Array.isArray(
            quote.lines
        )
    ) {

        return quote.lines
            .filter(
                Boolean
            )
            .join(
                " "
            );
    }


    return "";
}


/* =========================================================
   REAKCE NA SILNOU PENALIZACI OD HRÁČE
========================================================= */

function isSlipknotClownQuote(
    quote
) {

    const normalized =
        normalizeQuote(
            quote
        );


    const text =
        ambientQuoteToText(
            normalized
        )
            .toLocaleLowerCase(
                "cs-CZ"
            );


    return (
        text.includes(
            "slipknot"
        ) &&
        text.includes(
            "klaun"
        )
    );
}


function scheduleQuoteCharacterReaction(
    quote,
    {
        delayMs = 2000
    } = {}
) {

    const slot =
        getSaveSlot(
            GAME_RUNTIME.slotIndex
        );


    if (
        !slot ||
        slot.characterId !==
            "96" ||
        !isSlipknotClownQuote(
            quote
        )
    ) {

        return false;
    }


    if (
        GAME_RUNTIME
            .characterReactionTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .characterReactionTimer
        );
    }


    GAME_RUNTIME
        .characterReactionTimer =
        setTimeout(
            () => {

                GAME_RUNTIME
                    .characterReactionTimer =
                    null;


                const state =
                    GAME_RUNTIME.state;


                const currentSlot =
                    GAME_RUNTIME.slotIndex ===
                        null
                        ? null
                        : getSaveSlot(
                            GAME_RUNTIME.slotIndex
                        );


                if (
                    !state ||
                    state.status !==
                        "playing" ||
                    currentSlot?.characterId !==
                        "96"
                ) {

                    return;
                }


                showTemporaryEmote(
                    "player",
                    getConfiguredCharacterEmote(
                        "96",
                        "angry"
                    ),
                    {
                        force:
                            true
                    }
                );
            },
            Math.max(
                0,
                Number(
                    delayMs
                ) ||
                0
            )
        );


    return true;
}


/* =========================================================
   REAKCE NA SILNOU PENALIZACI OD HRÁČE
========================================================= */

function maybeTriggerHeavyDrawQuote(
    amount
) {

    if (
        amount <
        4
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


    if (
        slot.characterId ===
            "96" &&
        /^PAVLE+/i.test(
            text.trim()
        )
    ) {

        GAME_RUNTIME
            .lukyEmoteSuppressedUntil =
            Math.max(
                GAME_RUNTIME
                    .lukyEmoteSuppressedUntil,
                Date.now() +
                    GAME_CONFIG
                        .speech
                        .defaultDurationMs +
                    250
            );
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
   SPECIÁLNÍ SITUAČNÍ HLÁŠKY – DANY / LUKY
========================================================= */

function isDanyCharacter() {

    const slot =
        getSaveSlot(
            GAME_RUNTIME.slotIndex
        );


    return (
        slot?.characterId ===
        "dany"
    );
}


function emitDanyBadSituationQuote() {

    if (
        !isDanyCharacter()
    ) {

        return false;
    }


    const quote =
        getDanyBadSituationQuote();


    if (
        !quote ||
        quote.type !==
            "sequence" ||
        !Array.isArray(
            quote.lines
        ) ||
        quote.lines.length ===
            0
    ) {

        return false;
    }


    const lines =
        quote.lines
            .filter(
                Boolean
            );


    if (
        lines.length ===
        0
    ) {

        return false;
    }


    emitGameEvent(
        "player-speech",
        {
            text:
                lines[0],

            duration:
                GAME_CONFIG
                    .speech
                    .defaultDurationMs,

            priority:
                "character"
        }
    );


    if (
        lines.length >
        1
    ) {

        setTimeout(
            () => {

                if (
                    !GAME_RUNTIME.state
                ) {

                    return;
                }


                emitGameEvent(
                    "player-speech",
                    {
                        text:
                            lines[1],

                        duration:
                            GAME_CONFIG
                                .speech
                                .defaultDurationMs,

                        priority:
                            "character"
                    }
                );
            },
            3200
        );
    }


    return true;
}


function emitLukyBadSituationQuote() {

    const text =
        getLukyBadSituationQuote();


    if (!text) {

        return false;
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


    return true;
}


function maybeReactToBadDraw(
    actor,
    amount
) {

    if (
        amount <
        4
    ) {

        return false;
    }


    return actor ===
        "player"
        ? emitDanyBadSituationQuote()
        : emitLukyBadSituationQuote();
}


function maybeReactToBadSwap(
    swapActor
) {

    const state =
        GAME_RUNTIME.state;


    if (!state) {

        return false;
    }


    if (
        swapActor ===
            "luky" &&
        state.playerHand.length >
            7
    ) {

        return emitDanyBadSituationQuote();
    }


    if (
        swapActor ===
            "player" &&
        state.lukyHand.length >
            7
    ) {

        return emitLukyBadSituationQuote();
    }


    return false;
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


function canUseLukyMildEmoteNow() {

    const windowStart =
        Date.now() -
        120000;


    GAME_RUNTIME
        .mildEmoteTimestamps =
        GAME_RUNTIME
            .mildEmoteTimestamps
            .filter(
                (timestamp) =>
                    timestamp >=
                    windowStart
            );


    return (
        GAME_RUNTIME
            .mildEmoteTimestamps
            .length <
        2
    );
}


function registerLukyMildEmoteUse() {

    GAME_RUNTIME
        .mildEmoteTimestamps
        .push(
            Date.now()
        );
}


function forceLukyGrinEmote() {

    return showTemporaryEmote(
        "luky",
        getConfiguredLukyEmote(
            "grin"
        ),
        {
            force:
                true
        }
    );
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
            canUseLukyMildEmoteNow() &&
            randomChance(
                0.5
            )
        ) {

            const shown =
                showTemporaryEmote(
                    "luky",
                    getConfiguredLukyEmote(
                        "mild"
                    )
                );


            if (shown) {

                registerLukyMildEmoteUse();
            }

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


    if (
        !canUseLukyMildEmoteNow()
    ) {

        return;
    }


    const shown =
        showTemporaryEmote(
            "luky",
            getConfiguredLukyEmote(
                "mild"
            )
        );


    if (shown) {

        registerLukyMildEmoteUse();
    }
}


/* =========================================================
   LUKY VÝRAZNĚ VEDE
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
   HRÁČ NUCENĚ LÍŽE
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
    image,
    {
        force = false
    } = {}
) {

    if (
        !image ||
        (
            actor ===
                "luky" &&
            Date.now() <
                GAME_RUNTIME
                    .lukyEmoteSuppressedUntil
        ) ||
        (
            !force &&
            isEmoteCooldownActive()
        )
    ) {

        return false;
    }


    if (
        GAME_RUNTIME
            .emoteTimer
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

async function finishGame(
    winner
) {

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


    if (
        winner ===
        "player"
    ) {

        addHistory({
            actor:
                "player",

            type:
                "win",

            text:
                `${getCurrentPlayerName()} vyhrál partii.`
        });

    } else {

        addHistory({
            actor:
                "luky",

            type:
                "win",

            text:
                "Luky vyhrál partii."
        });
    }


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
        winner ===
        "player"
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


    emitStateChanged();


    /*
        Game-over event posíláme až po finálním state-changed.
        UI tak vítěznou obrazovku otevře jako poslední krok
        a následný render ji už nepřekryje.
    */

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
                    winner ===
                        "player"
                        ? "win"
                        : "lose"
                ),

            lukyImage:
                getConfiguredLukyEndImage(
                    winner ===
                        "luky"
                        ? "win"
                        : "lose"
                ),

            history:
                state.history,

            lukyDefeatQuote:
                winner ===
                    "player"
                    ? getLukyDefeatQuote()
                    : null
        }
    );


    if (
        winner ===
        "player"
    ) {

        emitGameEvent(
            "luky-speech",
            {
                text:
                    getLukyDefeatQuote(),

                duration:
                    GAME_CONFIG
                        .speech
                        .defaultDurationMs,

                priority:
                    "game-over"
            }
        );
    }
}


/* =========================================================
   VZDÁT SE
========================================================= */

async function surrenderGame() {

    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !==
            "playing"
    ) {

        return false;
    }


    addHistory({
        actor:
            "player",

        type:
            "surrender",

        text:
            `${getCurrentPlayerName()} se vzdal.`
    });


    await finishGame(
        "luky"
    );


    return true;
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
                index *
                700
            );
        }
    );
}


/* =========================================================
   DOKONČENÍ TAHU
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
        ) +
        1;


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


        GAME_RUNTIME
            .lukyUnoTimer =
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


        GAME_RUNTIME
            .lukyPhraseTimer =
            null;
    }


    if (
        GAME_RUNTIME
            .ambientSpeechTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .ambientSpeechTimer
        );


        GAME_RUNTIME
            .ambientSpeechTimer =
            null;
    }


    clearYellowEventTimers();


    if (
        GAME_RUNTIME
            .emoteTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .emoteTimer
        );


        GAME_RUNTIME
            .emoteTimer =
            null;
    }


    if (
        GAME_RUNTIME
            .characterReactionTimer
    ) {

        clearTimeout(
            GAME_RUNTIME
                .characterReactionTimer
        );


        GAME_RUNTIME
            .characterReactionTimer =
            null;
    }


    GAME_RUNTIME
        .lukyEmoteSuppressedUntil =
        0;


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
