"use strict";


/* =========================================================
   DOTS UNO
   HLÁŠKY POSTAV

   DŮLEŽITÉ:
   Do tohoto souboru přidáváme pouze hlášky, které byly
   výslovně určené pro hru.

   Herní engine žádné vlastní hlášky nevymýšlí.

   "..." není skutečná hláška Lukyho.
   Jde pouze o vizuální stav přemýšlení.
========================================================= */


const GAME_QUOTES = {

    /* =====================================================
       TECHNICKÉ / VIZUÁLNÍ STAVY
    ===================================================== */

    system: {

        thinking: "..."
    },


    /* =====================================================
       LUKY – POVINNÉ REAKCE NA HERNÍ SITUACE
    ===================================================== */

    luky: {

        reactions: {

            /*
                Hráč klikne na UNO!, přestože nemá
                právě jednu kartu.
            */

            falseUno: "Přestaň tady lhát!",


            /*
                Lukymu zůstane jedna karta.

                Tato hláška se používá bez ohledu na to,
                jestli UNO řekl správně nebo jej zapomněl.
            */

            oneCardLeft: "Je po všem.",


            /*
                Skutečné zahlášení UNO.
            */

            uno: "UNO!",


            /*
                Hráč Lukyho správně nachytá,
                že neřekl UNO.
            */

            caughtUno: "Neřekl jsi UNO!",


            /*
                Odpověď na tlačítko "Neřekl jsi UNO!",
                pokud jej hráč použije ve chvíli,
                kdy Luky nemá jednu kartu.

                Samotné číslo se doplní dynamicky.

                Výsledek např.:
                "Mám 5 karet."
            */

            invalidUnoCatch: {
                prefix: "Mám ",
                suffix: " karet."
            },


            /*
                Stůj – první přehazování.

                Např.:
                Dany: Stůj
                Luky: Stůj
                Luky: "Ty stojíš!"
            */

            skipFirstCounter: "Ty stojíš!",


            /*
                Každé další přehazování Stůj.
            */

            skipFurtherCounter: "Ne, ty stojíš!",


            /*
                Odpověď na otázku:
                "Má někdo žlutou?"

                Luky má alespoň jednu žlutou kartu.
            */

            hasYellow: "Já.",


            /*
                Luky nemá žlutou.
            */

            noYellow: "..."
        },


        /* =================================================
           OBECNÉ ÚVODNÍ HLÁŠKY

           Použijí se pouze tam, kde nemá přednost
           specifická hláška pro konkrétní postavu.

           Po vyčerpání dostupných vhodných hlášek se
           mohou později náhodně střídat.
        ================================================= */

        openingGeneral: [
            "Rozdrtím tě.",
            "Hodně jsem trénoval.",
            "Nemáš šanci"
        ],


        /* =================================================
           HLÁŠKY PODLE POSTAV
        ================================================= */

        characters: {

            /* ---------------------------------------------
               DANY
            --------------------------------------------- */

            dany: {

                /*
                    Specifickou úvodní hlášku zatím nemáme.
                    Použijí se obecné.
                */

                opening: [],


                /*
                    Dany Lukymu výrazně naloží
                    dobíracími kartami.
                */

                heavyDrawReaction: [
                    "Dany, zklamal jsi mě."
                ]
            },


            /* ---------------------------------------------
               FILIP
            --------------------------------------------- */

            filip: {

                opening: [],


                /*
                    Filip Lukymu výrazně naloží
                    dobíracími kartami.
                */

                heavyDrawReaction: [
                    "Filipe, jsi otravný."
                ]
            },


            /* ---------------------------------------------
               96 / PAVEL
            --------------------------------------------- */

            "96": {

                /*
                    Luky oslovuje postavu 96 jako Pavla.

                    Máme dva specifické openingy.

                    První je jedna bublina.

                    Druhý je sekvence dvou bublin,
                    aby nebylo moc textu najednou.
                */

                opening: [

                    {
                        type: "single",

                        text:
                            "Pavle, víš co je to plíseň?"
                    },


                    {
                        type: "sequence",

                        lines: [
                            "Včera Slipknot chyběl klaun.",
                            "Proč jsi tam nebyl?"
                        ]
                    }
                ],


                /*
                    96 Lukymu výrazně naloží
                    dobíracími kartami.
                */

                heavyDrawReaction: [
                    "PAVLEEE!!"
                ]
            }
        }
    },


    /* =====================================================
       HLÁŠKY HRÁČSKÉ POSTAVY

       Zatím máme pouze hlášky, které vyplývají
       z konkrétních domácích pravidel.

       Nejsou zde žádné náhodně generované reakce.
    ===================================================== */

    player: {

        reactions: {

            /*
                Více identických karet zahraných najednou.
            */

            kur: "Kuř!",


            /*
                Hráč zahraje sedmičku a rozhodne se
                převzít Lukyho ruku.
            */

            sevenSwap: "Chci tvoje karty.",


            /*
                Hráč přehodí Lukyho Stůj vlastním Stůj.

                Pokud jde o první counter v řetězci:
                "Ty stojíš!"

                Pokud už se Stůj přehazovalo:
                "Ne, ty stojíš!"
            */

            skipFirstCounter: "Ty stojíš!",

            skipFurtherCounter: "Ne, ty stojíš!",


            /*
                Hráč správně zahlásí UNO.
            */

            uno: "UNO!",


            /*
                Hráč nachytá Lukyho.
            */

            caughtLukyUno: "Neřekl jsi UNO!"
        }
    }
};


/* =========================================================
   INTERNÍ STAV POUŽITÝCH ÚVODNÍCH HLÁŠEK

   Toto není save systém samotný.

   saves.js může tyto informace uložit, aby hra věděla,
   které openingy už byly v daném slotu použity.
========================================================= */


function createEmptyQuoteHistory() {
    return {

        opening: {

            /*
                Použité specifické openingy podle postavy.

                Např.:
                "96": [0, 1]
            */

            character: {},


            /*
                Indexy použitých obecných openingů.
            */

            general: []
        },


        /*
            Poslední použitá hláška.

            Hodí se později k omezení okamžitého
            opakování stejného textu.
        */

        lastQuoteKey: null
    };
}


/* =========================================================
   ZÍSKÁNÍ KONFIGURACE HLÁŠEK POSTAVY
========================================================= */

function getCharacterQuotes(characterId) {

    return (
        GAME_QUOTES
            .luky
            .characters[
                characterId
            ] ||
        null
    );
}


/* =========================================================
   OBECNÁ ÚVODNÍ HLÁŠKA
========================================================= */

function getGeneralOpeningQuotes() {

    return [
        ...GAME_QUOTES
            .luky
            .openingGeneral
    ];
}


/* =========================================================
   SPECIFICKÉ ÚVODNÍ HLÁŠKY POSTAVY
========================================================= */

function getCharacterOpeningQuotes(
    characterId
) {

    const characterQuotes =
        getCharacterQuotes(
            characterId
        );


    if (
        !characterQuotes ||
        !Array.isArray(
            characterQuotes.opening
        )
    ) {
        return [];
    }


    return [
        ...characterQuotes.opening
    ];
}


/* =========================================================
   VÝBĚR ÚVODNÍ HLÁŠKY

   Pravidlo:

   1. Nejdřív nepoužité specifické hlášky postavy.
   2. Potom nepoužité obecné hlášky.
   3. Po vyčerpání obou skupin náhodný výběr ze všech
      vhodných hlášek.
   4. Pokud je možné vybrat jinou hlášku než poslední,
      neopakujeme bezprostředně stejnou.
========================================================= */

function chooseOpeningQuote(
    characterId,
    quoteHistory = null
) {

    const history =
        quoteHistory ||
        createEmptyQuoteHistory();


    const specificQuotes =
        getCharacterOpeningQuotes(
            characterId
        );


    const generalQuotes =
        getGeneralOpeningQuotes();


    const usedSpecific =
        history.opening
            ?.character
            ?.[characterId] ||
        [];


    const usedGeneral =
        history.opening
            ?.general ||
        [];


    /* =====================================================
       1. NEPOUŽITÉ SPECIFICKÉ HLÁŠKY
    ===================================================== */

    const unusedSpecific =
        specificQuotes
            .map(
                (quote, index) => ({
                    quote,
                    index
                })
            )
            .filter(
                (item) =>
                    !usedSpecific.includes(
                        item.index
                    )
            );


    if (
        unusedSpecific.length > 0
    ) {

        const selected =
            unusedSpecific[0];


        return {
            source: "character",

            characterId,

            index:
                selected.index,

            quote:
                selected.quote,

            key:
                `opening-character-${characterId}-${selected.index}`
        };
    }


    /* =====================================================
       2. NEPOUŽITÉ OBECNÉ HLÁŠKY
    ===================================================== */

    const unusedGeneral =
        generalQuotes
            .map(
                (quote, index) => ({
                    quote,
                    index
                })
            )
            .filter(
                (item) =>
                    !usedGeneral.includes(
                        item.index
                    )
            );


    if (
        unusedGeneral.length > 0
    ) {

        const selected =
            unusedGeneral[0];


        return {
            source: "general",

            index:
                selected.index,

            quote: {
                type: "single",

                text:
                    selected.quote
            },

            key:
                `opening-general-${selected.index}`
        };
    }


    /* =====================================================
       3. VŠECHNO UŽ BYLO POUŽITO

       Náhodně vybíráme ze specifických + obecných.
    ===================================================== */

    const pool = [];


    specificQuotes.forEach(
        (quote, index) => {

            pool.push({

                source: "character",

                characterId,

                index,

                quote,

                key:
                    `opening-character-${characterId}-${index}`
            });
        }
    );


    generalQuotes.forEach(
        (text, index) => {

            pool.push({

                source: "general",

                index,

                quote: {
                    type: "single",
                    text
                },

                key:
                    `opening-general-${index}`
            });
        }
    );


    if (
        pool.length === 0
    ) {
        return null;
    }


    /*
        Pokud máme více možností,
        odstraníme poslední použitou.
    */

    let availablePool =
        pool;


    if (
        pool.length > 1 &&
        history.lastQuoteKey
    ) {

        const filtered =
            pool.filter(
                (item) =>
                    item.key !==
                    history.lastQuoteKey
            );


        if (
            filtered.length > 0
        ) {
            availablePool =
                filtered;
        }
    }


    return availablePool[
        Math.floor(
            Math.random() *
            availablePool.length
        )
    ];
}


/* =========================================================
   ZAPSÁNÍ POUŽITÉ ÚVODNÍ HLÁŠKY DO HISTORIE
========================================================= */

function registerOpeningQuoteUsage(
    quoteHistory,
    selection
) {

    if (
        !quoteHistory ||
        !selection
    ) {
        return;
    }


    if (
        !quoteHistory.opening
    ) {
        quoteHistory.opening = {
            character: {},
            general: []
        };
    }


    if (
        !quoteHistory.opening.character
    ) {
        quoteHistory.opening.character = {};
    }


    if (
        !Array.isArray(
            quoteHistory.opening.general
        )
    ) {
        quoteHistory.opening.general = [];
    }


    /* =====================================================
       SPECIFICKÁ HLÁŠKA
    ===================================================== */

    if (
        selection.source ===
        "character"
    ) {

        const characterId =
            selection.characterId;


        if (
            !Array.isArray(
                quoteHistory
                    .opening
                    .character[
                        characterId
                    ]
            )
        ) {

            quoteHistory
                .opening
                .character[
                    characterId
                ] = [];
        }


        const used =
            quoteHistory
                .opening
                .character[
                    characterId
                ];


        if (
            !used.includes(
                selection.index
            )
        ) {

            used.push(
                selection.index
            );
        }
    }


    /* =====================================================
       OBECNÁ HLÁŠKA
    ===================================================== */

    if (
        selection.source ===
        "general"
    ) {

        if (
            !quoteHistory
                .opening
                .general
                .includes(
                    selection.index
                )
        ) {

            quoteHistory
                .opening
                .general
                .push(
                    selection.index
                );
        }
    }


    quoteHistory.lastQuoteKey =
        selection.key;
}


/* =========================================================
   REAKCE NA VÝRAZNOU DOBÍRACÍ PENALIZACI

   Konkrétní hranici toho, co znamená "naložit",
   určí game.js podle herní situace.

   Zde pouze vracíme schválenou hlášku.
========================================================= */

function getHeavyDrawReaction(
    characterId
) {

    const characterQuotes =
        getCharacterQuotes(
            characterId
        );


    const reactions =
        characterQuotes
            ?.heavyDrawReaction;


    if (
        !Array.isArray(reactions) ||
        reactions.length === 0
    ) {
        return null;
    }


    /*
        Zatím má každá postava jednu variantu.

        Funkce je ale připravená na více variant,
        které můžeš později dodat.
    */

    return reactions[
        Math.floor(
            Math.random() *
            reactions.length
        )
    ];
}


/* =========================================================
   ODPOVĚĎ "MÁM X KARET."

   Čeština má různé tvary:

   1 karta
   2–4 karty
   5+ karet

   Luky tuto odpověď používá při nesmyslném kliknutí
   na "Neřekl jsi UNO!".
========================================================= */

function getLukyCardCountQuote(
    cardCount
) {

    const count =
        Number(
            cardCount
        );


    if (
        count === 1
    ) {
        return "Mám 1 kartu.";
    }


    if (
        count >= 2 &&
        count <= 4
    ) {
        return `Mám ${count} karty.`;
    }


    return `Mám ${count} karet.`;
}


/* =========================================================
   STŮJ

   counterNumber:

   1 = první přehazování
       "Ty stojíš!"

   2+ = další přehazování
        "Ne, ty stojíš!"
========================================================= */

function getSkipCounterQuote(
    counterNumber
) {

    if (
        counterNumber <= 1
    ) {

        return GAME_QUOTES
            .luky
            .reactions
            .skipFirstCounter;
    }


    return GAME_QUOTES
        .luky
        .reactions
        .skipFurtherCounter;
}


/* =========================================================
   HRÁČOVA HLÁŠKA PŘI STŮJ

   Text je stejný jako u Lukyho,
   ale držíme to odděleně, protože později můžeš
   pro hráčské postavy dodat vlastní varianty.
========================================================= */

function getPlayerSkipCounterQuote(
    counterNumber
) {

    if (
        counterNumber <= 1
    ) {

        return GAME_QUOTES
            .player
            .reactions
            .skipFirstCounter;
    }


    return GAME_QUOTES
        .player
        .reactions
        .skipFurtherCounter;
}


/* =========================================================
   NORMALIZACE HLÁŠKY

   Umožní UI pracovat stejně s:

   "Rozdrtím tě."

   i:

   {
       type: "sequence",
       lines: [...]
   }
========================================================= */

function normalizeQuote(
    quote
) {

    if (!quote) {
        return null;
    }


    if (
        typeof quote ===
        "string"
    ) {

        return {
            type: "single",
            text: quote
        };
    }


    if (
        quote.type ===
            "single" &&
        typeof quote.text ===
            "string"
    ) {

        return {
            type: "single",
            text:
                quote.text
        };
    }


    if (
        quote.type ===
            "sequence" &&
        Array.isArray(
            quote.lines
        )
    ) {

        return {
            type: "sequence",

            lines:
                quote.lines.filter(
                    (line) =>
                        typeof line ===
                            "string" &&
                        line.length > 0
                )
        };
    }


    return null;
}


/* =========================================================
   KRÁTKÉ POMOCNÉ GETTERY
========================================================= */

function getFalseUnoQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .falseUno;
}


function getLukyOneCardQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .oneCardLeft;
}


function getLukyUnoQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .uno;
}


function getCaughtUnoQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .caughtUno;
}


function getPlayerUnoQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .uno;
}


function getPlayerCaughtLukyUnoQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .caughtLukyUno;
}


function getKurQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .kur;
}


function getSevenSwapQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .sevenSwap;
}


function getThinkingQuote() {

    return GAME_QUOTES
        .system
        .thinking;
}


/* =========================================================
   ŽLUTÝ EVENT
========================================================= */

function getYellowEventResponse(
    lukyHasYellow
) {

    if (lukyHasYellow) {

        return GAME_QUOTES
            .luky
            .reactions
            .hasYellow;
    }


    return GAME_QUOTES
        .luky
        .reactions
        .noYellow;
}
