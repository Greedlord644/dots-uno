"use strict";


/* =========================================================
   DOTS UNO
   ACHIEVEMENTY + SKINY

   Achievementy jsou globální.
   Reset save slotu je nemaže.
========================================================= */


/* =========================================================
   SKINY
========================================================= */

const CHARACTER_SKINS = {

    dany: [
        {
            id: "default",
            name: "Výchozí",
            image: "assets/images/Dany_default.jpg",
            unlockedByDefault: true
        },
        {
            id: "skin1",
            name: "Skin 1",
            image: "assets/images/Dany_skin1.jpg",
            unlockedByAchievement: "dany_new_skin"
        }
    ],

    filip: [
        {
            id: "default",
            name: "Výchozí",
            image: "assets/images/Fila_default.jpg",
            unlockedByDefault: true
        },
        {
            id: "skin1",
            name: "Skin 1",
            image: "assets/images/Fila_skin1.jpg",
            unlockedByAchievement: "fila_new_skin"
        }
    ],

    "96": [
        {
            id: "default",
            name: "Výchozí",
            image: "assets/images/Pavel_default.png",
            unlockedByDefault: true
        },
        {
            id: "skin1",
            name: "Skin 1",
            image: "assets/images/Pavel_skin1.jpg",
            unlockedByAchievement: "96_new_skin"
        }
    ]
};


/* =========================================================
   ACHIEVEMENTY
========================================================= */

const ACHIEVEMENT_DEFINITIONS = [

    {
        id: "hat_trick",
        title: "Hat-trick",
        description: "Vyhraj 3 hry v řadě.",
        type: "win_streak",
        target: 3
    },

    {
        id: "caught_luky_uno",
        title: "Neřekl jsi UNO!",
        description: "Nachytej Lukyho, když zapomene říct UNO.",
        type: "special",
        specialKey: "caughtLukyUno"
    },

    {
        id: "luky_has_yellow",
        title: "Má někdo žlutou?",
        description: "Přiměj Lukyho říct, že má žlutou.",
        type: "special",
        specialKey: "lukySaidHeHasYellow"
    },

    {
        id: "advanced",
        title: "Pokročilý",
        description: "Vyhraj 10 her.",
        type: "total_wins",
        target: 10
    },

    {
        id: "pro",
        title: "Profík",
        description: "Vyhraj 20 her.",
        type: "total_wins",
        target: 20
    },

    {
        id: "monster",
        title: "Monstrum",
        description: "Vyhraj 30 her.",
        type: "total_wins",
        target: 30
    },

    {
        id: "no_life",
        title: "No Life",
        description: "Vyhraj 50 her.",
        type: "total_wins",
        target: 50
    },

    {
        id: "dany_new_skin",
        title: "Dany - nový skin",
        description: "Vyhraj 5 her za Danyho.",
        type: "character_wins",
        characterId: "dany",
        target: 5,

        reward: {
            type: "skin",
            characterId: "dany",
            skinId: "skin1"
        }
    },

    {
        id: "fila_new_skin",
        title: "Fila - nový skin",
        description: "Vyhraj 5 her za Filipa.",
        type: "character_wins",
        characterId: "filip",
        target: 5,

        reward: {
            type: "skin",
            characterId: "filip",
            skinId: "skin1"
        }
    },

    {
        id: "96_new_skin",
        title: "96 - nový skin",
        description: "Vyhraj 5 her za 96.",
        type: "character_wins",
        characterId: "96",
        target: 5,

        reward: {
            type: "skin",
            characterId: "96",
            skinId: "skin1"
        }
    }
];


/* =========================================================
   VÝCHOZÍ DATA
========================================================= */

function createDefaultAchievementData() {

    return {

        version:
            GAME_CONFIG.storageVersion,

        gamesPlayed: 0,

        totalWins: 0,

        totalLosses: 0,

        currentWinStreak: 0,

        bestWinStreak: 0,

        winsByCharacter: {
            dany: 0,
            filip: 0,
            "96": 0
        },

        special: {
            caughtLukyUno: false,
            lukySaidHeHasYellow: false
        },

        unlocked: [],

        unlockedSkins: {
            dany: [],
            filip: [],
            "96": []
        },

        updatedAt: null
    };
}


/* =========================================================
   NORMALIZACE
========================================================= */

function normalizeAchievementData(rawData) {

    const fallback =
        createDefaultAchievementData();


    if (
        !rawData ||
        typeof rawData !== "object"
    ) {
        return fallback;
    }


    return {

        version:
            normalizeNonNegativeInteger(
                rawData.version
            ) ||
            GAME_CONFIG.storageVersion,


        gamesPlayed:
            normalizeNonNegativeInteger(
                rawData.gamesPlayed
            ),


        totalWins:
            normalizeNonNegativeInteger(
                rawData.totalWins
            ),


        totalLosses:
            normalizeNonNegativeInteger(
                rawData.totalLosses
            ),


        currentWinStreak:
            normalizeNonNegativeInteger(
                rawData.currentWinStreak
            ),


        bestWinStreak:
            normalizeNonNegativeInteger(
                rawData.bestWinStreak
            ),


        winsByCharacter: {

            dany:
                normalizeNonNegativeInteger(
                    rawData
                        .winsByCharacter
                        ?.dany
                ),

            filip:
                normalizeNonNegativeInteger(
                    rawData
                        .winsByCharacter
                        ?.filip
                ),

            "96":
                normalizeNonNegativeInteger(
                    rawData
                        .winsByCharacter
                        ?.["96"]
                )
        },


        special: {

            caughtLukyUno:
                Boolean(
                    rawData
                        .special
                        ?.caughtLukyUno
                ),

            lukySaidHeHasYellow:
                Boolean(
                    rawData
                        .special
                        ?.lukySaidHeHasYellow
                )
        },


        unlocked:
            normalizeUniqueStringArray(
                rawData.unlocked
            ),


        unlockedSkins: {

            dany:
                normalizeUniqueStringArray(
                    rawData
                        .unlockedSkins
                        ?.dany
                ),

            filip:
                normalizeUniqueStringArray(
                    rawData
                        .unlockedSkins
                        ?.filip
                ),

            "96":
                normalizeUniqueStringArray(
                    rawData
                        .unlockedSkins
                        ?.["96"]
                )
        },


        updatedAt:
            normalizeOptionalString(
                rawData.updatedAt
            )
    };
}


function normalizeUniqueStringArray(value) {

    if (
        !Array.isArray(value)
    ) {
        return [];
    }


    return [
        ...new Set(
            value.filter(
                (item) =>
                    typeof item === "string" &&
                    item.length > 0
            )
        )
    ];
}


/* =========================================================
   LOAD / SAVE
========================================================= */

function loadAchievementData() {

    const raw =
        readJsonFromStorage(
            GAME_CONFIG
                .storage
                .achievementsKey,
            null
        );


    const data =
        normalizeAchievementData(
            raw
        );


    /*
        Pokud jsme mezitím přidali achievement,
        zkontrolujeme stará data znovu.
    */

    evaluateAchievements(
        data,
        false
    );


    return data;
}


function saveAchievementData(data) {

    const normalized =
        normalizeAchievementData(
            data
        );


    normalized.updatedAt =
        getSaveTimestamp();


    writeJsonToStorage(
        GAME_CONFIG
            .storage
            .achievementsKey,
        normalized
    );


    return normalized;
}


/* =========================================================
   DEFINICE ACHIEVEMENTU
========================================================= */

function getAchievementDefinition(
    achievementId
) {

    return (
        ACHIEVEMENT_DEFINITIONS.find(
            (achievement) =>
                achievement.id ===
                achievementId
        ) ||
        null
    );
}


/* =========================================================
   ODEMČENÍ ACHIEVEMENTU
========================================================= */

function isAchievementUnlocked(
    achievementId,
    achievementData = null
) {

    const data =
        achievementData ||
        loadAchievementData();


    return data.unlocked.includes(
        achievementId
    );
}


/* =========================================================
   PROGRES
========================================================= */

function getAchievementProgress(
    definition,
    data
) {

    if (
        !definition ||
        !data
    ) {

        return {
            current: 0,
            target: 1,
            completed: false
        };
    }


    switch (
        definition.type
    ) {

        case "win_streak": {

            const current =
                data.bestWinStreak;


            return {

                current:
                    Math.min(
                        current,
                        definition.target
                    ),

                target:
                    definition.target,

                completed:
                    current >=
                    definition.target
            };
        }


        case "total_wins": {

            const current =
                data.totalWins;


            return {

                current:
                    Math.min(
                        current,
                        definition.target
                    ),

                target:
                    definition.target,

                completed:
                    current >=
                    definition.target
            };
        }


        case "character_wins": {

            const current =
                data
                    .winsByCharacter
                    ?.[
                        definition.characterId
                    ] ||
                0;


            return {

                current:
                    Math.min(
                        current,
                        definition.target
                    ),

                target:
                    definition.target,

                completed:
                    current >=
                    definition.target
            };
        }


        case "special": {

            const completed =
                Boolean(
                    data
                        .special
                        ?.[
                            definition.specialKey
                        ]
                );


            return {

                current:
                    completed
                        ? 1
                        : 0,

                target: 1,

                completed
            };
        }


        default:

            return {
                current: 0,
                target: 1,
                completed: false
            };
    }
}


/* =========================================================
   VYHODNOCENÍ ACHIEVEMENTŮ
========================================================= */

function evaluateAchievements(
    data,
    announce = true
) {

    const newlyUnlocked =
        [];


    ACHIEVEMENT_DEFINITIONS.forEach(
        (definition) => {

            const progress =
                getAchievementProgress(
                    definition,
                    data
                );


            if (
                !progress.completed
            ) {
                return;
            }


            if (
                data.unlocked.includes(
                    definition.id
                )
            ) {

                applyAchievementReward(
                    definition,
                    data
                );


                return;
            }


            data.unlocked.push(
                definition.id
            );


            applyAchievementReward(
                definition,
                data
            );


            if (announce) {

                newlyUnlocked.push(
                    definition
                );
            }
        }
    );


    return newlyUnlocked;
}


/* =========================================================
   ODMĚNY
========================================================= */

function applyAchievementReward(
    definition,
    data
) {

    const reward =
        definition?.reward;


    if (!reward) {
        return;
    }


    if (
        reward.type ===
        "skin"
    ) {

        unlockSkinInData(
            data,
            reward.characterId,
            reward.skinId
        );
    }
}


/* =========================================================
   ODEMKNUTÍ SKINU
========================================================= */

function unlockSkinInData(
    data,
    characterId,
    skinId
) {

    if (
        !data
            .unlockedSkins[
                characterId
            ]
    ) {

        data.unlockedSkins[
            characterId
        ] = [];
    }


    const skins =
        data.unlockedSkins[
            characterId
        ];


    if (
        !skins.includes(
            skinId
        )
    ) {

        skins.push(
            skinId
        );
    }
}


/* =========================================================
   JE SKIN ODEMČENÝ?
========================================================= */

function isSkinUnlocked(
    characterId,
    skinId,
    achievementData = null
) {

    if (
        skinId === "default"
    ) {
        return true;
    }


    const data =
        achievementData ||
        loadAchievementData();


    return Boolean(
        data
            .unlockedSkins
            ?.[characterId]
            ?.includes(
                skinId
            )
    );
}


/* =========================================================
   SKINY POSTAVY
========================================================= */

function getCharacterSkin(
    characterId,
    skinId
) {

    const skins =
        CHARACTER_SKINS[
            characterId
        ];


    if (
        !Array.isArray(skins)
    ) {
        return null;
    }


    return (
        skins.find(
            (skin) =>
                skin.id ===
                skinId
        ) ||
        null
    );
}


function getCharacterSkins(
    characterId
) {

    return [
        ...(
            CHARACTER_SKINS[
                characterId
            ] ||
            []
        )
    ];
}


/* =========================================================
   INFO O ODEMKNUTÍ SKINU
========================================================= */

function getSkinUnlockInfo(
    characterId,
    skinId,
    achievementData = null
) {

    const skin =
        getCharacterSkin(
            characterId,
            skinId
        );


    if (!skin) {
        return null;
    }


    if (
        skin.unlockedByDefault ||
        isSkinUnlocked(
            characterId,
            skinId,
            achievementData
        )
    ) {

        return {
            unlocked: true,
            achievement: null
        };
    }


    const achievement =
        getAchievementDefinition(
            skin.unlockedByAchievement
        );


    return {
        unlocked: false,
        achievement
    };
}


/* =========================================================
   KONEC PARTIE
========================================================= */

function registerFinishedGameForAchievements({
    winner,
    characterId
}) {

    const data =
        loadAchievementData();


    data.gamesPlayed +=
        1;


    if (
        winner === "player"
    ) {

        data.totalWins +=
            1;


        data.currentWinStreak +=
            1;


        data.bestWinStreak =
            Math.max(
                data.bestWinStreak,
                data.currentWinStreak
            );


        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    data.winsByCharacter,
                    characterId
                )
        ) {

            data.winsByCharacter[
                characterId
            ] += 1;
        }
    }


    if (
        winner === "luky"
    ) {

        data.totalLosses +=
            1;


        data.currentWinStreak =
            0;
    }


    const newlyUnlocked =
        evaluateAchievements(
            data,
            true
        );


    const savedData =
        saveAchievementData(
            data
        );


    return {
        data: savedData,
        newlyUnlocked
    };
}


/* =========================================================
   NEŘEKL JSI UNO!
========================================================= */

function registerCaughtLukyUnoAchievement() {

    const data =
        loadAchievementData();


    data.special.caughtLukyUno =
        true;


    const newlyUnlocked =
        evaluateAchievements(
            data,
            true
        );


    const savedData =
        saveAchievementData(
            data
        );


    return {
        data: savedData,
        newlyUnlocked
    };
}


/* =========================================================
   MÁ NĚKDO ŽLUTOU?
========================================================= */

function registerLukyYellowAchievement() {

    const data =
        loadAchievementData();


    data.special
        .lukySaidHeHasYellow =
        true;


    const newlyUnlocked =
        evaluateAchievements(
            data,
            true
        );


    const savedData =
        saveAchievementData(
            data
        );


    return {
        data: savedData,
        newlyUnlocked
    };
}


/* =========================================================
   DATA PRO ACHIEVEMENT UI
========================================================= */

function getAchievementViewData() {

    const data =
        loadAchievementData();


    return ACHIEVEMENT_DEFINITIONS.map(
        (definition) => {

            const progress =
                getAchievementProgress(
                    definition,
                    data
                );


            return {

                ...definition,

                unlocked:
                    data.unlocked.includes(
                        definition.id
                    ),

                current:
                    progress.current,

                target:
                    progress.target,

                completed:
                    progress.completed
            };
        }
    );
}


/* =========================================================
   POČET ODEMČENÝCH ACHIEVEMENTŮ
========================================================= */

function getUnlockedAchievementCount() {

    const data =
        loadAchievementData();


    return data.unlocked.length;
}


/* =========================================================
   GLOBÁLNÍ STATISTIKY
========================================================= */

function getAchievementStats() {

    const data =
        loadAchievementData();


    return {

        gamesPlayed:
            data.gamesPlayed,

        totalWins:
            data.totalWins,

        totalLosses:
            data.totalLosses,

        currentWinStreak:
            data.currentWinStreak,

        bestWinStreak:
            data.bestWinStreak,

        winsByCharacter: {
            ...data.winsByCharacter
        },

        unlockedCount:
            data.unlocked.length,

        totalAchievements:
            ACHIEVEMENT_DEFINITIONS.length
    };
}


/* =========================================================
   DEBUG RESET

   Sloty nemaže.
========================================================= */

function clearAchievementData() {

    const data =
        createDefaultAchievementData();


    return saveAchievementData(
        data
    );
}
