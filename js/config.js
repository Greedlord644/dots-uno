"use strict";


/* =========================================================
   DOTS UNO
   CENTRÁLNÍ KONFIGURACE HRY
========================================================= */


const GAME_CONFIG = {

    /* =====================================================
       ZÁKLAD
    ===================================================== */

    gameName:
        "DOTS UNO",

    startingHandSize:
        7,

    saveSlotCount:
        3,

    storageVersion:
        3,


    /* =====================================================
       POSTAVY
    ===================================================== */

    characters: {

        dany: {

            id:
                "dany",

            name:
                "Dany",

            defaultSkinId:
                "default",

            defaultImage:
                "assets/images/Dany_default.jpg",

            fallback:
                "D"
        },


        filip: {

            id:
                "filip",

            name:
                "Filip",

            defaultSkinId:
                "default",

            defaultImage:
                "assets/images/Fila_default.jpg",

            fallback:
                "F"
        },


        "96": {

            id:
                "96",

            name:
                "96",

            defaultSkinId:
                "default",

            defaultImage:
                "assets/images/Pavel_default.png",

            fallback:
                "96",

            recommended:
                true
        }
    },


    /* =====================================================
       LUKY
    ===================================================== */

    opponent: {

        id:
            "luky",

        name:
            "Luky",

        defaultImage:
            "assets/images/Luky_default.png",

        fallback:
            "L",

        winImage:
            "assets/images/Luky_win.png",

        loseImage:
            "assets/images/Luky_lose.png",

        emotes: {

            grin:
                "assets/images/Luky_grin.jpg",

            mild:
                "assets/images/Luky_emote.jpg"
        }
    },


    /* =====================================================
       SKINY
    ===================================================== */

    skins: {

        dany: [

            {
                id:
                    "default",

                name:
                    "Výchozí",

                image:
                    "assets/images/Dany_default.jpg",

                unlockedByDefault:
                    true
            },

            {
                id:
                    "skin1",

                name:
                    "Dvojka",

                image:
                    "assets/images/Dany_skin1.jpg",

                unlockedByAchievement:
                    "dany_new_skin"
            }
        ],


        filip: [

            {
                id:
                    "default",

                name:
                    "Výchozí",

                image:
                    "assets/images/Fila_default.jpg",

                unlockedByDefault:
                    true
            },

            {
                id:
                    "skin1",

                name:
                    "Gazelka",

                image:
                    "assets/images/Fila_skin1.jpg",

                unlockedByAchievement:
                    "fila_new_skin"
            }
        ],


        "96": [

            {
                id:
                    "default",

                name:
                    "Výchozí",

                image:
                    "assets/images/Pavel_default.png",

                unlockedByDefault:
                    true
            },

            {
                id:
                    "skin1",

                name:
                    "Osvícený",

                image:
                    "assets/images/Pavel_skin1.jpg",

                unlockedByAchievement:
                    "96_new_skin"
            }
        ]
    },


    /* =====================================================
       WIN / LOSE OBRÁZKY HRÁČE
    ===================================================== */

    endScreenImages: {

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


    /* =====================================================
       EMOTY HRÁČE
    ===================================================== */

    characterEmotes: {

        "96": {

            angry:
                "assets/images/Pavel_angry.jpg",

            inDanger:
                "assets/images/Pavel_in_danger.png"
        }
    },


    /* =====================================================
       BRANDING / LOGO

       Logo se používá v hlavním menu.
    ===================================================== */

    branding: {

        logoImage:
            "assets/images/logo.png"
    },


    /* =====================================================
       LUKYHO PŘEMÝŠLENÍ

       Standardně 2–4 sekundy.
       Občas 6–8 sekund.
       S velkou rukou trochu rychleji.
    ===================================================== */

    aiThinking: {

        normalMinMs:
            2000,

        normalMaxMs:
            4000,

        slowChance:
            0.16,

        slowMinMs:
            6000,

        slowMaxMs:
            8000,

        largeHandThreshold:
            12,

        largeHandMinMs:
            1500,

        largeHandMaxMs:
            3000,

        showThinkingDotsChance:
            0.48,

        thinkingDotsMinMs:
            900
    },


    /* =====================================================
       UNO HRÁČE
    ===================================================== */

    playerUno: {

        /*
            Timer začne až po dokončení případného
            rozhodnutí hráče:
            - výběr barvy
            - rozhodnutí po sedmičce
        */

        callWindowMs:
            3000,

        missedPenaltyCards:
            2
    },


    /* =====================================================
       UNO LUKYHO
    ===================================================== */

    lukyUno: {

        forgetChance:
            0.18,

        forgottenWindowMinMs:
            2000,

        forgottenWindowMaxMs:
            5000,

        caughtPenaltyCards:
            2,

        afterUnoPhraseMinMs:
            2000,

        afterUnoPhraseMaxMs:
            3000
    },


    /* =====================================================
       HLÁŠKY
    ===================================================== */

    speech: {

        defaultDurationMs:
            2600,

        shortDurationMs:
            1600,

        longDurationMs:
            3600,

        /*
            Úvodní hláška zůstane až 6 sekund.
            UI ji zároveň schová při prvním
            skutečném tahu hráče.
        */

        openingDurationMs:
            6000,

        sequencePauseMs:
            850,

        /*
            Průběžné Lukyho hlášky během partie.

            Další hláška se naplánuje náhodně
            mezi 2 a 3 minutami.

            Specifická hláška pro zvolenou postavu
            se během jedné partie smí použít
            maximálně jednou. Poté se používají
            jen obecné hlášky.
        */

        ambientEnabled:
            true,

        ambientMinMs:
            120000,

        ambientMaxMs:
            180000,

        specificAmbientMaxPerGame:
            1
    },


    /* =====================================================
       HUDBA

       Zdroj:
       YouTube video U5yeo4MMSKg

       Při každé nové partii se náhodně vybere jeden
       z níže uvedených začátků skladeb.

       Nastavení zapnuto/vypnuto bude globální
       a uložené přes dotsUno.settings.
    ===================================================== */

    music: {

        enabledByDefault:
            true,

        provider:
            "youtube",

        youtube: {

            videoId:
                "U5yeo4MMSKg",

            playerElementId:
                "youtube-music-player"
        },

        /*
            0–100.
        */

        volume:
            32,

        tracks: [

            {
                id:
                    "orff_fortuna",

                title:
                    "Orff - Fortuna",

                startSeconds:
                    0
            },

            {
                id:
                    "wagner_valkyries",

                title:
                    "Wagner - Ride of the Valkyries",

                startSeconds:
                    154
            },

            {
                id:
                    "beethoven_5_1",

                title:
                    "Beethoven - Symphony No. 5: I. Allegro con brio",

                startSeconds:
                    464
            },

            {
                id:
                    "mozart_40_1",

                title:
                    "Mozart - Symphony No. 40: I. Molto allegro",

                startSeconds:
                    950
            },

            {
                id:
                    "mozart_requiem_dies_irae",

                title:
                    "Mozart - Requiem: Dies irae",

                startSeconds:
                    1399
            },

            {
                id:
                    "verdi_requiem_dies_irae",

                title:
                    "Verdi - Requiem: Dies irae",

                startSeconds:
                    1517
            },

            {
                id:
                    "beethoven_5_3",

                title:
                    "Beethoven - Symphony No. 5: III. Allegro",

                startSeconds:
                    1637
            },

            {
                id:
                    "beethoven_egmont",

                title:
                    "Beethoven - Egmont: Overture",

                startSeconds:
                    2171
            },

            {
                id:
                    "beethoven_9_2",

                title:
                    "Beethoven - Symphony No. 9: II. Molto vivace",

                startSeconds:
                    2714
            },

            {
                id:
                    "schubert_4_1",

                title:
                    "Schubert - Symphony No. 4 'Tragic': I. Adagio molto",

                startSeconds:
                    3542
            },

            {
                id:
                    "mozart_40_4",

                title:
                    "Mozart - Symphony No. 40: IV. Allegro assai",

                startSeconds:
                    4129
            },

            {
                id:
                    "vivaldi_winter",

                title:
                    "Vivaldi - The Four Seasons: Winter I",

                startSeconds:
                    4552
            },

            {
                id:
                    "vivaldi_summer",

                title:
                    "Vivaldi - The Four Seasons: Summer III",

                startSeconds:
                    4749
            },

            {
                id:
                    "grieg_mountain_king",

                title:
                    "Grieg - In the Hall of the Mountain King",

                startSeconds:
                    4919
            },

            {
                id:
                    "tchaikovsky_piano_concerto",

                title:
                    "Tchaikovsky - Piano Concerto No. 1: III. Allegro con fuoco",

                startSeconds:
                    5079
            },

            {
                id:
                    "rachmaninoff_etude_39_5",

                title:
                    "Rachmaninoff - Études-Tableaux Op. 39 No. 5",

                startSeconds:
                    5493
            },

            {
                id:
                    "chopin_op10_12",

                title:
                    "Chopin - Étude Op. 10 No. 12",

                startSeconds:
                    5817
            },

            {
                id:
                    "chopin_op25_11",

                title:
                    "Chopin - Étude Op. 25 No. 11",

                startSeconds:
                    5970
            },

            {
                id:
                    "chopin_op25_12",

                title:
                    "Chopin - Étude Op. 25 No. 12",

                startSeconds:
                    6183
            },

            {
                id:
                    "chopin_prelude_24",

                title:
                    "Chopin - Prelude Op. 28 No. 24",

                startSeconds:
                    6333
            },

            {
                id:
                    "bach_busoni_toccata",

                title:
                    "Bach/Busoni - Toccata and Fugue in D Minor",

                startSeconds:
                    6507
            }
        ]
    },


    /* =====================================================
       +2 / +4
    ===================================================== */

    drawStacking: {

        drawTwoAlwaysPlayable:
            true,

        drawFourAlwaysPlayable:
            true,

        singleDrawTwoOnDrawFourAllowed:
            false,

        minimumDrawTwosAgainstDrawFour:
            2
    },

    /* =====================================================
       STŮJ
    ===================================================== */
   
    skipStacking: {

        enabled:
            true,

        playerCanAcceptSkip:
            true,

        aiCanAcceptSkip:
            true
    },


    /* =====================================================
       SEDMIČKA
    ===================================================== */

    sevenSwap: {

        enabled:
            true,

        playerCanChoose:
            true,

        aiAlwaysSwaps:
            true
    },


    /* =====================================================
       STEJNÉ KARTY NAJEDNOU
    ===================================================== */

    multiPlay: {

        enabled:
            true,

        requireExactMatch:
            true
    },


    /* =====================================================
       DRAG & DROP KARET
    ===================================================== */

    cardInteraction: {

        /*
            O kolik pixelů musí karta při tažení
            směrem nahoru překročit práh,
            aby se pokusila zahrát.

            Pokud je karta přímo nad odhazovacím
            prostorem, stačí samotný drop.
        */

        dragPlayThresholdPx:
            90,

        /*
            Pohyb menší než tato hodnota
            stále považujeme za kliknutí.
        */

        clickMovementTolerancePx:
            8
    },


    /* =====================================================
       AI
    ===================================================== */

    ai: {

        /*
            Luky se nejdříve snaží zahrát
            rozumnou kartu podle aktuální situace.

            Pokud má více možností se stejným
            hodnocením, může mezi nimi náhodně
            vybrat.
        */

        randomizeEqualChoices:
            true,

        /*
            Preferovat akční karty, pokud tím
            může hráče dostat pod tlak.
        */

        preferActionCards:
            true,

        /*
            Při výběru barvy po divoké kartě
            preferuje barvu, které má v ruce
            nejvíce.
        */

        chooseMostCommonColor:
            true
    },


    /* =====================================================
       EVENT "MÁ NĚKDO ŽLUTOU?"
    ===================================================== */

    yellowEvent: {

        enabled:
            true,

        /*
            Dokud hráč v konkrétním slotu otázku
            alespoň jednou skutečně nepoužije,
            dostane ji v každé partii jako
            garantovanou příležitost.

            V první i dalších takových partiích
            se objeví náhodně 30–60 sekund
            po začátku hry a zůstane dostupná
            5 sekund.
        */

        firstUseGuaranteed:
            true,

        firstUseDelayMinMs:
            30000,

        firstUseDelayMaxMs:
            60000,

        firstUseWindowMs:
            5000,

        repeatUntilFirstUse:
            true,

        /*
            Po prvním skutečném použití otázky
            se vrací původní vzácná logika:
            způsobilá je každá pátá partie,
            maximálně jednou za partii.
        */

        everyNthGame:
            5,

        maxOccurrencesPerGame:
            1
    },


    /* =====================================================
       ACHIEVEMENTY
    ===================================================== */

    achievements: {

        dany_new_skin: {

            id:
                "dany_new_skin",

            characterId:
                "dany",

            title:
                "Nový skin",

            description:
                "Vyhraj 5 partií za Danyho.",

            type:
                "wins",

            target:
                5,

            reward: {

                type:
                    "skin",

                characterId:
                    "dany",

                skinId:
                    "skin1"
            }
        },


        fila_new_skin: {

            id:
                "fila_new_skin",

            characterId:
                "filip",

            title:
                "Nový skin",

            description:
                "Vyhraj 5 partií za Filipa.",

            type:
                "wins",

            target:
                5,

            reward: {

                type:
                    "skin",

                characterId:
                    "filip",

                skinId:
                    "skin1"
            }
        },


        "96_new_skin": {

            id:
                "96_new_skin",

            characterId:
                "96",

            title:
                "Nový skin",

            description:
                "Vyhraj 5 partií za 96.",

            type:
                "wins",

            target:
                5,

            reward: {

                type:
                    "skin",

                characterId:
                    "96",

                skinId:
                    "skin1"
            }
        }
    }
};


/* =========================================================
   ODVOZENÉ KONSTANTY
========================================================= */


const CARD_COLORS = [
    "red",
    "yellow",
    "green",
    "blue"
];


const CARD_COLOR_LABELS = {

    red:
        "červená",

    yellow:
        "žlutá",

    green:
        "zelená",

    blue:
        "modrá"
};


const CARD_TYPES = {

    NUMBER:
        "number",

    SKIP:
        "skip",

    REVERSE:
        "reverse",

    DRAW_TWO:
        "draw2",

    WILD:
        "wild",

    WILD_DRAW_FOUR:
        "wild4",

    SEVEN:
        "seven"
};


/* =========================================================
   CHARACTERS
========================================================= */

function getCharacterConfig(
    characterId
) {

    return (
        GAME_CONFIG
            .characters[
                characterId
            ] ||
        null
    );
}


function getCharacterName(
    characterId
) {

    return (
        getCharacterConfig(
            characterId
        )?.name ||
        characterId ||
        "Hráč"
    );
}


function getCharacterSkins(
    characterId
) {

    return (
        GAME_CONFIG
            .skins[
                characterId
            ] ||
        []
    );
}


function getCharacterSkin(
    characterId,
    skinId
) {

    const skins =
        getCharacterSkins(
            characterId
        );


    return (
        skins.find(
            (skin) =>
                skin.id ===
                skinId
        ) ||
        null
    );
}


function getDefaultCharacterSkin(
    characterId
) {

    const character =
        getCharacterConfig(
            characterId
        );


    if (!character) {
        return null;
    }


    return (
        getCharacterSkin(
            characterId,
            character.defaultSkinId
        ) ||
        getCharacterSkins(
            characterId
        )[0] ||
        null
    );
}


function getCharacterImage(
    characterId,
    skinId = null
) {

    const skin =
        skinId
            ? getCharacterSkin(
                characterId,
                skinId
            )
            : getDefaultCharacterSkin(
                characterId
            );


    if (
        skin?.image
    ) {

        return skin.image;
    }


    return (
        getCharacterConfig(
            characterId
        )?.defaultImage ||
        null
    );
}


function getCharacterEndImage(
    characterId,
    result
) {

    const config =
        GAME_CONFIG
            .endScreenImages[
                characterId
            ];


    if (!config) {

        return getCharacterImage(
            characterId
        );
    }


    return (
        config[result] ||
        getCharacterImage(
            characterId
        )
    );
}


/* =========================================================
   SKINY
========================================================= */

function getSkinUnlockAchievementId(
    characterId,
    skinId
) {

    return (
        getCharacterSkin(
            characterId,
            skinId
        )?.unlockedByAchievement ||
        null
    );
}


function isDefaultSkin(
    characterId,
    skinId
) {

    const character =
        getCharacterConfig(
            characterId
        );


    return Boolean(
        character &&
        character.defaultSkinId ===
            skinId
    );
}


/* =========================================================
   KARTY
========================================================= */

function isCardColor(
    color
) {

    return CARD_COLORS.includes(
        color
    );
}


function isWildCard(
    card
) {

    return Boolean(
        card &&
        (
            card.type ===
                CARD_TYPES.WILD ||
            card.type ===
                CARD_TYPES.WILD_DRAW_FOUR
        )
    );
}


function isDrawCard(
    card
) {

    return Boolean(
        card &&
        (
            card.type ===
                CARD_TYPES.DRAW_TWO ||
            card.type ===
                CARD_TYPES.WILD_DRAW_FOUR
        )
    );
}


function isSkipCard(
    card
) {

    return Boolean(
        card &&
        card.type ===
            CARD_TYPES.SKIP
    );
}


function isSevenCard(
    card
) {

    return Boolean(
        card &&
        card.type ===
            CARD_TYPES.SEVEN
    );
}


function getCardDisplayValue(
    card
) {

    if (!card) {
        return "";
    }


    switch (
        card.type
    ) {

        case CARD_TYPES.NUMBER:
            return String(
                card.value
            );


        case CARD_TYPES.SKIP:
            return "⊘";


        case CARD_TYPES.REVERSE:
            return "↻";


        case CARD_TYPES.DRAW_TWO:
            return "+2";


        case CARD_TYPES.WILD:
            return "W";


        case CARD_TYPES.WILD_DRAW_FOUR:
            return "+4";


        case CARD_TYPES.SEVEN:
            return "7";


        default:
            return (
                card.value ??
                "?"
            );
    }
}


function getCardDescription(
    card
) {

    if (!card) {
        return "";
    }


    const color =
        CARD_COLOR_LABELS[
            card.color
        ] ||
        "";


    switch (
        card.type
    ) {

        case CARD_TYPES.NUMBER:
            return `${color} ${card.value}`;


        case CARD_TYPES.SKIP:
            return `${color} Stůj`;


        case CARD_TYPES.REVERSE:
            return `${color} Změna směru`;


        case CARD_TYPES.DRAW_TWO:
            return `${color} +2`;


        case CARD_TYPES.WILD:
            return "Změna barvy";


        case CARD_TYPES.WILD_DRAW_FOUR:
            return "Změna barvy +4";


        case CARD_TYPES.SEVEN:
            return `${color} 7`;


        default:
            return "Karta";
    }
}


function areCardsIdentical(
    cardA,
    cardB
) {

    if (
        !cardA ||
        !cardB
    ) {
        return false;
    }


    if (
        cardA.type !==
        cardB.type
    ) {
        return false;
    }


    if (
        cardA.color !==
        cardB.color
    ) {
        return false;
    }


    if (
        cardA.type ===
        CARD_TYPES.NUMBER
    ) {

        return (
            cardA.value ===
            cardB.value
        );
    }


    return true;
}


/* =========================================================
   BARVY
========================================================= */

function getColorLabel(
    color
) {

    return (
        CARD_COLOR_LABELS[
            color
        ] ||
        color ||
        ""
    );
}


function isPlayableColor(
    color
) {

    return CARD_COLORS.includes(
        color
    );
}


/* =========================================================
   RANDOM
========================================================= */

function randomInteger(
    min,
    max
) {

    const safeMin =
        Math.ceil(
            Math.min(
                min,
                max
            )
        );


    const safeMax =
        Math.floor(
            Math.max(
                min,
                max
            )
        );


    return (
        Math.floor(
            Math.random() *
            (
                safeMax -
                safeMin +
                1
            )
        ) +
        safeMin
    );
}


function randomArrayItem(
    items
) {

    if (
        !Array.isArray(
            items
        ) ||
        items.length ===
            0
    ) {

        return null;
    }


    return items[
        randomInteger(
            0,
            items.length - 1
        )
    ];
}


/* =========================================================
   PŘEMÝŠLENÍ LUKYHO
========================================================= */

function getLukyThinkingDelay(
    handSize
) {

    const config =
        GAME_CONFIG
            .aiThinking;


    if (
        handSize >=
        config.largeHandThreshold
    ) {

        return randomInteger(
            config.largeHandMinMs,
            config.largeHandMaxMs
        );
    }


    if (
        Math.random() <
        config.slowChance
    ) {

        return randomInteger(
            config.slowMinMs,
            config.slowMaxMs
        );
    }


    return randomInteger(
        config.normalMinMs,
        config.normalMaxMs
    );
}


function shouldShowThinkingDots(
    delayMs
) {

    const config =
        GAME_CONFIG
            .aiThinking;


    if (
        delayMs <
        config.thinkingDotsMinMs
    ) {

        return false;
    }


    return (
        Math.random() <
        config.showThinkingDotsChance
    );
}


/* =========================================================
   UNO LUKYHO
========================================================= */

function shouldLukyForgetUno() {

    return (
        Math.random() <
        GAME_CONFIG
            .lukyUno
            .forgetChance
    );
}


function getLukyForgottenUnoWindow() {

    return randomInteger(
        GAME_CONFIG
            .lukyUno
            .forgottenWindowMinMs,

        GAME_CONFIG
            .lukyUno
            .forgottenWindowMaxMs
    );
}


function getLukyAfterUnoPhraseDelay() {

    return randomInteger(
        GAME_CONFIG
            .lukyUno
            .afterUnoPhraseMinMs,

        GAME_CONFIG
            .lukyUno
            .afterUnoPhraseMaxMs
    );
}


/* =========================================================
   PRŮBĚŽNÉ HLÁŠKY
========================================================= */

function getRandomAmbientSpeechDelay() {

    return randomInteger(
        GAME_CONFIG
            .speech
            .ambientMinMs,

        GAME_CONFIG
            .speech
            .ambientMaxMs
    );
}


/* =========================================================
   EVENT "MÁ NĚKDO ŽLUTOU?"
========================================================= */

function getRandomFirstYellowEventDelay() {

    return randomInteger(
        GAME_CONFIG
            .yellowEvent
            .firstUseDelayMinMs,

        GAME_CONFIG
            .yellowEvent
            .firstUseDelayMaxMs
    );
}


/* =========================================================
   HUDBA
========================================================= */

function getRandomMusicTrack() {

    const tracks =
        GAME_CONFIG
            .music
            .tracks;


    if (
        !Array.isArray(
            tracks
        ) ||
        tracks.length ===
            0
    ) {

        return null;
    }


    return randomArrayItem(
        tracks
    );
}


/* =========================================================
   ACHIEVEMENTY
========================================================= */

function getAchievementConfig(
    achievementId
) {

    return (
        GAME_CONFIG
            .achievements[
                achievementId
            ] ||
        null
    );
}


function getAchievementsForCharacter(
    characterId
) {

    return Object
        .values(
            GAME_CONFIG
                .achievements
        )
        .filter(
            (achievement) =>
                achievement
                    .characterId ===
                characterId
        );
}


/* =========================================================
   FORMÁTOVÁNÍ
========================================================= */

function formatRecord(
    wins,
    losses
) {

    return `${wins}–${losses}`;
}


/* =========================================================
   ČAS
========================================================= */

function nowTimestamp() {

    return Date.now();
}
