"use strict";


/* =========================================================
   DOTS UNO
   CENTRÁLNÍ KONFIGURACE HRY

   Tento soubor obsahuje hodnoty, které budeme pravděpodobně
   postupně ladit podle toho, jak bude hra působit.

   Herní logika by pokud možno neměla obsahovat podobná čísla
   natvrdo, ale měla by je číst odsud.
========================================================= */


const GAME_CONFIG = {

    /* =====================================================
       ZÁKLAD
    ===================================================== */

    gameName: "DOTS UNO",

    startingHandSize: 7,

    saveSlotCount: 3,

    storageVersion: 1,


    /* =====================================================
       POSTAVY
    ===================================================== */

    characters: {

        dany: {
            id: "dany",
            name: "Dany",
            image: "assets/images/dany.jpg",
            fallback: "D"
        },

        filip: {
            id: "filip",
            name: "Filip",
            image: "assets/images/filip.jpg",
            fallback: "F"
        },

        "96": {
            id: "96",
            name: "96",
            image: "assets/images/96.jpg",
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
        image: "assets/images/luky.jpg",
        fallback: "L"
    },


    /* =====================================================
       LUKYHO PŘEMÝŠLENÍ

       Luky nikdy nezahraje okamžitě.

       Běžný tah:
       náhodně 2–4 sekundy.

       Později můžeme podle pocitu hru zrychlit nebo zpomalit.
    ===================================================== */

    aiThinking: {
        minMs: 2000,
        maxMs: 4000,

        /*
            Pravděpodobnost, že se během přemýšlení
            zobrazí "...".

            0.45 = 45 %
        */
        showThinkingDotsChance: 0.45,

        /*
            Jak dlouho mají "..." minimálně zůstat viditelné.
        */
        thinkingDotsMinMs: 900
    },


    /* =====================================================
       UNO HRÁČE

       Po zahrání předposlední karty má hráč 3 sekundy
       na kliknutí na UNO!.
    ===================================================== */

    playerUno: {
        callWindowMs: 3000,

        missedPenaltyCards: 2
    },


    /* =====================================================
       UNO LUKYHO

       Normálně řekne UNO okamžitě.

       Občas zapomene a vytvoří se tajné okno 2–5 sekund,
       ve kterém jej lze nachytat.
    ===================================================== */

    lukyUno: {

        /*
            Jak často Luky zapomene UNO.

            0.18 = 18 %

            Toto číslo můžeme později upravit podle toho,
            jestli se to děje moc nebo málo.
        */
        forgetChance: 0.18,

        forgottenWindowMinMs: 2000,
        forgottenWindowMaxMs: 5000,

        caughtPenaltyCards: 2,

        /*
            Pokud UNO nezapomněl a chce po UNO říct
            "Je po všem.", bude mezi hláškami prodleva.
        */
        afterUnoPhraseMinMs: 2000,
        afterUnoPhraseMaxMs: 3000
    },


    /* =====================================================
       HLÁŠKY

       Herní engine NESMÍ generovat vlastní hlášky.

       Veškerý obsah bude v quotes.js.

       Zde jsou jen technické hodnoty pro jejich zobrazování.
    ===================================================== */

    speech: {

        /*
            Výchozí doba běžné bubliny.
        */
        defaultDurationMs: 2600,

        /*
            Kratší systémové hlášky, např. "..."
        */
        shortDurationMs: 1600,

        /*
            Delší texty.
        */
        longDurationMs: 3600,

        /*
            Pauza mezi dvěma větami, pokud hláška
            obsahuje sekvenci dvou bublin.
        */
        sequencePauseMs: 850
    },


    /* =====================================================
       +2 / +4

       Penalizace se sčítá.

       Co lze zahrát jako obranu ale určuje karta,
       která je aktuálně navrchu.
    ===================================================== */

    drawStacking: {

        /*
            +2 lze hrát kdykoliv.
        */
        drawTwoAlwaysPlayable: true,

        /*
            +4 lze hrát kdykoliv.
        */
        drawFourAlwaysPlayable: true,

        /*
            Na +4 nelze odpovědět jednou +2.
        */
        singleDrawTwoOnDrawFourAllowed: false,

        /*
            Na +4 lze odpovědět minimálně dvěma +2 najednou.
        */
        minimumDrawTwosAgainstDrawFour: 2
    },


    /* =====================================================
       STŮJ
    ===================================================== */

    skip: {

        /*
            V 1v1 může soupeř na Stůj odpovědět vlastním Stůj.
        */
        canCounterSkip: true,

        /*
            Více Stůj přes Kuř! nemá násobený efekt.
        */
        multipleSkipCardsMultiplyEffect: false
    },


    /* =====================================================
       ZMĚNA SMĚRU
    ===================================================== */

    reverse: {

        /*
            Ve hře 1 proti 1 nemá žádný speciální efekt.
        */
        hasEffectInTwoPlayerGame: false
    },


    /* =====================================================
       NULA
    ===================================================== */

    zeroRule: {

        /*
            Jedna samostatně zahraná nula:
            automatická výměna rukou.
        */
        swapHands: true,

        /*
            Pokud se přes Kuř! zahraje více nul najednou,
            ruce se vymění pouze jednou.
        */
        multipleZerosSwapOnlyOnce: true
    },


    /* =====================================================
       SEDMIČKA
    ===================================================== */

    sevenRule: {

        /*
            Po zahrání sedmičky si hráč může vybrat,
            zda chce soupeřovu ruku.
        */
        optionalHandSwap: true
    },


    /* =====================================================
       KUŘ!

       Více naprosto identických karet lze zahrát současně.
    ===================================================== */

    kur: {

        enabled: true,

        /*
            Pro Kuř! musí být karty skutečně totožné:
            stejná barva + stejná hodnota / typ.
        */
        identicalCardsOnly: true,

        /*
            Od kolika karet se jedná o Kuř!.
        */
        minimumCards: 2,

        /*
            +2 a +4 se při vícenásobném zahrání sčítají.
        */
        sumDrawCards: true,

        /*
            Ostatní speciální efekty se při více identických
            kartách provedou pouze jednou.
        */
        repeatOtherSpecialEffects: false
    },


    /* =====================================================
       VÝBĚR / DRAG & DROP KARET
    ===================================================== */

    cardInteraction: {

        /*
            Kolik pixelů směrem nahoru musí hráč kartu
            přetáhnout, aby bylo puštění považováno
            za pokus o zahrání.

            Později podle pocitu doladíme.
        */
        dragPlayThresholdPx: 80,

        /*
            Malý pohyb se stále považuje za kliknutí / tap.
        */
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

        /*
            Číselné karty se řadí od 0 do 9.

            Barevné speciální karty přijdou za čísly,
            divoké úplně na konec.
        */
        numericCardsFirst: true
    },


    /* =====================================================
       SPECIÁLNÍ EVENT "MÁ NĚKDO ŽLUTOU?"

       Event je vzácný a maximálně jednou za partii.
    ===================================================== */

    yellowEvent: {

        enabled: true,

        /*
            Kandidátem na event je přibližně každá 5. hra.
        */
        everyNthGame: 5,

        maxOccurrencesPerGame: 1
    },


    /* =====================================================
       DOPORUČENÁ POSTAVA
    ===================================================== */

    characterSelection: {

        recommendedCharacterId: "96",

        /*
            Doporučení se zobrazuje při výběru postavy.
        */
        showRecommendation: true
    },


    /* =====================================================
       SAVE

       Vše běží lokálně v prohlížeči přes localStorage.
    ===================================================== */

    storage: {

        rootKey: "dotsUno",

        slotsKey: "dotsUno.slots",

        achievementsKey: "dotsUno.achievements",

        globalStatsKey: "dotsUno.globalStats",

        settingsKey: "dotsUno.settings"
    },


    /* =====================================================
       ACHIEVEMENTY

       Samotná definice achievementů bude
       v achievements.js.

       Zde jsou pouze hranice používané první sadou.
    ===================================================== */

    achievements: {

        gamesPlayedTarget: 10,

        winStreakTarget: 3,

        characterWinsTarget: 10
    },


    /* =====================================================
       ANIMACE

       Jednoduché společné časy, aby se později dal
       celkový pocit hry snadno ladit.
    ===================================================== */

    animation: {

        fastMs: 160,

        normalMs: 280,

        cardPlayMs: 360,

        handSwapMs: 700
    }
};


/* =========================================================
   POMOCNÉ FUNKCE KONFIGURACE
========================================================= */


/**
 * Vrátí celou konfiguraci zvolené postavy.
 */
function getCharacterConfig(characterId) {
    return GAME_CONFIG.characters[characterId] || null;
}


/**
 * Vrátí zobrazované jméno postavy.
 */
function getCharacterName(characterId) {
    const character =
        getCharacterConfig(characterId);

    return character
        ? character.name
        : "";
}


/**
 * Vrátí náhodné celé číslo včetně obou krajních hodnot.
 */
function randomInteger(min, max) {
    const minimum =
        Math.ceil(min);

    const maximum =
        Math.floor(max);

    return Math.floor(
        Math.random() *
        (maximum - minimum + 1)
    ) + minimum;
}


/**
 * Náhodná délka Lukyho přemýšlení.
 */
function getRandomAiThinkingTime() {
    return randomInteger(
        GAME_CONFIG.aiThinking.minMs,
        GAME_CONFIG.aiThinking.maxMs
    );
}


/**
 * Náhodná délka okna při Lukyho zapomenutém UNO.
 */
function getRandomLukyUnoWindow() {
    return randomInteger(
        GAME_CONFIG.lukyUno.forgottenWindowMinMs,
        GAME_CONFIG.lukyUno.forgottenWindowMaxMs
    );
}


/**
 * Náhodná pauza mezi UNO a "Je po všem.".
 */
function getRandomLukyAfterUnoDelay() {
    return randomInteger(
        GAME_CONFIG.lukyUno.afterUnoPhraseMinMs,
        GAME_CONFIG.lukyUno.afterUnoPhraseMaxMs
    );
}


/**
 * Pomocná funkce pro pravděpodobnost 0–1.
 */
function randomChance(chance) {
    return Math.random() < chance;
}
