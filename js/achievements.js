"use strict";


/* =========================================================
   DOTS UNO
   ACHIEVEMENTY + SKINY
========================================================= */


/* =========================================================
   DEFINICE ACHIEVEMENTŮ

   Základní pořadí:
   1) skiny
   2) Hat-trick
   3) výhry 10–300
   4) speciální achievementy

   V UI mají vždy prioritu NESPLNĚNÉ achievementy.
   Uvnitř nesplněných i splněných se zachovává toto
   základní pořadí definic.
========================================================= */

const ACHIEVEMENT_DEFINITIONS = [

    /* =====================================================
       SKINY
    ===================================================== */

    {
        id:
            "dany_new_skin",

        title:
            "Nový skin - Dvojka",

        description:
            "Vyhraj 5 her za Danyho.",

        type:
            "character_wins",

        characterId:
            "dany",

        target:
            GAME_CONFIG
                .achievements
                .skinWinsTarget,

        image:
            "assets/images/Dany_skin1.jpg",

        imageType:
            "reward",

        reward: {

            type:
                "skin",

            characterId:
                "dany",

            skinId:
                "skin1"
        }
    },


    {
        id:
            "fila_new_skin",

        title:
            "Nový skin - Gazelka",

        description:
            "Vyhraj 5 her za Filipa.",

        type:
            "character_wins",

        characterId:
            "filip",

        target:
            GAME_CONFIG
                .achievements
                .skinWinsTarget,

        image:
            "assets/images/Fila_skin1.jpg",

        imageType:
            "reward",

        reward: {

            type:
                "skin",

            characterId:
                "filip",

            skinId:
                "skin1"
        }
    },


    {
        id:
            "96_new_skin",

        title:
            "Nový skin - Osvícený",

        description:
            "Vyhraj 5 her za 96.",

        type:
            "character_wins",

        characterId:
            "96",

        target:
            GAME_CONFIG
                .achievements
                .skinWinsTarget,

        image:
            "assets/images/Pavel_skin1.jpg",

        imageType:
            "reward",

        reward: {

            type:
                "skin",

            characterId:
                "96",

            skinId:
                "skin1"
        }
    },


    /* =====================================================
       HAT-TRICK
    ===================================================== */

    {
        id:
            "hat_trick",

        title:
            "Hat-trick",

        description:
            "Vyhraj 3 hry v řadě.",

        type:
            "win_streak",

        target:
            GAME_CONFIG
                .achievements
                .winStreakTarget
    },


    /* =====================================================
       VÝHRY
    ===================================================== */

    {
        id:
            "advanced",

        title:
            "Pokročilý",

        description:
            "Vyhraj 10 her.",

        type:
            "total_wins",

        target:
            GAME_CONFIG
                .achievements
                .advancedWinsTarget
    },


    {
        id:
            "pro",

        title:
            "Profík",

        description:
            "Vyhraj 20 her.",

        type:
            "total_wins",

        target:
            GAME_CONFIG
                .achievements
                .proWinsTarget
    },


    {
        id:
            "monster",

        title:
            "Monstrum",

        description:
            "Vyhraj 30 her.",

        type:
            "total_wins",

        target:
            GAME_CONFIG
                .achievements
                .monsterWinsTarget
    },


    {
        id:
            "no_life",

        title:
            "No Life",

        description:
            "Vyhraj 50 her.",

        type:
            "total_wins",

        target:
            GAME_CONFIG
                .achievements
                .noLifeWinsTarget
    },


    {
        id:
            "no_life_was_not_enough",

        title:
            "No Life nestačil, takže je tu tohle",

        description:
            "Vyhraj 100 her.",

        type:
            "total_wins",

        target:
            GAME_CONFIG
                .achievements
                .noLifeWasNotEnoughWinsTarget
    },


    {
        id:
            "wtf",

        title:
            "WTF?",

        description:
            "Vyhraj 200 her.",

        type:
            "total_wins",

        target:
            GAME_CONFIG
                .achievements
                .wtfWinsTarget
    },


    {
        id:
            "stop",

        title:
            "Stop!",

        description:
            "Vyhraj 300 her.",

        type:
            "total_wins",

        target:
            GAME_CONFIG
                .achievements
                .stopWinsTarget
    },


    /* =====================================================
       SPECIÁLNÍ
    ===================================================== */

    {
        id:
            "luky_has_yellow",

        title:
            "Má někdo žlutou?",

        description:
            "Přiměj Lukyho říct, že má žlutou.",

        type:
            "special",

        specialKey:
            "lukySaidHeHasYellow",

        imageType:
            "card",

        cardPreview: {

            color:
                "yellow",

            type:
                "number",

            value:
                7
        }
    },


    {
        id:
            "caught_luky_uno",

        title:
            "Neřekl jsi UNO!",

        description:
            "Nachytej Lukyho, když zapomene říct UNO.",

        type:
            "special",

        specialKey:
            "caughtLukyUno"
    }
];


/* =========================================================
   VÝCHOZÍ DATA
========================================================= */

function createDefaultAchievementData() {

    return {

        version:
            GAME_CONFIG
                .storageVersion,

        gamesPlayed:
            0,

        totalWins:
            0,

        totalLosses:
            0,

        currentWinStreak:
            0,

        bestWinStreak:
            0,

        winsByCharacter: {

            dany:
                0,

            filip:
                0,

            "96":
                0
        },

        special: {

            caughtLukyUno:
                false,

            lukySaidHeHasYellow:
                false
        },

        unlocked:
            [],

        unlockedSkins: {

            dany:
                [],

            filip:
                [],

            "96":
                []
        },

        updatedAt:
            null
    };
}


/* =========================================================
   NORMALIZACE
========================================================= */

function normalizeAchievementData(
    rawData
) {

    const fallback =
        createDefaultAchievementData();


    if (
        !rawData ||
        typeof rawData !==
            "object"
    ) {

        return fallback;
    }


    return {

        version:
            normalizeNonNegativeInteger(
                rawData.version
            ) ||
            GAME_CONFIG
                .storageVersion,


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


/* =========================================================
   UNIKÁTNÍ STRING ARRAY
========================================================= */

function normalizeUniqueStringArray(
    value
) {

    if (
        !Array.isArray(value)
    ) {

        return [];
    }


    return [
        ...new Set(
            value.filter(
                (item) =>
                    typeof item ===
                        "string" &&
                    item.length >
                        0
            )
        )
    ];
}


/* =========================================================
   LOAD
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
        Starší uložená data mohou už podmínku
        novějšího achievementu splňovat.
    */

    const newlyUnlocked =
        evaluateAchievements(
            data,
            false
        );


    /*
        evaluateAchievements může doplnit skin,
        který ve starém save chyběl.
    */

    if (
        newlyUnlocked.length >
        0
    ) {

        saveAchievementData(
            data
        );
    }


    return data;
}


/* =========================================================
   SAVE
========================================================= */

function saveAchievementData(
    data
) {

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
   DEFINICE PODLE ID
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
   JE ACHIEVEMENT ODEMČENÝ?
========================================================= */

function isAchievementUnlocked(
    achievementId,
    achievementData = null
) {

    const data =
        achievementData ||
        loadAchievementData();


    return data
        .unlocked
        .includes(
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

            current:
                0,

            target:
                1,

            completed:
                false
        };
    }


    switch (
        definition.type
    ) {

        case "win_streak": {

            /*
                Dokud Hat-trick není odemčený, progres ukazuje
                AKTUÁLNÍ sérii výher. Prohra tedy vrátí progres
                na 0/3.

                Jakmile byl achievement jednou odemčený, zůstává
                trvale dokončený a UI už ukazuje 3/3.
            */

            const unlocked =
                data.unlocked.includes(
                    definition.id
                );


            const current =
                unlocked
                    ? definition.target
                    : data.currentWinStreak;


            return {

                current:
                    Math.min(
                        current,
                        definition.target
                    ),

                target:
                    definition.target,

                completed:
                    unlocked ||
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
                        definition
                            .characterId
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
                            definition
                                .specialKey
                        ]
                );


            return {

                current:
                    completed
                        ? 1
                        : 0,

                target:
                    1,

                completed
            };
        }


        default:

            return {

                current:
                    0,

                target:
                    1,

                completed:
                    false
            };
    }
}


/* =========================================================
   VYHODNOCENÍ
========================================================= */

function evaluateAchievements(
    data,
    announce = true
) {

    const newlyUnlocked =
        [];


    ACHIEVEMENT_DEFINITIONS
        .forEach(
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


                const alreadyUnlocked =
                    data
                        .unlocked
                        .includes(
                            definition.id
                        );


                if (
                    !alreadyUnlocked
                ) {

                    data.unlocked.push(
                        definition.id
                    );


                    if (announce) {

                        newlyUnlocked.push(
                            definition
                        );
                    }
                }


                /*
                    Reward aplikujeme vždy.
                    To opraví i starší uložená data,
                    kde achievement existoval, ale skin ne.
                */

                applyAchievementReward(
                    definition,
                    data
                );
            }
        );


    return newlyUnlocked;
}


/* =========================================================
   ODMĚNA
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
   ODEMKNOUT SKIN
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

        data
            .unlockedSkins[
                characterId
            ] = [];
    }


    const skins =
        data
            .unlockedSkins[
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

    /*
        Default skin je vždy dostupný.
    */

    if (
        skinId ===
        "default"
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

   Zdroj skinů je nyní pouze config.js.
========================================================= */

function getCharacterSkin(
    characterId,
    skinId
) {

    return (
        getConfiguredCharacterSkin(
            characterId,
            skinId
        ) ||
        null
    );
}


function getCharacterSkins(
    characterId
) {

    return getConfiguredCharacterSkins(
        characterId
    );
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

            unlocked:
                true,

            achievement:
                null
        };
    }


    const achievement =
        getAchievementDefinition(
            skin
                .unlockedByAchievement
        );


    return {

        unlocked:
            false,

        achievement
    };
}


/* =========================================================
   KONEC PARTIE
========================================================= */

function registerFinishedGameForAchievements({
    winner,
    characterId,
    durationMs = 0,
    startedAt = null
}) {

    /*
        Časové statistiky jsou oddělené od achievement dat.
        Staré dokončené hry se zpětně nedopočítávají; od této
        verze se každá nově dokončená partie zapíše právě jednou.
    */

    registerFinishedGameTiming({
        durationMs,
        startedAt
    });


    const data =
        loadAchievementData();


    data.gamesPlayed +=
        1;


    if (
        winner ===
        "player"
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
                    data
                        .winsByCharacter,
                    characterId
                )
        ) {

            data
                .winsByCharacter[
                    characterId
                ] += 1;
        }
    }


    if (
        winner ===
        "luky"
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

        data:
            savedData,

        newlyUnlocked
    };
}


/* =========================================================
   NEŘEKL JSI UNO!
========================================================= */

function registerCaughtLukyUnoAchievement() {

    const data =
        loadAchievementData();


    data
        .special
        .caughtLukyUno =
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

        data:
            savedData,

        newlyUnlocked
    };
}


/* =========================================================
   MÁ NĚKDO ŽLUTOU?
========================================================= */

function registerLukyYellowAchievement() {

    const data =
        loadAchievementData();


    data
        .special
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

        data:
            savedData,

        newlyUnlocked
    };
}


/* =========================================================
   DATA PRO UI
========================================================= */

function getAchievementViewData() {

    const data =
        loadAchievementData();


    return ACHIEVEMENT_DEFINITIONS
        .map(
            (definition, originalIndex) => {

                const progress =
                    getAchievementProgress(
                        definition,
                        data
                    );


                const unlocked =
                    data
                        .unlocked
                        .includes(
                            definition.id
                        );


                return {

                    ...definition,

                    unlocked,

                    current:
                        progress.current,

                    target:
                        progress.target,

                    completed:
                        progress.completed,

                    /*
                        Interní pořadí je použito jen pro stabilní sort.
                        Do UI se nijak nevypisuje.
                    */

                    _originalIndex:
                        originalIndex
                };
            }
        )
        .sort(
            (a, b) => {

                /*
                    Všechny nesplněné achievementy jsou vždy nahoře.
                    Jakmile se achievement odemkne, přesune se mezi
                    splněné. Uvnitř obou skupin zůstává původní
                    pořadí ACHIEVEMENT_DEFINITIONS.
                */

                if (
                    a.unlocked !==
                    b.unlocked
                ) {

                    return a.unlocked
                        ? 1
                        : -1;
                }


                return (
                    a._originalIndex -
                    b._originalIndex
                );
            }
        )
        .map(
            ({
                _originalIndex,
                ...achievement
            }) =>
                achievement
        );
}


/* =========================================================
   POČET ODEMČENÝCH
========================================================= */

function getUnlockedAchievementCount() {

    const data =
        loadAchievementData();


    return data
        .unlocked
        .length;
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
            ...data
                .winsByCharacter
        },

        unlockedCount:
            data
                .unlocked
                .length,

        totalAchievements:
            ACHIEVEMENT_DEFINITIONS
                .length
    };
}


/* =========================================================
   DEBUG RESET
========================================================= */

function clearAchievementData() {

    const data =
        createDefaultAchievementData();


    return saveAchievementData(
        data
    );
}
