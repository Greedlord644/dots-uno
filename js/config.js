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

       Názvy jsou názvy zobrazované hráči.
       ID a názvy souborů neměníme.
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

                /*
                    DŮLEŽITÉ:
                    správný název souboru je Pavel_skin1.jpg
                */

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
       LOGO

       Použijeme na rubu karet.
    ===================================================== */

    branding: {

        logoImage:
            "assets/images/logo.png"
    },


    /* =====================================================
       LUKYHO PŘEMÝŠLENÍ

       Standard:
       2–4 sekundy

       Občas:
       6–8 sekund

       Pokud má Luky hodně karet:
       trochu rychlejší tempo.
    ===================================================== */

    aiThinking: {

        normalMinMs:
            2000,

        normalMaxMs:
            4000,


        /*
            Občasný dlouhý tah.
        */

        slowChance:
            0.16,

        slowMinMs:
            6000,

        slowMaxMs:
            8000,


        /*
            Při velké ruce Luky obvykle reaguje rychleji.
        */

        largeHandThreshold:
            12,

        largeHandMinMs:
            1500,

        largeHandMaxMs:
            3000,


        /*
            Pravděpodobnost zobrazení "...".
        */

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
            Timer začne až ve chvíli, kdy hráč dokončil
            případné rozhodnutí po zahrání karty.

            Např.:
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
            Úvodní provokace zůstane až 6 sekund.

            UI ji zároveň schová okamžitě při prvním
            skutečném tahu hráče.
        */

        openingDurationMs:
            6000,

        sequencePauseMs:
            850
    },


    /* =====================================================
       HUDBA

       Hudba je globální preference, nikoliv součást slotu.

       Skrytý YouTube player bude ovládat settings.js / ui.js.
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
            Výchozí hlasitost 0–100.

            Necháváme nižší, aby hudba nebyla rušivá.
        */

        volume:
            32,


        /*
            Po spuštění nové partie vybereme náhodný track.

            Timestampy sem doplníme podle tracklistu
            konkrétního YouTube videa.

            Formát:

            {
                id: "track_1",
                title: "Název",
                startSeconds: 0
            }

            Pokud tracks zatím zůstane prázdné,
            hudební systém použije začátek videa.
        */

        tracks: []
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

       Cooldown 5–8 sekund.
    ===================================================== */

    emotes: {

        enabled:
            true,


        /*
            Emote bude na obrazovce výrazněji a déle.
        */

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

       Omezení zabrání nekonečnému růstu save.
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
            "dotsUno",

        slotsKey:
            "dotsUno.slots",

        achievementsKey:
            "dotsUno.achievements",

        globalStatsKey:
            "dotsUno.globalStats",

        settingsKey:
            "dotsUno.settings"
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
            50
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
            700
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

   handCount je volitelný, aby zůstala kompatibilita
   se starším ai.js, dokud ho neupravíme.
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
        Občas přemýšlí výrazně déle.
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
   HUDBA
========================================================= */

function getRandomMusicTrack() {

    const tracks =
        GAME_CONFIG
            .music
            .tracks;


    /*
        Dokud nemáme timestampy tracklistu,
        použije se začátek videa.
    */

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
