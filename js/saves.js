"use strict";


/* =========================================================
   DOTS UNO
   SAVE SYSTÉM

   Ukládá:
   - 3 sloty
   - vybranou postavu slotu
   - vybraný skin slotu
   - W / L slotu
   - rozehranou partii
   - historii použitých opening hlášek

   Achievementy jsou globální a ukládají se zvlášť.
========================================================= */


/* =========================================================
   ZÁKLADNÍ STRUKTURA SLOTU
========================================================= */

function createEmptySaveSlot(slotIndex) {
    return {
        slotIndex,

        characterId: null,

        skinId: null,

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
   SKIN SLOTU

   Pokud save pochází ze starší verze a skinId chybí,
   automaticky použijeme default skin postavy.
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
        typeof rawSkinId !== "string" ||
        !rawSkinId.trim()
    ) {
        return defaultSkinId;
    }


    const requestedSkin =
        getConfiguredCharacterSkin(
            characterId,
            rawSkinId.trim()
        );


    return requestedSkin
        ? requestedSkin.id
        : defaultSkinId;
}


/* =========================================================
   VALIDACE ROZEHRANÉ HRY
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

        playerForcedDrawStreak:
            normalizeNonNegativeInteger(
                rawGame.playerForcedDrawStreak
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

        playerForcedDrawStreak:
            normalizeNonNegativeInteger(
                game.playerForcedDrawStreak
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

   Defaultně nastaví výchozí skin.
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


    return {
        slotIndex,

        characterId,

        skinId:
            resolvedSkinId,

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

   Výběr skinu je volitelný.
   Pokud není uveden, použije se default.
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


    slots[slotIndex] =
        slot;


    saveAllSlots(slots);


    return slot;
}


/* =========================================================
   ZMĚNA SKINU SLOTU

   Ověří, že skin existuje.

   Samotné ověření odemčení skinu dělá achievement vrstva
   před zavoláním této funkce.
========================================================= */

function setSlotSkin(
    slotIndex,
    skinId
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


    saveAllSlots(slots);


    return slot;
}


/* =========================================================
   ZÍSKÁNÍ VYBRANÉHO SKINU SLOTU
========================================================= */

function getSlotSkin(slot) {
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
   OBRÁZEK POSTAVY SLOTU
========================================================= */

function getSlotCharacterImage(slot) {
    const skin =
        getSlotSkin(slot);


    if (skin?.image) {
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

   Maže:
   - postavu
   - skin
   - W/L
   - rozehranou partii
   - historii openingů tohoto slotu

   Achievementy se nemažou.
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

   W/L, postava a skin zůstávají.
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

   Achievementy ale mají vlastní globální progres,
   takže toto je pouze přehled aktuálních slotů.
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
========================================================= */

function hasAnyInitializedSlot() {
    return loadSaveSlots().some(
        (slot) =>
            !isSaveSlotEmpty(slot)
    );
}


/* =========================================================
   PRVNÍ VÝBĚR POSTAVY?
========================================================= */

function isFirstCharacterSelection() {
    return !hasAnyInitializedSlot();
}


/* =========================================================
   EXPORT SAVE PRO DEBUG
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


/* =========================================================
   IMPORT SAVE PRO DEBUG
========================================================= */

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

   Achievementy nemaže.
========================================================= */

function clearAllSaveSlots() {
    const slots =
        createDefaultSaveSlots();


    saveAllSlots(slots);


    return slots;
}
