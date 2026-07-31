"use strict";


/* =========================================================
   DOTS UNO
   SAVE SYSTÉM

   Ukládá:
   - 3 sloty
   - postavu
   - skin
   - W / L
   - rozehranou partii
   - historii úvodních hlášek

   Rozehraná partie navíc ukládá:
   - historii akcí
   - poslední akci
   - UNO stav hráče i Lukyho
   - žlutý event
   - turnCount
   - nucené dobírání
   - přesnou hodnotu posledního + stacku

   Globální statistiky navíc ukládají:
   - čas odehraný od zavedení měření
   - počet časově změřených partií
   - datum prvního hraní
   - historii dokončených partií

   Achievementy a globální nastavení jsou mimo sloty.
========================================================= */


/* =========================================================
   ZÁKLADNÍ STRUKTURA SLOTU
========================================================= */

function createEmptySaveSlot(slotIndex) {

    return {

        slotIndex,

        characterId:
            null,

        skinId:
            null,

        wins:
            0,

        losses:
            0,

        currentGame:
            null,

        quoteHistory:
            createEmptyQuoteHistory(),

        createdAt:
            null,

        updatedAt:
            null
    };
}


/* =========================================================
   VÝCHOZÍ SLOTY
========================================================= */

function createDefaultSaveSlots() {

    const slots =
        [];


    for (
        let index = 0;
        index < GAME_CONFIG.saveSlotCount;
        index += 1
    ) {

        slots.push(
            createEmptySaveSlot(
                index
            )
        );
    }


    return slots;
}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function readJsonFromStorage(
    key,
    fallbackValue
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );


        if (!raw) {

            return fallbackValue;
        }


        return JSON.parse(
            raw
        );

    } catch (error) {

        console.error(
            `Nepodařilo se načíst localStorage: ${key}`,
            error
        );


        return fallbackValue;
    }
}


function writeJsonToStorage(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );


        return true;

    } catch (error) {

        console.error(
            `Nepodařilo se uložit localStorage: ${key}`,
            error
        );


        return false;
    }
}


/* =========================================================
   ČAS
========================================================= */

function getSaveTimestamp() {

    return new Date()
        .toISOString();
}


/* =========================================================
   GLOBÁLNÍ ČASOVÉ STATISTIKY

   Poznámka k migraci:
   - staré dokončené partie nemají známou délku
   - jejich počet zůstává zachován ve stávajících statistikách
   - totalDurationMs proto počítá jen partie dokončené od zavedení
     této funkce
========================================================= */

function createDefaultGlobalStats() {

    return {

        version:
            GAME_CONFIG.storageVersion,

        totalDurationMs:
            0,

        timedGames:
            0,

        firstPlayedAt:
            null,

        completedGames:
            [],

        updatedAt:
            null
    };
}


function normalizeGlobalStats(
    rawStats
) {

    const fallback =
        createDefaultGlobalStats();


    if (
        !rawStats ||
        typeof rawStats !==
            "object"
    ) {

        return fallback;
    }


    return {

        version:
            normalizeNonNegativeInteger(
                rawStats.version
            ) ||
            GAME_CONFIG.storageVersion,

        totalDurationMs:
            normalizeNonNegativeInteger(
                rawStats.totalDurationMs
            ),

        timedGames:
            normalizeNonNegativeInteger(
                rawStats.timedGames
            ),

        firstPlayedAt:
            normalizeOptionalString(
                rawStats.firstPlayedAt
            ),

        /*
            Starší save toto pole nemá. V takovém případě se použije
            prázdná historie a všechny dosavadní statistiky zůstanou
            beze změny.
        */

        completedGames:
            normalizeCompletedGameHistory(
                rawStats.completedGames
            ),

        updatedAt:
            normalizeOptionalString(
                rawStats.updatedAt
            )
    };
}


function getEarliestSlotCreatedAt(
    slots =
        null
) {

    const source =
        Array.isArray(
            slots
        )
            ? slots
            : loadSaveSlots();


    const timestamps =
        source
            .map(
                (slot) =>
                    Date.parse(
                        slot?.createdAt ||
                        ""
                    )
            )
            .filter(
                Number.isFinite
            );


    if (
        timestamps.length ===
        0
    ) {

        return null;
    }


    return new Date(
        Math.min(
            ...timestamps
        )
    ).toISOString();
}


function saveGlobalStats(
    stats
) {

    const normalized =
        normalizeGlobalStats(
            stats
        );


    normalized.updatedAt =
        getSaveTimestamp();


    writeJsonToStorage(
        GAME_CONFIG
            .storage
            .globalStatsKey,
        normalized
    );


    return normalized;
}


function loadGlobalStats() {

    const raw =
        readJsonFromStorage(
            GAME_CONFIG
                .storage
                .globalStatsKey,
            null
        );


    const stats =
        normalizeGlobalStats(
            raw
        );


    /*
        U existujících hráčů zpětně neznáme přesný okamžik úplně
        prvního spuštění hry. Nejlepší bezpečný údaj je nejstarší
        createdAt některého existujícího slotu.
    */

    if (
        !stats.firstPlayedAt
    ) {

        const migratedFirstPlayedAt =
            getEarliestSlotCreatedAt();


        if (
            migratedFirstPlayedAt
        ) {

            stats.firstPlayedAt =
                migratedFirstPlayedAt;


            return saveGlobalStats(
                stats
            );
        }
    }


    return stats;
}


function ensureFirstPlayedAt(
    timestamp =
        null
) {

    const stats =
        loadGlobalStats();


    if (
        stats.firstPlayedAt
    ) {

        return stats;
    }


    const parsed =
        Date.parse(
            timestamp ||
            ""
        );


    stats.firstPlayedAt =
        Number.isFinite(
            parsed
        )
            ? new Date(
                parsed
            ).toISOString()
            : getSaveTimestamp();


    return saveGlobalStats(
        stats
    );
}


/* =========================================================
   HISTORIE DOKONČENÝCH PARTIÍ

   Tato historie je oddělená od historie tahů uvnitř rozehrané hry.
   Ukládají se pouze skutečně dokončené partie.
========================================================= */

function normalizeCompletedGameHistory(
    rawHistory
) {

    if (
        !Array.isArray(
            rawHistory
        )
    ) {

        return [];
    }


    return rawHistory
        .map(
            normalizeCompletedGameEntry
        )
        .filter(
            Boolean
        )
        .sort(
            (
                first,
                second
            ) =>
                Date.parse(
                    second.finishedAt ||
                    ""
                ) -
                Date.parse(
                    first.finishedAt ||
                    ""
                )
        );
}


function normalizeCompletedGameEntry(
    rawEntry
) {

    if (
        !rawEntry ||
        typeof rawEntry !==
            "object"
    ) {

        return null;
    }


    const winner =
        rawEntry.winner ===
            "player"
            ? "player"
            : rawEntry.winner ===
                "luky"
                ? "luky"
                : null;


    const characterId =
        normalizeOptionalString(
            rawEntry.characterId
        );


    const finishedAt =
        normalizeOptionalString(
            rawEntry.finishedAt
        );


    if (
        !winner ||
        !characterId ||
        !finishedAt
    ) {

        return null;
    }


    return {

        id:
            normalizeOptionalString(
                rawEntry.id
            ) ||
            createCompletedGameId({
                startedAt:
                    rawEntry.startedAt,

                finishedAt,

                characterId
            }),

        winner,

        result:
            winner ===
                "player"
                ? "win"
                : "loss",

        characterId,

        skinId:
            normalizeOptionalString(
                rawEntry.skinId
            ),

        playerImage:
            normalizeOptionalString(
                rawEntry.playerImage
            ),

        lukyImage:
            normalizeOptionalString(
                rawEntry.lukyImage
            ),

        durationMs:
            normalizeNonNegativeInteger(
                rawEntry.durationMs
            ),

        startedAt:
            normalizeOptionalString(
                rawEntry.startedAt
            ),

        finishedAt
    };
}


function createCompletedGameId({
    startedAt = null,
    finishedAt = null,
    characterId = null
} = {}) {

    const base =
        [
            startedAt ||
                "",
            finishedAt ||
                "",
            characterId ||
                ""
        ]
            .join(
                "|"
            )
            .replace(
                /[^a-zA-Z0-9_-]+/g,
                "-"
            )
            .slice(
                0,
                90
            );


    return (
        `completed-${base || Date.now()}`
    );
}


function getCompletedGameHistory() {

    return [
        ...loadGlobalStats()
            .completedGames
    ];
}


function registerCompletedGameHistory({
    winner,
    characterId,
    durationMs = 0,
    startedAt = null,
    finishedAt = null
} = {}) {

    const safeFinishedAt =
        normalizeOptionalString(
            finishedAt
        ) ||
        getSaveTimestamp();


    const activeSlotIndex =
        typeof getActiveSlotIndex ===
            "function"
            ? getActiveSlotIndex()
            : null;


    const slot =
        Number.isInteger(
            activeSlotIndex
        )
            ? getSaveSlot(
                activeSlotIndex
            )
            : null;


    const entry =
        normalizeCompletedGameEntry({

            id:
                createCompletedGameId({
                    startedAt,
                    finishedAt:
                        safeFinishedAt,
                    characterId
                }),

            winner,

            characterId,

            skinId:
                slot?.skinId ||
                null,

            playerImage:
                slot
                    ? getSlotCharacterImage(
                        slot
                    )
                    : (
                        typeof getCharacterImage ===
                            "function"
                            ? getCharacterImage(
                                characterId
                            )
                            : null
                    ),

            lukyImage:
                typeof getConfiguredLukyEndImage ===
                    "function"
                    ? getConfiguredLukyEndImage(
                        winner ===
                            "luky"
                            ? "win"
                            : "lose"
                    )
                    : null,

            durationMs,

            startedAt,

            finishedAt:
                safeFinishedAt
        });


    if (!entry) {

        return null;
    }


    const stats =
        loadGlobalStats();


    /*
        Pojistka proti dvojímu zápisu stejné partie.
        ID vychází z času začátku/konce a postavy.
    */

    if (
        stats.completedGames
            .some(
                (game) =>
                    game.id ===
                    entry.id
            )
    ) {

        return entry;
    }


    stats.completedGames.unshift(
        entry
    );


    stats.completedGames =
        normalizeCompletedGameHistory(
            stats.completedGames
        );


    saveGlobalStats(
        stats
    );


    return entry;
}


function registerFinishedGameTiming({
    durationMs = 0,
    startedAt = null
} = {}) {

    const stats =
        ensureFirstPlayedAt(
            startedAt
        );


    const safeDurationMs =
        normalizeNonNegativeInteger(
            durationMs
        );


    stats.totalDurationMs +=
        safeDurationMs;


    stats.timedGames +=
        1;


    return saveGlobalStats(
        stats
    );
}


/* =========================================================
   NORMALIZACE SLOTU
========================================================= */

function normalizeSaveSlot(
    rawSlot,
    slotIndex
) {

    const empty =
        createEmptySaveSlot(
            slotIndex
        );


    if (
        !rawSlot ||
        typeof rawSlot !==
            "object"
    ) {

        return empty;
    }


    const characterId =
        typeof rawSlot.characterId ===
            "string" &&
        getCharacterConfig(
            rawSlot.characterId
        )
            ? rawSlot.characterId
            : null;


    const skinId =
        characterId
            ? normalizeSkinId(
                characterId,
                rawSlot.skinId
            )
            : null;


    return {

        slotIndex,

        characterId,

        skinId,

        wins:
            normalizeNonNegativeInteger(
                rawSlot.wins
            ),

        losses:
            normalizeNonNegativeInteger(
                rawSlot.losses
            ),

        currentGame:
            normalizeSavedGame(
                rawSlot.currentGame
            ),

        quoteHistory:
            normalizeQuoteHistory(
                rawSlot.quoteHistory
            ),

        createdAt:
            normalizeOptionalString(
                rawSlot.createdAt
            ),

        updatedAt:
            normalizeOptionalString(
                rawSlot.updatedAt
            )
    };
}


/* =========================================================
   SKIN
========================================================= */

function normalizeSkinId(
    characterId,
    rawSkinId
) {

    const character =
        getCharacterConfig(
            characterId
        );


    if (!character) {

        return null;
    }


    const defaultSkinId =
        character.defaultSkinId ||
        "default";


    if (
        typeof rawSkinId !==
            "string" ||
        !rawSkinId.trim()
    ) {

        return defaultSkinId;
    }


    const requested =
        getConfiguredCharacterSkin(
            characterId,
            rawSkinId.trim()
        );


    return requested
        ? requested.id
        : defaultSkinId;
}


/* =========================================================
   ROZEHRANÁ HRA
========================================================= */

function normalizeSavedGame(
    rawGame
) {

    if (
        !rawGame ||
        typeof rawGame !==
            "object"
    ) {

        return null;
    }


    if (
        rawGame.status ===
        "finished"
    ) {

        return null;
    }


    const gameNumber =
        Math.max(
            1,
            normalizeNonNegativeInteger(
                rawGame.gameNumber
            )
        );


    const history =
        normalizeGameHistory(
            rawGame.history
        );


    return {

        version:
            normalizeNonNegativeInteger(
                rawGame.version
            ) ||
            GAME_CONFIG.storageVersion,


        status:
            normalizeOptionalString(
                rawGame.status
            ) ||
            "playing",


        turn:
            rawGame.turn ===
                "luky"
                ? "luky"
                : "player",


        playerHand:
            normalizeCardArray(
                rawGame.playerHand
            ),


        lukyHand:
            normalizeCardArray(
                rawGame.lukyHand
            ),


        drawPile:
            normalizeCardArray(
                rawGame.drawPile
            ),


        discardPile:
            normalizeCardArray(
                rawGame.discardPile
            ),


        currentColor:
            normalizeCardColor(
                rawGame.currentColor
            ),


        drawPenalty:
            normalizeNonNegativeInteger(
                rawGame.drawPenalty
            ),


        topPenaltyType:
            normalizeOptionalString(
                rawGame.topPenaltyType
            ),


        /*
            Hodnota POSLEDNÍHO dobíracího stacku.
            Starší save ji nemá; game.js má fallback podle typu +2/+4.
        */

        topPenaltyAmount:
            normalizeNonNegativeInteger(
                rawGame.topPenaltyAmount
            ),


        skipChainCount:
            normalizeNonNegativeInteger(
                rawGame.skipChainCount
            ),


        /*
            Hráč je po tahu na jedné kartě
            a běží jeho 3sekundové UNO okno.
        */

        pendingPlayerUno:
            Boolean(
                rawGame.pendingPlayerUno
            ),


        /*
            Luky má jednu kartu a ještě musí
            nebo nemusí UNO doříct.
        */

        pendingLukyUno:
            Boolean(
                rawGame.pendingLukyUno
            ),


        /*
            Aktuální situace:
            Luky UNO zapomněl a lze ho nachytat.
        */

        lukyForgotUno:
            Boolean(
                rawGame.lukyForgotUno
            ),


        /*
            Luky má jednu kartu a v tomto stavu
            už UNO skutečně řekl.

            To potřebujeme rozlišit od:
            "má jednu kartu, ale ještě UNO neřekl".
        */

        lukyUnoSaid:
            Boolean(
                rawGame.lukyUnoSaid
            ),


        /*
            Hráč po zahrání karty skončil na jedné,
            ale ještě řeší modal, např. 7.

            Během toho ho Luky NESMÍ nachytat.
        */

        playerUnoDeferred:
            Boolean(
                rawGame.playerUnoDeferred
            ),


        yellowEventEligible:
            typeof rawGame.yellowEventEligible ===
                "boolean"
                ? rawGame.yellowEventEligible
                : (
                    GAME_CONFIG
                        .yellowEvent
                        .enabled &&
                    gameNumber %
                        GAME_CONFIG
                            .yellowEvent
                            .everyNthGame ===
                        0
                ),


        yellowEventAvailable:
            Boolean(
                rawGame.yellowEventAvailable
            ),


        yellowEventUsed:
            Boolean(
                rawGame.yellowEventUsed
            ),


        playerForcedDrawStreak:
            normalizeNonNegativeInteger(
                rawGame.playerForcedDrawStreak
            ),


        turnCount:
            normalizeNonNegativeInteger(
                rawGame.turnCount
            ),


        /*
            Historie partie.
        */

        history,


        /*
            Poslední důležitá akce.
            Pokud ve starém save chybí, vezmeme
            nejnovější záznam historie.
        */

        lastAction:
            normalizeHistoryEntry(
                rawGame.lastAction
            ) ||
            history[0] ||
            null,


        gameNumber,


        startedAt:
            normalizeOptionalString(
                rawGame.startedAt
            ),


        updatedAt:
            normalizeOptionalString(
                rawGame.updatedAt
            )
    };
}


/* =========================================================
   KARTY
========================================================= */

function normalizeCardArray(
    cards
) {

    if (
        !Array.isArray(
            cards
        )
    ) {

        return [];
    }


    return cards
        .map(
            (card) =>
                deserializeCard(
                    card
                )
        )
        .filter(
            Boolean
        );
}


/* =========================================================
   HISTORIE HRY
========================================================= */

function normalizeGameHistory(
    rawHistory
) {

    if (
        !Array.isArray(
            rawHistory
        )
    ) {

        return [];
    }


    const normalized =
        rawHistory
            .map(
                normalizeHistoryEntry
            )
            .filter(
                Boolean
            );


    return normalized.slice(
        0,
        GAME_CONFIG
            .history
            .maxEntries
    );
}


function normalizeHistoryEntry(
    rawEntry
) {

    if (
        !rawEntry ||
        typeof rawEntry !==
            "object"
    ) {

        return null;
    }


    const actor =
        normalizeHistoryActor(
            rawEntry.actor
        );


    const type =
        normalizeOptionalString(
            rawEntry.type
        );


    const text =
        normalizeOptionalString(
            rawEntry.text
        );


    /*
        Historie musí mít alespoň typ nebo text.
    */

    if (
        !type &&
        !text
    ) {

        return null;
    }


    return {

        id:
            normalizeOptionalString(
                rawEntry.id
            ) ||
            createHistoryEntryId(),


        actor,


        type:
            type ||
            "info",


        text:
            text ||
            "",


        cards:
            normalizeHistoryCardArray(
                rawEntry.cards
            ),


        amount:
            normalizeOptionalInteger(
                rawEntry.amount
            ),


        color:
            normalizeCardColor(
                rawEntry.color
            ),


        unoSaid:
            typeof rawEntry.unoSaid ===
                "boolean"
                ? rawEntry.unoSaid
                : null,


        timestamp:
            normalizeOptionalString(
                rawEntry.timestamp
            ) ||
            getSaveTimestamp()
    };
}


function normalizeHistoryActor(
    actor
) {

    if (
        actor === "player" ||
        actor === "luky" ||
        actor === "system"
    ) {

        return actor;
    }


    return "system";
}


/* =========================================================
   KARTY V HISTORII

   Ukládáme jen informace potřebné pro UI,
   ne celý herní objekt karty.
========================================================= */

function normalizeHistoryCardArray(
    rawCards
) {

    if (
        !Array.isArray(
            rawCards
        )
    ) {

        return [];
    }


    return rawCards
        .map(
            normalizeHistoryCard
        )
        .filter(
            Boolean
        );
}


function normalizeHistoryCard(
    rawCard
) {

    if (
        !rawCard ||
        typeof rawCard !==
            "object"
    ) {

        return null;
    }


    const type =
        normalizeOptionalString(
            rawCard.type
        );


    if (!type) {

        return null;
    }


    return {

        type,

        color:
            normalizeOptionalString(
                rawCard.color
            ),

        value:
            rawCard.value ??
            null
    };
}


/* =========================================================
   NOVÉ ID HISTORIE
========================================================= */

function createHistoryEntryId() {

    return (
        `history-${Date.now()}-` +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}


/* =========================================================
   VYTVOŘENÍ HISTORICKÉHO ZÁZNAMU

   game.js bude používat tuto funkci.
========================================================= */

function createHistoryEntry({
    actor = "system",
    type = "info",
    text = "",
    cards = [],
    amount = null,
    color = null,
    unoSaid = null
} = {}) {

    return {

        id:
            createHistoryEntryId(),

        actor:
            normalizeHistoryActor(
                actor
            ),

        type:
            String(
                type ||
                "info"
            ),

        text:
            String(
                text ||
                ""
            ),

        cards:
            serializeHistoryCards(
                cards
            ),

        amount:
            Number.isFinite(
                Number(amount)
            )
                ? Number(amount)
                : null,

        color:
            color ||
            null,

        unoSaid:
            typeof unoSaid ===
                "boolean"
                ? unoSaid
                : null,

        timestamp:
            getSaveTimestamp()
    };
}


/* =========================================================
   KARTY → HISTORIE
========================================================= */

function serializeHistoryCards(
    cards
) {

    if (
        !Array.isArray(
            cards
        )
    ) {

        return [];
    }


    return cards
        .map(
            (card) => {

                if (!card) {
                    return null;
                }


                return {

                    type:
                        card.type,

                    color:
                        card.color ??
                        null,

                    value:
                        card.value ??
                        null
                };
            }
        )
        .filter(
            Boolean
        );
}


/* =========================================================
   PŘIDÁNÍ ZÁZNAMU DO STAVU HRY

   Nejnovější je VŽDY na indexu 0.
========================================================= */

function appendGameHistoryEntry(
    gameState,
    entry
) {

    if (
        !gameState ||
        !entry
    ) {

        return null;
    }


    if (
        !Array.isArray(
            gameState.history
        )
    ) {

        gameState.history =
            [];
    }


    const normalized =
        normalizeHistoryEntry(
            entry
        );


    if (!normalized) {

        return null;
    }


    gameState.history.unshift(
        normalized
    );


    gameState.history =
        gameState.history.slice(
            0,
            GAME_CONFIG
                .history
                .maxEntries
        );


    gameState.lastAction =
        normalized;


    return normalized;
}


/* =========================================================
   HISTORIE HLÁŠEK
========================================================= */

function normalizeQuoteHistory(
    rawHistory
) {

    const fallback =
        createEmptyQuoteHistory();


    if (
        !rawHistory ||
        typeof rawHistory !==
            "object"
    ) {

        return fallback;
    }


    const characterHistory =
        {};


    const rawCharacters =
        rawHistory
            .opening
            ?.character;


    if (
        rawCharacters &&
        typeof rawCharacters ===
            "object"
    ) {

        Object.entries(
            rawCharacters
        )
            .forEach(
                ([
                    characterId,
                    indexes
                ]) => {

                    if (
                        !Array.isArray(
                            indexes
                        )
                    ) {

                        return;
                    }


                    characterHistory[
                        characterId
                    ] =
                        indexes
                            .map(
                                normalizeNonNegativeInteger
                            )
                            .filter(
                                (
                                    value,
                                    index,
                                    array
                                ) =>
                                    array.indexOf(
                                        value
                                    ) ===
                                    index
                            );
                }
            );
    }


    const general =
        Array.isArray(
            rawHistory
                .opening
                ?.general
        )
            ? rawHistory
                .opening
                .general
                .map(
                    normalizeNonNegativeInteger
                )
                .filter(
                    (
                        value,
                        index,
                        array
                    ) =>
                        array.indexOf(
                            value
                        ) ===
                        index
                )
            : [];


    return {

        opening: {

            character:
                characterHistory,

            general
        },

        lastQuoteKey:
            normalizeOptionalString(
                rawHistory.lastQuoteKey
            )
    };
}


/* =========================================================
   POMOCNÁ NORMALIZACE
========================================================= */

function normalizeNonNegativeInteger(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 0;
    }


    return Math.max(
        0,
        Math.floor(
            number
        )
    );
}


function normalizeOptionalInteger(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return null;
    }


    return Math.floor(
        number
    );
}


function normalizeOptionalString(
    value
) {

    if (
        typeof value !==
            "string"
    ) {

        return null;
    }


    const trimmed =
        value.trim();


    return trimmed ||
        null;
}


function normalizeCardColor(
    value
) {

    const allowed =
        new Set([
            CARD_COLORS.RED,
            CARD_COLORS.YELLOW,
            CARD_COLORS.GREEN,
            CARD_COLORS.BLUE
        ]);


    return allowed.has(
        value
    )
        ? value
        : null;
}


/* =========================================================
   LOAD SLOTŮ
========================================================= */

function loadSaveSlots() {

    const rawSlots =
        readJsonFromStorage(
            GAME_CONFIG
                .storage
                .slotsKey,
            null
        );


    if (
        !Array.isArray(
            rawSlots
        )
    ) {

        const defaults =
            createDefaultSaveSlots();


        saveAllSlots(
            defaults
        );


        return defaults;
    }


    const slots =
        [];


    for (
        let index = 0;
        index < GAME_CONFIG.saveSlotCount;
        index += 1
    ) {

        slots.push(
            normalizeSaveSlot(
                rawSlots[index],
                index
            )
        );
    }


    return slots;
}


/* =========================================================
   SAVE VŠECH SLOTŮ
========================================================= */

function saveAllSlots(
    slots
) {

    const normalized =
        [];


    for (
        let index = 0;
        index < GAME_CONFIG.saveSlotCount;
        index += 1
    ) {

        normalized.push(
            serializeSaveSlot(
                slots[index] ||
                createEmptySaveSlot(
                    index
                )
            )
        );
    }


    return writeJsonToStorage(
        GAME_CONFIG
            .storage
            .slotsKey,
        normalized
    );
}


/* =========================================================
   SERIALIZACE SLOTU
========================================================= */

function serializeSaveSlot(
    slot
) {

    return {

        slotIndex:
            slot.slotIndex,

        characterId:
            slot.characterId,

        skinId:
            slot.skinId,

        wins:
            normalizeNonNegativeInteger(
                slot.wins
            ),

        losses:
            normalizeNonNegativeInteger(
                slot.losses
            ),

        currentGame:
            slot.currentGame
                ? serializeSavedGame(
                    slot.currentGame
                )
                : null,

        quoteHistory:
            slot.quoteHistory ||
            createEmptyQuoteHistory(),

        createdAt:
            slot.createdAt,

        updatedAt:
            slot.updatedAt
    };
}


/* =========================================================
   SERIALIZACE HRY
========================================================= */

function serializeSavedGame(
    game
) {

    if (!game) {

        return null;
    }


    const history =
        normalizeGameHistory(
            game.history
        );


    return {

        version:
            GAME_CONFIG
                .storageVersion,


        status:
            game.status ||
            "playing",


        turn:
            game.turn ===
                "luky"
                ? "luky"
                : "player",


        playerHand:
            serializeCardArray(
                game.playerHand
            ),


        lukyHand:
            serializeCardArray(
                game.lukyHand
            ),


        drawPile:
            serializeCardArray(
                game.drawPile
            ),


        discardPile:
            serializeCardArray(
                game.discardPile
            ),


        currentColor:
            game.currentColor,


        drawPenalty:
            normalizeNonNegativeInteger(
                game.drawPenalty
            ),


        topPenaltyType:
            game.topPenaltyType ||
            null,


        topPenaltyAmount:
            normalizeNonNegativeInteger(
                game.topPenaltyAmount
            ),


        skipChainCount:
            normalizeNonNegativeInteger(
                game.skipChainCount
            ),


        pendingPlayerUno:
            Boolean(
                game.pendingPlayerUno
            ),


        pendingLukyUno:
            Boolean(
                game.pendingLukyUno
            ),


        lukyForgotUno:
            Boolean(
                game.lukyForgotUno
            ),


        lukyUnoSaid:
            Boolean(
                game.lukyUnoSaid
            ),


        playerUnoDeferred:
            Boolean(
                game.playerUnoDeferred
            ),


        yellowEventEligible:
            Boolean(
                game.yellowEventEligible
            ),


        yellowEventAvailable:
            Boolean(
                game.yellowEventAvailable
            ),


        yellowEventUsed:
            Boolean(
                game.yellowEventUsed
            ),


        playerForcedDrawStreak:
            normalizeNonNegativeInteger(
                game.playerForcedDrawStreak
            ),


        turnCount:
            normalizeNonNegativeInteger(
                game.turnCount
            ),


        history,


        lastAction:
            normalizeHistoryEntry(
                game.lastAction
            ) ||
            history[0] ||
            null,


        gameNumber:
            Math.max(
                1,
                normalizeNonNegativeInteger(
                    game.gameNumber
                )
            ),


        startedAt:
            game.startedAt ||
            null,


        updatedAt:
            getSaveTimestamp()
    };
}


function serializeCardArray(
    cards
) {

    if (
        !Array.isArray(
            cards
        )
    ) {

        return [];
    }


    return cards.map(
        serializeCard
    );
}


/* =========================================================
   GET SLOT
========================================================= */

function getSaveSlot(
    slotIndex
) {

    const slots =
        loadSaveSlots();


    return (
        slots[
            slotIndex
        ] ||
        null
    );
}


/* =========================================================
   JE SLOT PRÁZDNÝ?
========================================================= */

function isSaveSlotEmpty(
    slot
) {

    return (
        !slot ||
        !slot.characterId
    );
}


/* =========================================================
   MÁ ROZEHRANOU PARTII?
========================================================= */

function hasActiveGame(
    slot
) {

    return Boolean(
        slot?.currentGame &&
        slot.currentGame.status !==
            "finished"
    );
}


/* =========================================================
   NOVÝ SLOT
========================================================= */

function createNewCharacterSlot(
    slotIndex,
    characterId,
    skinId = null
) {

    const character =
        getCharacterConfig(
            characterId
        );


    if (!character) {

        throw new Error(
            `Neznámá postava: ${characterId}`
        );
    }


    const resolvedSkinId =
        normalizeSkinId(
            characterId,
            skinId ||
            character.defaultSkinId
        );


    const timestamp =
        getSaveTimestamp();


    ensureFirstPlayedAt(
        timestamp
    );


    return {

        slotIndex,

        characterId,

        skinId:
            resolvedSkinId,

        wins:
            0,

        losses:
            0,

        currentGame:
            null,

        quoteHistory:
            createEmptyQuoteHistory(),

        createdAt:
            timestamp,

        updatedAt:
            timestamp
    };
}


/* =========================================================
   SAVE JEDNOHO SLOTU
========================================================= */

function saveSlot(
    slotIndex,
    slotData
) {

    const slots =
        loadSaveSlots();


    const normalized =
        normalizeSaveSlot(
            {
                ...slotData,

                slotIndex,

                updatedAt:
                    getSaveTimestamp()
            },
            slotIndex
        );


    slots[
        slotIndex
    ] =
        normalized;


    saveAllSlots(
        slots
    );


    return normalized;
}


/* =========================================================
   INICIALIZACE SLOTU
========================================================= */

function initializeSlot(
    slotIndex,
    characterId,
    skinId = null
) {

    const slots =
        loadSaveSlots();


    const slot =
        createNewCharacterSlot(
            slotIndex,
            characterId,
            skinId
        );


    slots[
        slotIndex
    ] =
        slot;


    saveAllSlots(
        slots
    );


    return slot;
}


/* =========================================================
   ZMĚNA SKINU
========================================================= */

function setSlotSkin(
    slotIndex,
    skinId
) {

    const slots =
        loadSaveSlots();


    const slot =
        slots[
            slotIndex
        ];


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {

        throw new Error(
            "Nelze změnit skin prázdného slotu."
        );
    }


    const skin =
        getConfiguredCharacterSkin(
            slot.characterId,
            skinId
        );


    if (!skin) {

        throw new Error(
            `Neznámý skin: ${skinId}`
        );
    }


    slot.skinId =
        skin.id;


    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(
        slots
    );


    return slot;
}


/* =========================================================
   SKIN SLOTU
========================================================= */

function getSlotSkin(
    slot
) {

    if (
        !slot ||
        !slot.characterId
    ) {

        return null;
    }


    const skinId =
        normalizeSkinId(
            slot.characterId,
            slot.skinId
        );


    return (
        getConfiguredCharacterSkin(
            slot.characterId,
            skinId
        ) ||
        getDefaultCharacterSkin(
            slot.characterId
        )
    );
}


/* =========================================================
   OBRÁZEK SLOTU
========================================================= */

function getSlotCharacterImage(
    slot
) {

    const skin =
        getSlotSkin(
            slot
        );


    if (
        skin?.image
    ) {

        return skin.image;
    }


    return (
        slot?.characterId
            ? getCharacterImage(
                slot.characterId
            )
            : ""
    );
}


/* =========================================================
   RESET SLOTU
========================================================= */

function resetSaveSlot(
    slotIndex
) {

    const slots =
        loadSaveSlots();


    const emptySlot =
        createEmptySaveSlot(
            slotIndex
        );


    slots[
        slotIndex
    ] =
        emptySlot;


    saveAllSlots(
        slots
    );


    return emptySlot;
}


/* =========================================================
   SAVE PARTIE
========================================================= */

function saveCurrentGame(
    slotIndex,
    gameState
) {

    const slots =
        loadSaveSlots();


    const slot =
        slots[
            slotIndex
        ];


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {

        throw new Error(
            "Nelze uložit partii do prázdného slotu."
        );
    }


    slot.currentGame =
        serializeSavedGame(
            gameState
        );


    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(
        slots
    );


    return slot.currentGame;
}


/* =========================================================
   SMAZÁNÍ ROZEHRANÉ PARTIE
========================================================= */

function clearCurrentGame(
    slotIndex
) {

    const slots =
        loadSaveSlots();


    const slot =
        slots[
            slotIndex
        ];


    if (!slot) {

        return null;
    }


    slot.currentGame =
        null;


    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(
        slots
    );


    return slot;
}


/* =========================================================
   LOAD PARTIE
========================================================= */

function loadCurrentGame(
    slotIndex
) {

    const slot =
        getSaveSlot(
            slotIndex
        );


    return slot?.currentGame
        ? normalizeSavedGame(
            slot.currentGame
        )
        : null;
}


/* =========================================================
   VÝHRA HRÁČE
========================================================= */

function registerPlayerWin(
    slotIndex
) {

    const slots =
        loadSaveSlots();


    const slot =
        slots[
            slotIndex
        ];


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {

        return null;
    }


    slot.wins +=
        1;


    slot.currentGame =
        null;


    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(
        slots
    );


    return slot;
}


/* =========================================================
   VÝHRA LUKYHO
========================================================= */

function registerLukyWin(
    slotIndex
) {

    const slots =
        loadSaveSlots();


    const slot =
        slots[
            slotIndex
        ];


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {

        return null;
    }


    slot.losses +=
        1;


    slot.currentGame =
        null;


    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(
        slots
    );


    return slot;
}


/* =========================================================
   W / L TEXT
========================================================= */

function getSlotRecordText(
    slot
) {

    if (!slot) {

        return "0 W / 0 L";
    }


    return (
        `${normalizeNonNegativeInteger(slot.wins)} W / ` +
        `${normalizeNonNegativeInteger(slot.losses)} L`
    );
}


/* =========================================================
   POČET ODEHRANÝCH HER
========================================================= */

function getSlotGamesPlayed(
    slot
) {

    if (!slot) {

        return 0;
    }


    return (
        normalizeNonNegativeInteger(
            slot.wins
        ) +
        normalizeNonNegativeInteger(
            slot.losses
        )
    );
}


/* =========================================================
   ČÍSLO DALŠÍ PARTIE
========================================================= */

function getNextGameNumber(
    slotIndex
) {

    const slot =
        getSaveSlot(
            slotIndex
        );


    return (
        getSlotGamesPlayed(
            slot
        ) +
        1
    );
}


/* =========================================================
   HISTORIE OPENING HLÁŠEK
========================================================= */

function getSlotQuoteHistory(
    slotIndex
) {

    const slot =
        getSaveSlot(
            slotIndex
        );


    return (
        slot?.quoteHistory ||
        createEmptyQuoteHistory()
    );
}


function saveSlotQuoteHistory(
    slotIndex,
    quoteHistory
) {

    const slots =
        loadSaveSlots();


    const slot =
        slots[
            slotIndex
        ];


    if (
        !slot ||
        isSaveSlotEmpty(
            slot
        )
    ) {

        return null;
    }


    slot.quoteHistory =
        normalizeQuoteHistory(
            quoteHistory
        );


    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(
        slots
    );


    return slot.quoteHistory;
}


/* =========================================================
   SOUHRNNÉ STATISTIKY SLOTŮ
========================================================= */

function getCombinedSlotStats() {

    const slots =
        loadSaveSlots();


    const timing =
        loadGlobalStats();


    const stats =
        slots.reduce(
            (
                result,
                slot
            ) => {

                result.playerWins +=
                    normalizeNonNegativeInteger(
                        slot.wins
                    );


                result.lukyWins +=
                    normalizeNonNegativeInteger(
                        slot.losses
                    );


                result.gamesPlayed +=
                    getSlotGamesPlayed(
                        slot
                    );


                return result;
            },
            {
                playerWins:
                    0,

                lukyWins:
                    0,

                gamesPlayed:
                    0
            }
        );


    return {

        ...stats,

        totalDurationMs:
            timing.totalDurationMs,

        timedGames:
            timing.timedGames,

        firstPlayedAt:
            timing.firstPlayedAt,

        completedGames:
            [
                ...timing.completedGames
            ]
    };
}


/* =========================================================
   EXISTUJE SLOT?
========================================================= */

function hasAnyInitializedSlot() {

    return loadSaveSlots()
        .some(
            (slot) =>
                !isSaveSlotEmpty(
                    slot
                )
        );
}


/* =========================================================
   PRVNÍ VÝBĚR POSTAVY?
========================================================= */

function isFirstCharacterSelection() {

    return !hasAnyInitializedSlot();
}


/* =========================================================
   EXPORT DEBUG
========================================================= */

function exportSaveData() {

    return {

        version:
            GAME_CONFIG
                .storageVersion,

        slots:
            loadSaveSlots()
                .map(
                    serializeSaveSlot
                ),

        globalStats:
            loadGlobalStats()
    };
}


/* =========================================================
   IMPORT DEBUG
========================================================= */

function importSaveData(
    data
) {

    if (
        !data ||
        !Array.isArray(
            data.slots
        )
    ) {

        throw new Error(
            "Neplatná save data."
        );
    }


    const slots =
        [];


    for (
        let index = 0;
        index < GAME_CONFIG.saveSlotCount;
        index += 1
    ) {

        slots.push(
            normalizeSaveSlot(
                data.slots[index],
                index
            )
        );
    }


    saveAllSlots(
        slots
    );


    if (
        data.globalStats &&
        typeof data.globalStats ===
            "object"
    ) {

        saveGlobalStats(
            data.globalStats
        );
    }


    return slots;
}


/* =========================================================
   RESET SLOTŮ PRO DEBUG

   Achievementy ani settings nemaže.
========================================================= */

function clearAllSaveSlots() {

    const slots =
        createDefaultSaveSlots();


    saveAllSlots(
        slots
    );


    return slots;
}
