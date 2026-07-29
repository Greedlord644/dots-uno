"use strict";


/* =========================================================
   DOTS UNO
   SAVE SYSTÉM

   Ukládá:
   - 3 sloty
   - vybranou postavu slotu
   - W / L slotu
   - rozehranou partii
   - historii použitých opening hlášek

   Achievementy se ukládají zvlášť v achievements.js.
========================================================= */


/* =========================================================
   ZÁKLADNÍ STRUKTURA SLOTU
========================================================= */

function createEmptySaveSlot(slotIndex) {
    return {
        slotIndex,

        characterId: null,

        wins: 0,

        losses: 0,

        currentGame: null,

        quoteHistory:
            createEmptyQuoteHistory(),

        createdAt: null,

        updatedAt: null
    };
}


/* =========================================================
   PRÁZDNÉ SLOTY
========================================================= */

function createDefaultSaveSlots() {
    const slots = [];

    for (
        let index = 0;
        index < GAME_CONFIG.saveSlotCount;
        index += 1
    ) {
        slots.push(
            createEmptySaveSlot(index)
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
            localStorage.getItem(key);

        if (!raw) {
            return fallbackValue;
        }

        return JSON.parse(raw);
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
            JSON.stringify(value)
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
    return new Date().toISOString();
}


/* =========================================================
   VALIDACE SLOTU
========================================================= */

function normalizeSaveSlot(
    rawSlot,
    slotIndex
) {
    const empty =
        createEmptySaveSlot(slotIndex);

    if (
        !rawSlot ||
        typeof rawSlot !== "object"
    ) {
        return empty;
    }


    const characterId =
        typeof rawSlot.characterId === "string" &&
        getCharacterConfig(rawSlot.characterId)
            ? rawSlot.characterId
            : null;


    return {
        slotIndex,

        characterId,

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
   VALIDACE ROZEHRANÉ HRY

   Detailní pravidla hry budou řešit game.js.
   Save vrstva pouze ověřuje základní strukturu.
========================================================= */

function normalizeSavedGame(rawGame) {
    if (
        !rawGame ||
        typeof rawGame !== "object"
    ) {
        return null;
    }


    if (
        rawGame.status === "finished"
    ) {
        return null;
    }


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
            rawGame.turn === "luky"
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

        skipChainCount:
            normalizeNonNegativeInteger(
                rawGame.skipChainCount
            ),

        pendingPlayerUno:
            Boolean(
                rawGame.pendingPlayerUno
            ),

        pendingLukyUno:
            Boolean(
                rawGame.pendingLukyUno
            ),

        lukyForgotUno:
            Boolean(
                rawGame.lukyForgotUno
            ),

        yellowEventAvailable:
            Boolean(
                rawGame.yellowEventAvailable
            ),

        yellowEventUsed:
            Boolean(
                rawGame.yellowEventUsed
            ),

        gameNumber:
            Math.max(
                1,
                normalizeNonNegativeInteger(
                    rawGame.gameNumber
                )
            ),

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
   KARTY ZE SAVE
========================================================= */

function normalizeCardArray(cards) {
    if (!Array.isArray(cards)) {
        return [];
    }


    return cards
        .map(
            (card) =>
                deserializeCard(card)
        )
        .filter(Boolean);
}


/* =========================================================
   HISTORIE HLÁŠEK
========================================================= */

function normalizeQuoteHistory(rawHistory) {
    const fallback =
        createEmptyQuoteHistory();

    if (
        !rawHistory ||
        typeof rawHistory !== "object"
    ) {
        return fallback;
    }


    const characterHistory = {};

    const rawCharacters =
        rawHistory.opening?.character;


    if (
        rawCharacters &&
        typeof rawCharacters === "object"
    ) {
        Object.entries(
            rawCharacters
        ).forEach(
            ([characterId, indexes]) => {

                if (
                    Array.isArray(indexes)
                ) {
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
            }
        );
    }


    const general =
        Array.isArray(
            rawHistory.opening?.general
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
   POMOCNÁ VALIDACE
========================================================= */

function normalizeNonNegativeInteger(
    value
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor(number)
    );
}


function normalizeOptionalString(
    value
) {
    if (
        typeof value !== "string"
    ) {
        return null;
    }

    const trimmed =
        value.trim();

    return trimmed || null;
}


function normalizeCardColor(
    value
) {
    const allowed = new Set([
        CARD_COLORS.RED,
        CARD_COLORS.YELLOW,
        CARD_COLORS.GREEN,
        CARD_COLORS.BLUE
    ]);

    return allowed.has(value)
        ? value
        : null;
}


/* =========================================================
   NAČTENÍ VŠECH SLOTŮ
========================================================= */

function loadSaveSlots() {
    const rawSlots =
        readJsonFromStorage(
            GAME_CONFIG.storage.slotsKey,
            null
        );


    if (!Array.isArray(rawSlots)) {
        const defaults =
            createDefaultSaveSlots();

        saveAllSlots(defaults);

        return defaults;
    }


    const slots = [];

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
   ULOŽENÍ VŠECH SLOTŮ
========================================================= */

function saveAllSlots(slots) {
    const normalized = [];

    for (
        let index = 0;
        index < GAME_CONFIG.saveSlotCount;
        index += 1
    ) {
        normalized.push(
            serializeSaveSlot(
                slots[index] ||
                createEmptySaveSlot(index)
            )
        );
    }


    return writeJsonToStorage(
        GAME_CONFIG.storage.slotsKey,
        normalized
    );
}


/* =========================================================
   SERIALIZACE SLOTU
========================================================= */

function serializeSaveSlot(slot) {
    return {
        slotIndex:
            slot.slotIndex,

        characterId:
            slot.characterId,

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
   SERIALIZACE ROZEHRANÉ PARTIE
========================================================= */

function serializeSavedGame(game) {
    if (!game) {
        return null;
    }


    return {
        version:
            GAME_CONFIG.storageVersion,

        status:
            game.status ||
            "playing",

        turn:
            game.turn === "luky"
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

        yellowEventAvailable:
            Boolean(
                game.yellowEventAvailable
            ),

        yellowEventUsed:
            Boolean(
                game.yellowEventUsed
            ),

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


function serializeCardArray(cards) {
    if (!Array.isArray(cards)) {
        return [];
    }

    return cards.map(
        serializeCard
    );
}


/* =========================================================
   ZÍSKÁNÍ SLOTU
========================================================= */

function getSaveSlot(slotIndex) {
    const slots =
        loadSaveSlots();

    return (
        slots[slotIndex] ||
        null
    );
}


/* =========================================================
   JE SLOT PRÁZDNÝ?
========================================================= */

function isSaveSlotEmpty(slot) {
    return (
        !slot ||
        !slot.characterId
    );
}


/* =========================================================
   MÁ SLOT ROZEHRANOU PARTII?
========================================================= */

function hasActiveGame(slot) {
    return Boolean(
        slot?.currentGame &&
        slot.currentGame.status !== "finished"
    );
}


/* =========================================================
   VYTVOŘENÍ NOVÉHO SLOTU S POSTAVOU

   Toto se používá pouze při:
   - založení hry v prázdném slotu
   - kompletním resetu slotu a následném výběru postavy

   W/L tedy začíná 0 / 0.
========================================================= */

function createNewCharacterSlot(
    slotIndex,
    characterId
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


    const timestamp =
        getSaveTimestamp();


    return {
        slotIndex,

        characterId,

        wins: 0,

        losses: 0,

        currentGame: null,

        quoteHistory:
            createEmptyQuoteHistory(),

        createdAt:
            timestamp,

        updatedAt:
            timestamp
    };
}


/* =========================================================
   ULOŽENÍ JEDNOHO SLOTU
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


    slots[slotIndex] =
        normalized;


    saveAllSlots(slots);


    return normalized;
}


/* =========================================================
   ZALOŽENÍ POSTAVY V PRÁZDNÉM SLOTU
========================================================= */

function initializeSlot(
    slotIndex,
    characterId
) {
    const slots =
        loadSaveSlots();


    const slot =
        createNewCharacterSlot(
            slotIndex,
            characterId
        );


    slots[slotIndex] =
        slot;


    saveAllSlots(slots);


    return slot;
}


/* =========================================================
   RESET SLOTU

   Maže:
   - postavu
   - W/L
   - rozehranou partii
   - historii openingů tohoto slotu

   Achievementy se zde vůbec neřeší,
   takže zůstávají zachované.
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


    slots[slotIndex] =
        emptySlot;


    saveAllSlots(slots);


    return emptySlot;
}


/* =========================================================
   ULOŽENÍ ROZEHRANÉ PARTIE
========================================================= */

function saveCurrentGame(
    slotIndex,
    gameState
) {
    const slots =
        loadSaveSlots();

    const slot =
        slots[slotIndex];


    if (
        !slot ||
        isSaveSlotEmpty(slot)
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


    saveAllSlots(slots);


    return slot.currentGame;
}


/* =========================================================
   SMAZÁNÍ ROZEHRANÉ PARTIE

   W/L zůstává.
========================================================= */

function clearCurrentGame(
    slotIndex
) {
    const slots =
        loadSaveSlots();

    const slot =
        slots[slotIndex];


    if (!slot) {
        return null;
    }


    slot.currentGame = null;

    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(slots);


    return slot;
}


/* =========================================================
   NAČTENÍ ROZEHRANÉ PARTIE
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
        slots[slotIndex];


    if (
        !slot ||
        isSaveSlotEmpty(slot)
    ) {
        return null;
    }


    slot.wins += 1;

    slot.currentGame = null;

    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(slots);


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
        slots[slotIndex];


    if (
        !slot ||
        isSaveSlotEmpty(slot)
    ) {
        return null;
    }


    slot.losses += 1;

    slot.currentGame = null;

    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(slots);


    return slot;
}


/* =========================================================
   W / L TEXT
========================================================= */

function getSlotRecordText(slot) {
    if (!slot) {
        return "0 W / 0 L";
    }


    return (
        `${normalizeNonNegativeInteger(slot.wins)} W / ` +
        `${normalizeNonNegativeInteger(slot.losses)} L`
    );
}


/* =========================================================
   POČET ODEHRANÝCH HER SLOTU
========================================================= */

function getSlotGamesPlayed(slot) {
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
   POŘADOVÉ ČÍSLO DALŠÍ PARTIE SLOTU
========================================================= */

function getNextGameNumber(
    slotIndex
) {
    const slot =
        getSaveSlot(
            slotIndex
        );


    return (
        getSlotGamesPlayed(slot) +
        1
    );
}


/* =========================================================
   HISTORIE HLÁŠEK SLOTU
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


/* =========================================================
   ULOŽENÍ HISTORIE HLÁŠEK SLOTU
========================================================= */

function saveSlotQuoteHistory(
    slotIndex,
    quoteHistory
) {
    const slots =
        loadSaveSlots();

    const slot =
        slots[slotIndex];


    if (
        !slot ||
        isSaveSlotEmpty(slot)
    ) {
        return null;
    }


    slot.quoteHistory =
        normalizeQuoteHistory(
            quoteHistory
        );


    slot.updatedAt =
        getSaveTimestamp();


    saveAllSlots(slots);


    return slot.quoteHistory;
}


/* =========================================================
   GLOBÁLNÍ STATISTIKY PRO HLAVNÍ MENU

   Součet ze všech slotů.

   Nejde o achievement data.
========================================================= */

function getCombinedSlotStats() {
    const slots =
        loadSaveSlots();


    return slots.reduce(
        (stats, slot) => {

            stats.playerWins +=
                normalizeNonNegativeInteger(
                    slot.wins
                );

            stats.lukyWins +=
                normalizeNonNegativeInteger(
                    slot.losses
                );

            stats.gamesPlayed +=
                getSlotGamesPlayed(
                    slot
                );

            return stats;
        },
        {
            playerWins: 0,
            lukyWins: 0,
            gamesPlayed: 0
        }
    );
}


/* =========================================================
   EXISTUJE UŽ NĚJAKÝ ZALOŽENÝ SLOT?

   Hodí se pro zvýraznění doporučené postavy 96
   při úplně prvním založení hry.
========================================================= */

function hasAnyInitializedSlot() {
    return loadSaveSlots().some(
        (slot) =>
            !isSaveSlotEmpty(slot)
    );
}


/* =========================================================
   PRVNÍ SPUŠTĚNÍ HRY?
========================================================= */

function isFirstCharacterSelection() {
    return !hasAnyInitializedSlot();
}


/* =========================================================
   IMPORT / EXPORT PRO DEBUG

   Zatím se nezobrazuje hráči.

   Hodí se během vývoje, když budeme potřebovat
   zkontrolovat save data v konzoli.
========================================================= */

function exportSaveData() {
    return {
        version:
            GAME_CONFIG.storageVersion,

        slots:
            loadSaveSlots()
                .map(
                    serializeSaveSlot
                )
    };
}


function importSaveData(data) {
    if (
        !data ||
        !Array.isArray(data.slots)
    ) {
        throw new Error(
            "Neplatná save data."
        );
    }


    const slots = [];

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


    saveAllSlots(slots);


    return slots;
}


/* =========================================================
   KOMPLETNÍ SMAZÁNÍ SLOTŮ PRO DEBUG

   POZOR:
   Achievementy nemaže.
========================================================= */

function clearAllSaveSlots() {
    const slots =
        createDefaultSaveSlots();


    saveAllSlots(slots);


    return slots;
}
