"use strict";


/* =========================================================
   DOTS UNO
   CENTRÁLNÍ KONFIGURACE HRY
========================================================= */


/* =========================================================
   PROSTŘEDÍ / STORAGE NAMESPACE

   Produkční URL ponechává původní klíče dotsUno.* beze změny.
   Testovací URL obsahující /test/ používá dotsUno.test.*.
   Díky tomu testovací build nikdy nečte ani nepřepisuje
   existující produkční save, achievementy nebo nastavení.
========================================================= */

const DOTS_UNO_PATHNAME =
    globalThis.location?.pathname ||
    "";


const DOTS_UNO_IS_TEST_BUILD =
    /\/test(?:\/|$)/i.test(
        DOTS_UNO_PATHNAME
    );


const DOTS_UNO_STORAGE_ROOT =
    DOTS_UNO_IS_TEST_BUILD
        ? "dotsUno.test"
        : "dotsUno";


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

    environment:
        DOTS_UNO_IS_TEST_BUILD
            ? "test"
            : "production",

    isTestBuild:
        DOTS_UNO_IS_TEST_BUILD,


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

       Cíl: hra má odsýpat a Luky má působit lidsky.
       Jasný / vynucený tah je rychlý, více reálných možností
       znamená delší přemýšlení. Větší ruka může přidat čas,
       menší ruka naopak reakci zrychluje.
    ===================================================== */

    aiThinking: {

        obviousMinMs:
            650,

        obviousMaxMs:
            1000,

        normalMinMs:
            900,

        normalMaxMs:
            2100,

        complexMinMs:
            1400,

        complexMaxMs:
            3000,

        absoluteMaxMs:
            3200,

        smallHandThreshold:
            3,

        smallHandReductionMs:
            350,

        largeHandThreshold:
            10,

        largeHandBonusPerCardMs:
            90,

        largeHandMaxBonusMs:
            720,

        repeatedForcedDrawMinMs:
            220,

        repeatedForcedDrawMaxMs:
            480,

        showThinkingDotsChance:
            0.34,

        thinkingDotsMinMs:
            850
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
            UI ji později zároveň schová při prvním
            tahu hráče.
        */

        openingDurationMs:
            6000,

        sequencePauseMs:
            850,

        /*
            Interval v rámci Danyho hlášky „Žádný strach...“.
        */

        danyPlanSequencePauseMs:
            2000,

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

    skip: {

        canCounterSkip:
            true,

        multipleSkipCardsMultiplyEffect:
            false
    },


    /* =====================================================
       ZMĚNA SMĚRU
    ===================================================== */

    reverse: {

        hasEffectInTwoPlayerGame:
            false
    },


    /* =====================================================
       NULA
    ===================================================== */

    zeroRule: {

        swapHands:
            true,

        multipleZerosSwapOnlyOnce:
            true
    },


    /* =====================================================
       SEDMIČKA
    ===================================================== */

    sevenRule: {

        optionalHandSwap:
            true
    },


    /* =====================================================
       KUŘ!
    ===================================================== */

    kur: {

        enabled:
            true,

        identicalCardsOnly:
            true,

        minimumCards:
            2,

        sumDrawCards:
            true,

        repeatOtherSpecialEffects:
            false
    },


    /* =====================================================
       OVLÁDÁNÍ KARET
    ===================================================== */

    cardInteraction: {

        dragPlayThresholdPx:
            80,

        clickMovementTolerancePx:
            8
    },


    /* =====================================================
       AUTOMATICKÉ ŘAZENÍ RUKY
    ===================================================== */

    handSorting: {

        colorOrder: [
            "red",
            "yellow",
            "green",
            "blue",
            "wild"
        ],

        numericCardsFirst:
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

            Objeví se náhodně 30–60 sekund
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
            se vrací původní logika: každá pátá
            partie, maximálně jednou za partii.
        */

        everyNthGame:
            5,

        maxOccurrencesPerGame:
            1
    },


    /* =====================================================
       VÝBĚR POSTAVY
    ===================================================== */

    characterSelection: {

        recommendedCharacterId:
            "96",

        showRecommendation:
            true
    },


    /* =====================================================
       EMOTY
    ===================================================== */

    emotes: {

        enabled:
            true,

        durationMinMs:
            2600,

        durationMaxMs:
            3800,

        cooldownMinMs:
            5000,

        cooldownMaxMs:
            8000,

        strongSituationChance:
            0.30,

        mildSituationChance:
            0.20,

        maxPerSituation:
            1
    },


    /* =====================================================
       HISTORIE HRY
    ===================================================== */

    history: {

        enabled:
            true,

        maxEntries:
            150
    },


    /* =====================================================
       STORAGE
    ===================================================== */

    storage: {

        rootKey:
            DOTS_UNO_STORAGE_ROOT,

        slotsKey:
            `${DOTS_UNO_STORAGE_ROOT}.slots`,

        achievementsKey:
            `${DOTS_UNO_STORAGE_ROOT}.achievements`,

        globalStatsKey:
            `${DOTS_UNO_STORAGE_ROOT}.globalStats`,

        settingsKey:
            `${DOTS_UNO_STORAGE_ROOT}.settings`
    },


    /* =====================================================
       ACHIEVEMENT TARGETY
    ===================================================== */

    achievements: {

        winStreakTarget:
            3,

        skinWinsTarget:
            5,

        advancedWinsTarget:
            10,

        proWinsTarget:
            20,

        monsterWinsTarget:
            30,

        noLifeWinsTarget:
            50,

        noLifeWasNotEnoughWinsTarget:
            100,

        wtfWinsTarget:
            200,

        stopWinsTarget:
            300
    },


    /* =====================================================
       ANIMACE
    ===================================================== */

    animation: {

        fastMs:
            160,

        normalMs:
            280,

        cardPlayMs:
            360,

        handSwapMs:
            700,

        /*
            Po Lukyho poslední kartě necháme výsledek chvíli
            „doznít“, aby hráč skutečně viděl vítězný tah.
        */

        lukyWinRevealMs:
            2000
    }
};


/* =========================================================
   POSTAVY
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

    const character =
        getCharacterConfig(
            characterId
        );


    return character
        ? character.name
        : "";
}

/* =========================================================
   SKINY
========================================================= */

function getConfiguredCharacterSkins(
    characterId
) {

    return [
        ...(
            GAME_CONFIG
                .skins[
                    characterId
                ] ||
            []
        )
    ];
}


function getConfiguredCharacterSkin(
    characterId,
    skinId
) {

    const skins =
        getConfiguredCharacterSkins(
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
        getConfiguredCharacterSkin(
            characterId,
            character.defaultSkinId
        ) ||
        null
    );
}


function getCharacterImage(
    characterId,
    skinId = "default"
) {

    const skin =
        getConfiguredCharacterSkin(
            characterId,
            skinId
        );


    if (
        skin?.image
    ) {
        return skin.image;
    }


    const character =
        getCharacterConfig(
            characterId
        );


    return (
        character?.defaultImage ||
        ""
    );
}


/* =========================================================
   WIN / LOSE OBRÁZKY
========================================================= */

function getConfiguredPlayerEndImage(
    characterId,
    result
) {

    return (
        GAME_CONFIG
            .endScreenImages
            ?.[characterId]
            ?.[result] ||
        null
    );
}


function getConfiguredLukyEndImage(
    result
) {

    if (
        result === "win"
    ) {

        return GAME_CONFIG
            .opponent
            .winImage;
    }


    if (
        result === "lose"
    ) {

        return GAME_CONFIG
            .opponent
            .loseImage;
    }


    return null;
}


/* =========================================================
   EMOTY
========================================================= */

function getConfiguredLukyEmote(
    emoteId
) {

    return (
        GAME_CONFIG
            .opponent
            .emotes
            ?.[emoteId] ||
        null
    );
}


function getConfiguredCharacterEmote(
    characterId,
    emoteId
) {

    return (
        GAME_CONFIG
            .characterEmotes
            ?.[characterId]
            ?.[emoteId] ||
        null
    );
}


function getRandomEmoteDuration() {

    return randomInteger(
        GAME_CONFIG
            .emotes
            .durationMinMs,

        GAME_CONFIG
            .emotes
            .durationMaxMs
    );
}


function getRandomEmoteCooldown() {

    return randomInteger(
        GAME_CONFIG
            .emotes
            .cooldownMinMs,

        GAME_CONFIG
            .emotes
            .cooldownMaxMs
    );
}


/* =========================================================
   NÁHODA
========================================================= */

function randomInteger(
    min,
    max
) {

    const minimum =
        Math.ceil(min);


    const maximum =
        Math.floor(max);


    return Math.floor(
        Math.random() *
        (
            maximum -
            minimum +
            1
        )
    ) + minimum;
}


function randomChance(
    chance
) {

    return (
        Math.random() <
        chance
    );
}


/* =========================================================
   AI – DÉLKA PŘEMÝŠLENÍ
========================================================= */

function getRandomAiThinkingTime(
    handCount = null
) {

    const config =
        GAME_CONFIG.aiThinking;


    /*
        Hodně karet = trochu rychlejší Luky.
    */

    if (
        Number.isFinite(
            handCount
        ) &&
        handCount >=
            config.largeHandThreshold
    ) {

        return randomInteger(
            config.largeHandMinMs,
            config.largeHandMaxMs
        );
    }


    /*
        Občas přemýšlí déle.
    */

    if (
        randomChance(
            config.slowChance
        )
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


/* =========================================================
   UNO LUKYHO
========================================================= */

function getRandomLukyUnoWindow() {

    return randomInteger(
        GAME_CONFIG
            .lukyUno
            .forgottenWindowMinMs,

        GAME_CONFIG
            .lukyUno
            .forgottenWindowMaxMs
    );
}


function getRandomLukyAfterUnoDelay() {

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
        !Array.isArray(tracks) ||
        tracks.length === 0
    ) {

        return {
            id:
                "video-start",

            title:
                "Dramatická klasická hudba",

            startSeconds:
                0
        };
    }


    return tracks[
        randomInteger(
            0,
            tracks.length - 1
        )
    ];
}
