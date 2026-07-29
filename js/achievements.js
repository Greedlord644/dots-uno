"use strict";


/* =========================================================
   DOTS UNO
   ACHIEVEMENTY + ODEMYKÁNÍ SKINŮ

   Achievementy jsou globální.
   Reset jednotlivého save slotu je NESMÍ smazat.

   Tento soubor ukládá:
   - celkové výhry
   - win streak
   - výhry podle postavy
   - speciální achievementy
   - odemčené achievementy
   - odemčené skiny
========================================================= */


/* =========================================================
   DEFINICE SKINŮ
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
            unlockedByAchievement:
                "dany_new_skin"
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
            unlockedByAchievement:
                "fila_new_skin"
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
            unlockedByAchievement:
                "96_new_skin"
        }
    ]
};


/* =========================================================
   DEFINICE ACHIEVEMENTŮ

   type:
   - win_streak
   - total_wins
   - character_wins
   - special
========================================================= */

const ACHIEVEMENT_DEFINITIONS = [

    {
        id: "hat_trick",

        title: "Hat-trick",

        description:
            "Vyhraj 3 hry v řadě.",

        type: "win_streak",

        target: 3
    },


    {
        id: "caught_luky_uno",

        title: "Neřekl jsi UNO!",

        description:
            "Nachytej Lukyho, když zapomene říct UNO.",

        type: "special",

        specialKey:
            "caughtLukyUno"
    },


    {
        id: "luky_has_yellow",

        title: "Má někdo žlutou?",

        description:
            "Přiměj Lukyho říct, že má žlutou.",

        type: "special",

        specialKey:
            "lukySaidHeHasYellow"
    },


    {
        id: "advanced",

        title: "Pokročilý",

        description:
            "Vyhraj 10 her.",

        type: "total_wins",

        target: 10
    },


    {
        id: "pro",

        title: "Profík",

        description:
            "Vyhraj 20 her.",

        type: "total_wins",

        target: 20
    },


    {
        id: "monster",

        title: "Monstrum",

        description:
            "Vyhraj 30 her.",

        type: "total_wins",

        target: 30
    },


    {
        id: "no_life",

        title: "No Life",

        description:
            "Vyhraj 50 her.",

        type: "total_wins",

        target: 50
    },


    {
        id: "dany_new_skin",

        title: "Dany - nový skin",

        description:
            "Vyhraj 5 her za Danyho.",

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

        description:
            "Vyhraj 5 her za Filipa.",

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

        description:
            "Vyhraj 5 her za 96.",

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
   VÝCHOZÍ DATA ACHIEVEMENTŮ
========================================================= */

function createDefaultAchievementData() {
    return {

        version:
            GAME_CONFIG.storageVersion,


        /*
            Celkový počet dokončených her.

            Zatím jej interně evidujeme, i když za něj
            momentálně není achievement.
        */

        gamesPlayed: 0,


        /*
            Celkové výhry hráče.
        */

        totalWins: 0,


        /*
            Celkové prohry proti Lukymu.
        */

        totalLosses: 0,


        /*
            Aktuální série výher.
        */

        currentWinStreak: 0,


        /*
            Nejlepší dosažená série výher.
        */

        bestWinStreak: 0,


        /*
            Výhry podle postavy.
        */

        winsByCharacter: {
            dany: 0,
            filip: 0,
            "96": 0
        },


        /*
            Speciální podmínky.
        */

        special: {

            caughtLukyUno: false,

            lukySaidHeHasYellow: false
        },


        /*
            ID již odemčených achievementů.
        */

        unlocked: [],


        /*
            Odemčené skiny.

            Default skiny sem ukládat nemusíme,
            ty jsou dostupné vždy.
        */

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
                        ?["96"]
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
                        ?["96"]
                )
        },


        updatedAt:
            normalizeOptionalString(
                rawData.updatedAt
            )
    };
}


function normalizeUniqueStringArray(value) {
    if (!Array.isArray(value)) {
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
            GAME_CONFIG.storage.achievementsKey,
            null
        );


    const normalized =
        normalizeAchievementData(raw);


    /*
        Při načtení znovu vyhodnotíme achievementy,
        aby případná nově přidaná podmínka fungovala
        i na starých save datech.
    */

    evaluateAchievements(
        normalized,
        false
    );


    return normalized;
}


function saveAchievementData(data) {
    const normalized =
        normalizeAchievementData(data);


    normalized.updatedAt =
        getSaveTimestamp();


    writeJsonToStorage(
        GAME_CONFIG.storage.achievementsKey,
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


    return data.unlocked.includes(
        achievementId
    );
}


/* =========================================================
   PROGRES ACHIEVEMENTU
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


    switch (definition.type) {

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
   VYHODNOCENÍ VŠECH ACHIEVEMENTŮ

   announce = true:
   vrátí nově odemčené achievementy, které UI může
   zobrazit jako toast.
========================================================= */

function evaluateAchievements(
    data,
    announce = true
) {
    const newlyUnlocked = [];


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
                /*
                    Achievement už máme.

                    Pro jistotu znovu aplikujeme reward,
                    aby staré nebo ručně upravené save
                    neztratily odemčený skin.
                */

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
   ODMĚNA ACHIEVEMENTU
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
        reward.type === "skin"
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
        !data.unlockedSkins[
            characterId
        ]
    ) {
        data.unlockedSkins[
            characterId
        ] = [];
    }


    if (
        !data
            .unlockedSkins[
                characterId
            ]
            .includes(
                skinId
            )
    ) {
        data
            .unlockedSkins[
                characterId
            ]
            .push(
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
        Default je dostupný vždy.
    */

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
   DEFINICE SKINU
========================================================= */

function getCharacterSkin(
    characterId,
    skinId
) {
    const skins =
        CHARACTER_SKINS[
            characterId
        ];


    if (!Array.isArray(skins)) {
        return null;
    }


    return (
        skins.find(
            (skin) =>
                skin.id === skinId
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
   DŮVOD ZAMČENÉHO SKINU

   UI může zobrazit např.:

   🔒
   Dany - nový skin
   Vyhraj 5 her za Danyho.
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
   REGISTRACE DOKONČENÉ PARTIE
========================================================= */

function registerFinishedGameForAchievements({
    winner,
    characterId
}) {
    const data =
        loadAchievementData();


    data.gamesPlayed += 1;


    /*
        VÝHRA HRÁČE
    */

    if (
        winner === "player"
    ) {
        data.totalWins += 1;

        data.currentWinStreak += 1;

        data.bestWinStreak =
            Math.max(
                data.bestWinStreak,
                data.currentWinStreak
            );


        if (
            Object.prototype.hasOwnProperty.call(
                data.winsByCharacter,
                characterId
            )
        ) {
            data.winsByCharacter[
                characterId
            ] += 1;
        }
    }


    /*
        VÝHRA LUKYHO
    */

    if (
        winner === "luky"
    ) {
        data.totalLosses += 1;

        data.currentWinStreak = 0;
    }


    const newlyUnlocked =
        evaluateAchievements(
            data,
            true
        );


    saveAchievementData(data);


    return {
        data,
        newlyUnlocked
    };
}


/* =========================================================
   LUKY ZAPOMNĚL UNO A HRÁČ HO NACHYTAL
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


    saveAchievementData(data);


    return {
        data,
        newlyUnlocked
    };
}


/* =========================================================
   EVENT "MÁ NĚKDO ŽLUTOU?"

   Volá se pouze pokud Luky opravdu odpoví "Já.".
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


    saveAchievementData(data);


    return {
        data,
        newlyUnlocked
    };
}


/* =========================================================
   DATA PRO UI ACHIEVEMENTŮ
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
                    data
                        .unlocked
                        .includes(
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
   GLOBÁLNÍ ACHIEVEMENT STATISTIKY
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
   WIN / LOSE OBRÁZKY

   Tyto obrázky nejsou skiny.
   Používají se pouze na konci partie.
========================================================= */

const END_SCREEN_IMAGES = {

    player: {

        dany: {
            win:
                "assets/images/Dany_default.jpg",

            lose:
                "assets/images/Dany_default.jpg"
        },


        filip: {
            win:
                "assets/images/Fila_win.png",

            lose:
                "assets/images/Fila_lose.jpg"
        },


        "96": {
            win:
                "assets/images/Pavel_win.png",

            lose:
                "assets/images/Pavel_lose.png"
        }
    },


    luky: {

        win:
            "assets/images/Luky_win.png",

        lose:
            "assets/images/Luky_lose.png"
    }
};


/* =========================================================
   ZÍSKÁNÍ WIN / LOSE OBRÁZKU
========================================================= */

function getPlayerEndScreenImage(
    characterId,
    result
) {
    const character =
        END_SCREEN_IMAGES
            .player[
                characterId
            ];


    if (!character) {
        return null;
    }


    return (
        character[result] ||
        null
    );
}


function getLukyEndScreenImage(
    result
) {
    return (
        END_SCREEN_IMAGES
            .luky[result] ||
        null
    );
}


/* =========================================================
   EMOTE OBRÁZKY

   Samotná logika kdy se zobrazí bude v game.js / ui.js.

   Zde pouze definujeme schválené obrázky.
========================================================= */

const CHARACTER_EMOTES = {

    luky: {

        /*
            Silně výhodná situace:
            +2, +4, výrazně méně karet apod.
        */

        grin:
            "assets/images/Luky_grin.jpg",


        /*
            Mírnější výhodná situace:
            Stůj, hráč musí lízat apod.
        */

        mild:
            "assets/images/Luky_emote.jpg"
    },


    "96": {

        /*
            Silně špatná situace:
            +2, +4, vysoká penalizace,
            opakované nucené lízání...
        */

        angry:
            "assets/images/Pavel_angry.jpg",


        /*
            Mírnější nepříjemnost.
        */

        inDanger:
            "assets/images/Pavel_in_danger.png"
    }
};


/* =========================================================
   EMOTE COOLDOWN

   Globální cooldown:
   5 až 8 sekund.

   Jedna situace = maximálně jeden emote.

   Win / lose obrazovka se tímto cooldownem neřídí.
========================================================= */

const EMOTE_CONFIG = {

    durationMinMs: 2000,

    durationMaxMs: 3000,

    cooldownMinMs: 5000,

    cooldownMaxMs: 8000
};


/* =========================================================
   NÁHODNÁ DÉLKA EMOTU
========================================================= */

function getRandomEmoteDuration() {
    return randomInteger(
        EMOTE_CONFIG.durationMinMs,
        EMOTE_CONFIG.durationMaxMs
    );
}


/* =========================================================
   NÁHODNÝ COOLDOWN EMOTU
========================================================= */

function getRandomEmoteCooldown() {
    return randomInteger(
        EMOTE_CONFIG.cooldownMinMs,
        EMOTE_CONFIG.cooldownMaxMs
    );
}


/* =========================================================
   RESET ACHIEVEMENTŮ PRO DEBUG

   Normálně se ve hře hráči nezobrazuje.

   Sloty nemaže.
========================================================= */

function clearAchievementData() {
    const data =
        createDefaultAchievementData();


    saveAchievementData(data);


    return data;
}
