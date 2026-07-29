"use strict";


/* =========================================================
   DOTS UNO
   CENTRÁLNÍ KONFIGURACE HRY

   Tento soubor drží hodnoty, které chceme mít na jednom
   místě a později je snadno ladit.

   DŮLEŽITÉ:
   Obrázky postav, skiny, win/lose obrázky a emoty mají
   přesné názvy souborů podle assets/images/.
========================================================= */


const GAME_CONFIG = {

    /* =====================================================
       ZÁKLAD
    ===================================================== */

    gameName: "DOTS UNO",

    startingHandSize: 7,

    saveSlotCount: 3,

    storageVersion: 2,


    /* =====================================================
       POSTAVY
    ===================================================== */

    characters: {

        dany: {
            id: "dany",
            name: "Dany",

            defaultSkinId: "default",

            defaultImage:
                "assets/images/Dany_default.jpg",

            fallback: "D"
        },


        filip: {
            id: "filip",
            name: "Filip",

            defaultSkinId: "default",

            defaultImage:
                "assets/images/Fila_default.jpg",

            fallback: "F"
        },


        "96": {
            id: "96",
            name: "96",

            defaultSkinId: "default",

            defaultImage:
                "assets/images/Pavel_default.png",

            fallback: "96",

            recommended: true
        }
    },


    /* =====================================================
       LUKY
    ===================================================== */

    opponent: {
        id: "luky",
        name: "Luky",

        /*
            Běžný portrét Lukyho během hry.
            Pokud později dodáš speciální default obrázek,
            cestu jen změníme tady.
        */

        defaultImage:
            "assets/images/Luky_default.png",

        fallback: "L",

        winImage:
            "assets/images/Luky_win.png",

        loseImage:
            "assets/images/Luky_lose.png",

        emotes: {

            /*
                Silná výhodná situace:
                +2, +4, výrazně méně karet atd.
            */

            grin:
                "assets/images/Luky_grin.jpg",


            /*
                Mírnější výhodná situace:
                Stůj, hráč musí líznout apod.
            */

            mild:
                "assets/images/Luky_emote.jpg"
        }
    },


    /* =====================================================
       SKINY POSTAV

       Default skin je vždy dostupný.

       skin1 se odemyká achievementem.
    ===================================================== */

    skins: {

        dany: [

            {
                id: "default",

                name: "Výchozí",

                image:
                    "assets/images/Dany_default.jpg",

                unlockedByDefault: true
            },


            {
                id: "skin1",

                name: "Skin 1",

                image:
                    "assets/images/Dany_skin1.jpg",

                unlockedByAchievement:
                    "dany_new_skin"
            }
        ],


        filip: [

            {
                id: "default",

                name: "Výchozí",

                image:
                    "assets/images/Fila_default.jpg",

                unlockedByDefault: true
            },


            {
                id: "skin1",

                name: "Skin 1",

                image:
                    "assets/images/Fila_skin1.jpg",

                unlockedByAchievement:
                    "fila_new_skin"
            }
        ],


        "96": [

            {
                id: "default",

                name: "Výchozí",

                image:
                    "assets/images/Pavel_default.png",

                unlockedByDefault: true
            },


            {
                id: "skin1",

                name: "Skin 1",

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
       EMOTY POSTAVY 96
    ===================================================== */

    characterEmotes: {

        "96": {

            /*
                Silně negativní situace:
                +2, +4, vyšší penalizace,
                opakované nucené lízání...
            */

            angry:
                "assets/images/Pavel_angry.jpg",


            /*
                Mírnější nepříjemnost:
                Stůj, jednorázové líznutí apod.
            */

            inDanger:
                "assets/images/Pavel_in_danger.png"
        }
    },


    /* =====================================================
       LUKYHO PŘEMÝŠLENÍ

       Běžný tah:
       náhodně 2–4 sekundy.
    ===================================================== */

    aiThinking: {

        minMs: 2000,

        maxMs: 4000,


        /*
            Pravděpodobnost, že se během čekání
            objeví "...".
        */

        showThinkingDotsChance: 0.45,


        /*
            Minimální doba zobrazení "...".
        */

        thinkingDotsMinMs: 900
    },


    /* =====================================================
       UNO HRÁČE
    ===================================================== */

    playerUno: {

        /*
            Hráč má 3 sekundy od momentu, kdy mu
            po zahrání zůstane přesně jedna karta.
        */

        callWindowMs: 3000,

        missedPenaltyCards: 2
    },


    /* =====================================================
       UNO LUKYHO
    ===================================================== */

    lukyUno: {

        /*
            Zatím první testovací hodnota.

            0.18 = 18 % šance, že Luky UNO zapomene.
        */

        forgetChance: 0.18,


        /*
            Pokud zapomene, hráč má tajné okno
            2–5 sekund.
        */

        forgottenWindowMinMs: 2000,

        forgottenWindowMaxMs: 5000,

        caughtPenaltyCards: 2,


        /*
            Prodleva mezi "UNO!" a "Je po všem."
            pokud UNO řekl hned.
        */

        afterUnoPhraseMinMs: 2000,

        afterUnoPhraseMaxMs: 3000
    },


    /* =====================================================
       HLÁŠKY
    ===================================================== */

    speech: {

        defaultDurationMs: 2600,

        shortDurationMs: 1600,

        longDurationMs: 3600,

        sequencePauseMs: 850
    },


    /* =====================================================
       +2 / +4
    ===================================================== */

    drawStacking: {

        /*
            +2 lze zahrát kdykoliv.
        */

        drawTwoAlwaysPlayable: true,


        /*
            +4 lze zahrát kdykoliv.
        */

        drawFourAlwaysPlayable: true,


        /*
            Na +4 nelze odpovědět jednou +2.
        */

        singleDrawTwoOnDrawFourAllowed: false,


        /*
            Na +4 lze odpovědět minimálně dvěma +2
            zahranými současně.
        */

        minimumDrawTwosAgainstDrawFour: 2
    },


    /* =====================================================
       STŮJ
    ===================================================== */

    skip: {

        /*
            Soupeř může na Stůj odpovědět vlastním Stůj.
        */

        canCounterSkip: true,


        /*
            Více Stůj zahraných přes Kuř! nemá
            vícenásobný efekt.
        */

        multipleSkipCardsMultiplyEffect: false
    },


    /* =====================================================
       ZMĚNA SMĚRU
    ===================================================== */

    reverse: {

        /*
            V 1v1 nemá speciální efekt.
        */

        hasEffectInTwoPlayerGame: false
    },


    /* =====================================================
       NULA
    ===================================================== */

    zeroRule: {

        swapHands: true,


        /*
            Více nul přes Kuř! = pouze jedna výměna.
        */

        multipleZerosSwapOnlyOnce: true
    },


    /* =====================================================
       SEDMIČKA
    ===================================================== */

    sevenRule: {

        /*
            Po zahrání sedmičky se hráč může rozhodnout,
            zda chce soupeřovy karty.
        */

        optionalHandSwap: true
    },


    /* =====================================================
       KUŘ!
    ===================================================== */

    kur: {

        enabled: true,

        identicalCardsOnly: true,

        minimumCards: 2,


        /*
            +2 a +4 se sčítají.
        */

        sumDrawCards: true,


        /*
            Ostatní speciální efekty se při vícenásobném
            zahrání provedou jednou.
        */

        repeatOtherSpecialEffects: false
    },


    /* =====================================================
       DRAG & DROP
    ===================================================== */

    cardInteraction: {

        dragPlayThresholdPx: 80,

        clickMovementTolerancePx: 8
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

        numericCardsFirst: true
    },


    /* =====================================================
       EVENT "MÁ NĚKDO ŽLUTOU?"
    ===================================================== */

    yellowEvent: {

        enabled: true,


        /*
            Kandidátem je přibližně každá 5. hra.
        */

        everyNthGame: 5,

        maxOccurrencesPerGame: 1
    },


    /* =====================================================
       VÝBĚR POSTAVY
    ===================================================== */

    characterSelection: {

        recommendedCharacterId: "96",

        showRecommendation: true
    },


    /* =====================================================
       EMOTY

       Jedna situace = maximálně jeden emote.

       Po zobrazení nastane globální cooldown 5–8 s.
    ===================================================== */

    emotes: {

        enabled: true,


        /*
            Jak dlouho zůstane emote zobrazený.
        */

        durationMinMs: 2000,

        durationMaxMs: 3000,


        /*
            Po emotu se další náhodný emote
            nesmí zobrazit 5–8 sekund.
        */

        cooldownMinMs: 5000,

        cooldownMaxMs: 8000,


        /*
            Výchozí testovací pravděpodobnosti.

            Později je můžeme ladit podle pocitu.
        */

        strongSituationChance: 0.30,

        mildSituationChance: 0.20,


        /*
            Při jedné události se vybere maximálně
            jedna reakce.
        */

        maxPerSituation: 1
    },


    /* =====================================================
       SAVE
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
       ACHIEVEMENTY

       Konkrétní definice jsou v achievements.js.
    ===================================================== */

    achievements: {

        winStreakTarget: 3,

        skinWinsTarget: 5,

        advancedWinsTarget: 10,

        proWinsTarget: 20,

        monsterWinsTarget: 30,

        noLifeWinsTarget: 50
    },


    /* =====================================================
       ANIMACE
    ===================================================== */

    animation: {

        fastMs: 160,

        normalMs: 280,

        cardPlayMs: 360,

        handSwapMs: 700
    }
};


/* =========================================================
   POSTAVY
========================================================= */

function getCharacterConfig(characterId) {

    return (
        GAME_CONFIG
            .characters[
                characterId
            ] ||
        null
    );
}


function getCharacterName(characterId) {

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


    if (skin?.image) {
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


function randomChance(chance) {

    return (
        Math.random() <
        chance
    );
}


/* =========================================================
   AI
========================================================= */

function getRandomAiThinkingTime() {

    return randomInteger(
        GAME_CONFIG
            .aiThinking
            .minMs,

        GAME_CONFIG
            .aiThinking
            .maxMs
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
