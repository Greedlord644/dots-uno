"use strict";


/* =========================================================
   DOTS UNO
   HLAVNÍ HERNÍ ENGINE

   Řeší:
   - vytvoření partie
   - rozdání 7 karet
   - tah hráče / Lukyho
   - dobírání
   - +2 / +4 řetězce
   - Stůj řetězce
   - Změnu směru
   - 0
   - 7
   - Kuř!
   - výběr barvy
   - UNO hráče
   - Lukyho UNO + zapomenutí
   - win / lose
   - W/L
   - achievementy
   - speciální žlutý event
   - emote události
   - automatické ukládání

   UI s enginem komunikuje pomocí funkcí a CustomEventů.
========================================================= */


/* =========================================================
   RUNTIME

   Toto se přímo neukládá do save.
========================================================= */

const GAME_RUNTIME = {

    slotIndex: null,

    state: null,

    /*
        Hráč zahrál 7 a engine čeká,
        zda chce výměnu rukou.
    */

    pendingSevenChoice: false,


    /*
        Výběr barvy řeší UI ještě před samotným
        potvrzením tahu, takže zde nemusíme držet
        rozpracovanou Wild kartu.
    */


    /*
        UNO hráče.
    */

    playerUnoTimer: null,

    playerUnoResolver: null,


    /*
        Lukyho zapomenuté UNO.
    */

    lukyUnoTimer: null,

    lukyUnoCatchOpen: false,


    /*
        Timer pro "Je po všem."
    */

    lukyPhraseTimer: null,


    /*
        Emote systém.
    */

    emoteCooldownUntil: 0,

    emoteTimer: null,


    /*
        Ochrana před spuštěním několika
        Lukyho tahů současně.
    */

    lukyTurnRunning: false,


    /*
        Hra je pozastavená např. menu.
    */

    paused: false
};


/* =========================================================
   HERNÍ EVENTY PRO UI
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
   AKTUÁLNÍ STAV
========================================================= */

function getGameState() {
    return GAME_RUNTIME.state;
}


function getActiveSlotIndex() {
    return GAME_RUNTIME.slotIndex;
}


/* =========================================================
   VYTVOŘENÍ NOVÉ PARTIE
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


    /*
        Rozdáme oběma 7 karet.
    */

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


    /*
        První karta na stole.

        Její speciální efekt při samotném startu
        neprovádíme. Slouží jako výchozí karta
        pro první tah.
    */

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

        /*
            Počet po sobě jdoucích běžných tahů,
            kdy hráč neměl kartu a musel líznout.

            Používá se hlavně pro Pavel_angry.
        */

        playerForcedDrawStreak: 0,


        /*
            Počet dokončených tahů.
        */

        turnCount: 0,


        /*
            Žlutý event.

            Pouze každá pátá hra je kandidát.
        */

        yellowEventEligible:
            GAME_CONFIG.yellowEvent.enabled &&
            (
                gameNumber %
                GAME_CONFIG.yellowEvent.everyNthGame
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


    /*
        Úvodní Lukyho hláška.
    */

    triggerOpeningQuote();


    emitStateChanged();


    return state;
}


/* =========================================================
   POKRAČOVÁNÍ ULOŽENÉ PARTIE
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

    GAME_RUNTIME.state =
        {
            ...saved,

            /*
                Starší save tyto hodnoty nemusel mít.
            */

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
                        GAME_CONFIG.yellowEvent.everyNthGame
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


    /*
        Pokud byl save vytvořen během UNO situace,
        restartujeme časové okno.

        Není potřeba ukládat přesné zbývající
        milisekundy.
    */

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
   VÝCHOZÍ BARVA PRVNÍ KARTY
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
   AKTUÁLNÍ VRCHNÍ KARTA
========================================================= */

function getCurrentTopCard() {
    return getTopDiscardCard(
        GAME_RUNTIME.state
    );
}


/* =========================================================
   VALIDACE VÝBĚRU HRÁČE
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


    /*
        +2 / +4 řetězec.
    */

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


    /*
        Stůj řetězec.
    */

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


    /*
        Běžný tah.
    */

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

   chosenColor je nutná u Wild / +4.
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
        validation.needsColorChoice &&
        !isPlayableColor(
            chosenColor
        )
    ) {
        return {
            valid: false,

            needsColorChoice: true,

            cards:
                validation.cards
        };
    }


    const state =
        GAME_RUNTIME.state;

    const cards =
        validation.cards;


    /*
        Čekající UNO hráče z předchozího stavu
        už v tomto okamžiku nemá existovat.
    */

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


    /*
        Kuř!
    */

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
            actor: "player",

            cards,

            effect,

            currentColor:
                state.currentColor
        }
    );


    /*
        Jakmile nemá hráč žádné karty,
        partie okamžitě končí.

        0 / 7 / +2 atd. už další efekt neprovádí.
    */

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


    /*
        Reset série nuceného běžného lízání.
    */

    state.playerForcedDrawStreak = 0;


    /*
        +2 / +4.
    */

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


    /*
        STŮJ.
    */

    if (
        effect.type ===
        CARD_TYPES.SKIP
    ) {
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


    /*
        NULA.
    */

    if (
        isZeroCard(
            cards[0]
        )
    ) {
        swapHands();


        emitGameEvent(
            "hands-swapped",
            {
                reason: "zero",
                actor: "player"
            }
        );
    }


    /*
        SEDMIČKA.

        Nejdřív se zeptáme hráče a další tah
        nezačne, dokud neodpoví.
    */

    if (
        isSevenCard(
            cards[0]
        )
    ) {
        GAME_RUNTIME
            .pendingSevenChoice =
            true;


        await handlePlayerUnoAfterPlay();


        saveGame();
        emitStateChanged();


        emitGameEvent(
            "seven-choice-requested",
            {}
        );


        return {
            valid: true,
            pendingSevenChoice: true
        };
    }


    /*
        REVERSE v 1v1 nemá speciální efekt.

        U ostatních karet normálně přejde tah na Lukyho.
    */

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
   HRÁČ ROZHODNE O SEDMIČCE
========================================================= */

function resolvePlayerSevenChoice(
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
                reason: "seven",
                actor: "player"
            }
        );
    }


    state.turn =
        "luky";


    completeTurn();

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

   Domácí pravidlo:
   po líznutí už kartu nesmí zahrát.
========================================================= */

function playerDraw() {
    const state =
        GAME_RUNTIME.state;


    if (
        !canPlayerAct()
    ) {
        return false;
    }


    /*
        Pokud běží +2/+4 penalizace,
        hráč bere celý součet a stojí.
    */

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
                actor: "player",
                amount,
                penalty: true
            }
        );


        clearDrawPenalty();


        state.playerForcedDrawStreak = 0;

        state.turn =
            "luky";


        completeTurn();

        saveGame();
        emitStateChanged();

        scheduleLukyTurn();

        return true;
    }


    /*
        Pokud hráč čelí Stůj, nelze normálně lízat.
        Musí Stůj přehodit, nebo stát.
    */

    if (
        state.skipChainCount > 0
    ) {
        return false;
    }


    drawCards(
        "player",
        1
    );


    state.playerForcedDrawStreak += 1;


    emitGameEvent(
        "cards-drawn",
        {
            actor: "player",
            amount: 1,
            penalty: false
        }
    );


    /*
        Pavel může reagovat po opakovaném nuceném lízání.
    */

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
   HRÁČ AKCEPTUJE STŮJ

   UI tuto funkci většinou nebude potřebovat přímo:
   při Stůj lze zobrazit možnost přehodit vlastní Stůj,
   jinak engine může automaticky vyhodnotit stojící tah.

   Funkci ale necháváme veřejnou.
========================================================= */

function playerAcceptSkip() {
    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.turn !== "player" ||
        state.skipChainCount <= 0
    ) {
        return false;
    }


    clearSkipChain();


    /*
        Poslední Stůj zahrál Luky,
        takže Luky hraje znovu.
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
        !GAME_RUNTIME.pendingSevenChoice
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


    state.skipChainCount = 0;


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


    state.drawPenalty = 0;

    state.topPenaltyType = null;
}


/* =========================================================
   STŮJ
========================================================= */

function handleSkipPlay(actor) {
    const state =
        GAME_RUNTIME.state;


    state.skipChainCount += 1;

    state.drawPenalty = 0;

    state.topPenaltyType = null;


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
        .skipChainCount = 0;
}


/* =========================================================
   STŮJ HLÁŠKA
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


    /*
        Luky si žádnou informaci o předchozí ruce
        hráče neuchovává. AI pracuje jen s novým
        gameState.
    */
}


/* =========================================================
   DOBÍRÁNÍ KARET
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
   OBNOVENÍ DOBÍRACÍHO BALÍČKU
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
   AKTUÁLNÍ BARVA
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
        GAME_RUNTIME.lukyTurnRunning
    ) {
        return;
    }


    /*
        Čekáme-li na hráčovo UNO,
        Luky zatím nezačne.
    */

    if (
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

                                thinking: true
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
   PROVEDENÍ LUKYHO ROZHODNUTÍ
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
       LUKY MUSÍ VZÍT PENALIZACI
    ===================================================== */

    if (
        decision.action === "draw" &&
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
                actor: "luky",
                amount,
                penalty: true
            }
        );


        clearDrawPenalty();


        /*
            Luky penalizaci vzal a vynechává tah.

            Hraje znovu hráč.
        */

        state.turn =
            "player";


        completeTurn();

        saveGame();
        emitStateChanged();


        maybeTriggerStrongSituationEmote();


        return;
    }


    /* =====================================================
       LUKY STOJÍ
    ===================================================== */

    if (
        decision.action === "skip"
    ) {
        clearSkipChain();


        /*
            Poslední Stůj zahrál hráč,
            takže hráč hraje znovu.
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
        decision.action === "draw"
    ) {
        drawCards(
            "luky",
            1
        );


        emitGameEvent(
            "cards-drawn",
            {
                actor: "luky",
                amount: 1,
                penalty: false
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
        decision.cards || [];


    if (
        cards.length === 0
    ) {
        state.turn =
            "player";

        completeTurn();

        saveGame();
        emitStateChanged();

        return;
    }


    const wasSkipCounter =
        state.skipChainCount > 0;


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


    if (
        effect.isKur
    ) {
        /*
            Lukyho "Kuř!" jsme nedefinovali.
            Hra tedy pouze provede Kuř!, bez hlášky.
        */
    }


    emitGameEvent(
        "cards-played",
        {
            actor: "luky",

            cards,

            effect,

            currentColor:
                state.currentColor
        }
    );


    /*
        Výhra Lukyho.
    */

    if (
        state.lukyHand.length ===
        0
    ) {
        await finishGame(
            "luky"
        );

        return;
    }


    /*
        STŮJ counter hláška.
    */

    if (
        effect.type ===
            CARD_TYPES.SKIP &&
        wasSkipCounter
    ) {
        emitSkipCounterQuote(
            "luky",
            state.skipChainCount
        );
    }


    /*
        +2 / +4.
    */

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


    /*
        STŮJ.
    */

    if (
        effect.type ===
        CARD_TYPES.SKIP
    ) {
        handleSkipPlay(
            "luky"
        );


        maybeTriggerMildSituationEmote();


        handleLukyUnoAfterPlay();


        saveGame();
        emitStateChanged();


        return;
    }


    /*
        NULA.
    */

    if (
        isZeroCard(
            cards[0]
        )
    ) {
        swapHands();


        emitGameEvent(
            "hands-swapped",
            {
                reason: "zero",
                actor: "luky"
            }
        );
    }


    /*
        SEDMIČKA.
    */

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
                    reason: "seven",
                    actor: "luky"
                }
            );
        }
    }


    state.turn =
        "player";


    completeTurn();


    handleLukyUnoAfterPlay();


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


    /*
        Zastavíme pokračování hry maximálně na 3 s.
        Jakmile hráč řekne UNO, Promise se ukončí
        okamžitě.
    */

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
   TLAČÍTKO UNO!
========================================================= */

function playerCallUno() {
    const state =
        GAME_RUNTIME.state;


    if (!state) {
        return false;
    }


    /*
        Platné UNO.
    */

    if (
        state.pendingPlayerUno &&
        state.playerHand.length === 1
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
            state.turn === "luky"
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
   ZRUŠENÍ PLAYER UNO TIMERU
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

        GAME_RUNTIME
            .playerUnoTimer =
            null;
    }


    if (
        resolvePromise &&
        GAME_RUNTIME.playerUnoResolver
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


    /*
        "Je po všem." zazní vždy.
    */

    const forgot =
        shouldLukyForgetUno();


    state.pendingLukyUno =
        forgot;

    state.lukyForgotUno =
        forgot;


    if (forgot) {

        /*
            Nejdřív "Je po všem.",
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
                /*
                    UI nemusí hráči prozrazovat,
                    že toto okno skutečně běží.
                */

                duration: delay
            }
        );


        GAME_RUNTIME
            .lukyUnoTimer =
            setTimeout(
                () => {
                    resolveForgottenLukyUno();
                },
                delay
            );


        return;
    }


    /*
        UNO řekl správně hned.
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


    /*
        Po 2–3 sekundách:
        "Je po všem."
    */

    const phraseDelay =
        getRandomLukyAfterUnoDelay();


    GAME_RUNTIME
        .lukyPhraseTimer =
        setTimeout(
            () => {

                if (
                    GAME_RUNTIME.state &&
                    GAME_RUNTIME.state
                        .lukyHand
                        .length === 1
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
            phraseDelay
        );
}


/* =========================================================
   LUKY SI POZDĚ VZPOMENE NA UNO
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
        state.lukyHand.length !== 1
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
   TLAČÍTKO "NEŘEKL JSI UNO!"
========================================================= */

function playerCatchLukyUno() {
    const state =
        GAME_RUNTIME.state;


    if (!state) {
        return false;
    }


    /*
        Správné nachytání.
    */

    if (
        GAME_RUNTIME
            .lukyUnoCatchOpen &&
        state.pendingLukyUno &&
        state.lukyHand.length === 1
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
                actor: "luky",

                amount:
                    GAME_CONFIG
                        .lukyUno
                        .caughtPenaltyCards,

                unoPenalty: true
            }
        );


        const achievement =
            registerCaughtLukyUnoAchievement();


        announceUnlockedAchievements(
            achievement
                .newlyUnlocked
        );


        saveGame();
        emitStateChanged();


        return true;
    }


    /*
        Nesmyslné použití tlačítka.

        Tlačítko zůstává aktivní celou dobu,
        takže jeho stav nic neprozrazuje.
    */

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
        state.playerHand.length === 1
    ) {
        /*
            Při loadu dostane hráč celé nové
            3sekundové okno.
        */

        state.pendingPlayerUno =
            false;

        handlePlayerUnoAfterPlay();
    }


    if (
        state.pendingLukyUno &&
        state.lukyForgotUno &&
        state.lukyHand.length === 1
    ) {
        GAME_RUNTIME
            .lukyUnoCatchOpen =
            true;


        const delay =
            getRandomLukyUnoWindow();


        GAME_RUNTIME
            .lukyUnoTimer =
            setTimeout(
                () => {
                    resolveForgottenLukyUno();
                },
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


    /*
        Ne hned na začátku.

        Od čtvrtého dokončeného tahu má každé další
        kolo malou šanci event aktivovat.
    */

    if (
        state.turnCount < 4
    ) {
        return;
    }


    if (
        randomChance(0.12)
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
   "MÁ NĚKDO ŽLUTOU?"
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
   OTEVÍRACÍ HLÁŠKA LUKYHO
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
   "NALOŽENÍ" LUKYMU

   +4 nebo minimálně celková hodnota +4
   v rámci Kuř!.
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
   EMOTE SYSTÉM
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

   Např. Luky hodil +2/+4.
========================================================= */

function maybeTriggerStrongSituationEmote() {
    if (
        isEmoteCooldownActive()
    ) {
        return;
    }


    if (
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


    /*
        U 96 se náhodně rozhodne:
        - Luky se posmívá
        - Pavel reaguje
        Nikdy oba současně.
    */

    if (
        slot.characterId === "96"
    ) {
        if (
            randomChance(0.5)
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
   MENŠÍ VÝHODA LUKYHO

   Např. Stůj.
========================================================= */

function maybeTriggerMildSituationEmote() {
    if (
        isEmoteCooldownActive()
    ) {
        return;
    }


    if (
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
        slot.characterId === "96"
    ) {
        if (
            randomChance(0.5)
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
        Třetí nucené líznutí Pavla za sebou
        považujeme za silnou špatnou situaci.
    */

    if (
        slot.characterId === "96" &&
        state.playerForcedDrawStreak >= 3
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


    /*
        Jedno běžné líznutí = mírná situace.
    */

    maybeTriggerMildSituationEmote();
}


/* =========================================================
   ZOBRAZENÍ EMOTU
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
   UKONČENÍ PARTIE
========================================================= */

async function finishGame(winner) {
    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status === "finished"
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
   ACHIEVEMENT TOASTY
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
        (definition, index) => {

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
        ) + 1;


    state.updatedAt =
        getSaveTimestamp();


    maybeActivateYellowEvent();
}


/* =========================================================
   AUTOMATICKÉ ULOŽENÍ
========================================================= */

function saveGame() {
    const state =
        GAME_RUNTIME.state;


    if (
        !state ||
        state.status !== "playing" ||
        GAME_RUNTIME.slotIndex === null
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
   STATE CHANGED
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
   PAUSE / RESUME
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
        GAME_RUNTIME.state?.turn ===
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
                GAME_RUNTIME.slotIndex
        }
    );
}


/* =========================================================
   TIMER CLEANUP
========================================================= */

function clearRuntimeTimers() {
    cancelPlayerUnoTimer(
        true
    );


    if (
        GAME_RUNTIME.lukyUnoTimer
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
        GAME_RUNTIME.lukyPhraseTimer
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
        GAME_RUNTIME.emoteTimer
    ) {
        clearTimeout(
            GAME_RUNTIME
                .emoteTimer
        );

        GAME_RUNTIME
            .emoteTimer =
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
