"use strict";


/* =========================================================
   DOTS UNO
   HLÁŠKY POSTAV

   DŮLEŽITÉ:
   Do hry patří pouze hlášky výslovně zadané pro projekt.
   Hra sama žádné Lukyho hlášky nevymýšlí.

   "..." není skutečná hláška postavy.
   Jde pouze o vizuální stav přemýšlení.
========================================================= */


const GAME_QUOTES = {

    /* =====================================================
       TECHNICKÉ / VIZUÁLNÍ STAVY
    ===================================================== */

    system: {

        thinking:
            "..."
    },


    /* =====================================================
       LUKY
    ===================================================== */

    luky: {

        reactions: {

            /*
                Hráč klikne na UNO!, i když
                nemá přesně jednu kartu.
            */

            falseUno:
                "Přestaň tady lhát!",


            /*
                Lukymu zůstane jedna karta.
            */

            oneCardLeft:
                "Je po všem.",


            /*
                Správné zahlášení UNO.
            */

            uno:
                "UNO!",


            /*
                Hráč tvrdí, že Luky neřekl UNO,
                ale Luky ho ve skutečnosti řekl.
            */

            unoAlreadySaid:
                "UNO jsem řekl.",


            /*
                Hráč Lukyho správně nachytá,
                že UNO neřekl.

                Tohle říká hráč, nikoliv Luky,
                ale zachováváme původní getter níže.
            */

            caughtUno:
                "Neřekl jsi UNO!",


            /*
                Luky byl správně nachytán,
                dostane +2 a reaguje.
            */

            caughtUnoPenalty:
                "Sakra.",


            /*
                Odpověď na tlačítko
                "Neřekl jsi UNO!",
                pokud má Luky více než jednu kartu.
            */

            invalidUnoCatch: {

                prefix:
                    "Mám ",

                suffix:
                    " karet."
            },


            /*
                Stůj – první přehazování.
            */

            skipFirstCounter:
                "Stojíš!",


            /*
                Každé další přehazování Stůj.
            */

            skipFurtherCounter:
                "Ne, ty stojíš!",


            /*
                "Má někdo žlutou?"
            */

            hasYellow:
                "Já.",


            noYellow:
                "...",

            badSituation:
                "Píčeeee!",

            defeat:
                "Pusinko, jdeme trénovat!"
        },


        /* =================================================
           OBECNÉ ÚVODNÍ HLÁŠKY
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

            /* =============================================
               DANY
            ============================================= */

            dany: {

                /*
                    Specifický opening zatím není.
                */

                opening:
                    [],


                /*
                    Dany Lukymu výrazně naloží.
                */

                heavyDrawReaction: [

                    "Dany, zklamal jsi mě."
                ],

                badSituation: {

                    type:
                        "sequence",

                    lines: [

                        "Žádný strach...",

                        "vše jde přesně podle plánu."
                    ]
                }
            },


            /* =============================================
               FILIP
            ============================================= */

            filip: {

                opening:
                    [],


                heavyDrawReaction: [

                    "Filipe, jsi otravný."
                ]
            },


            /* =============================================
               96 / PAVEL
            ============================================= */

            "96": {

                /*
                    Specifické openingy mají přednost
                    před obecnými hláškami.
                */

                opening: [

                    {
                        type:
                            "single",

                        text:
                            "Pavle, víš co je to plíseň?"
                    },


                    {
                        type:
                            "sequence",

                        lines: [

                            "Včera Slipknot chyběl klaun.",

                            "Proč jsi tam nebyl?"
                        ]
                    }
                ],


                /*
                    96 Lukymu výrazně naloží.
                */

                heavyDrawReaction: [

                    "PAVLEEE!!",


                    {
                        type:
                            "sequence",

                        lines: [

                            "Nemůžeš na mě být aspoň jednou milej?",

                            "Jseš fakt pičus, vole."
                        ],

                        pauseMs:
                            3000
                    }
                ]
            }
        }
    },


    /* =====================================================
       HRÁČSKÁ POSTAVA
    ===================================================== */

    player: {

        reactions: {

            /*
                Více stejných karet najednou.
            */

            kur:
                "Kuř!",


            /*
                Hráč zahraje 7 a chce Lukyho karty.
            */

            sevenSwap:
                "Chci tvoje karty.",


            /*
                Stůj.
            */

            skipFirstCounter:
                "Stojíš!",

            skipFurtherCounter:
                "Ne, ty stojíš!",


            /*
                Hráč správně zahlásí UNO.
            */

            uno:
                "UNO!",


            /*
                Hráč správně nachytá Lukyho.
            */

            caughtLukyUno:
                "Neřekl jsi UNO!"
        }
    }
};


/* =========================================================
   HISTORIE ÚVODNÍCH HLÁŠEK
========================================================= */

function createEmptyQuoteHistory() {

    return {

        opening: {

            character:
                {},

            general:
                []
        },

        lastQuoteKey:
            null
    };
}


/* =========================================================
   HLÁŠKY KONKRÉTNÍ POSTAVY
========================================================= */

function getCharacterQuotes(
    characterId
) {

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
   OBECNÉ OPENINGY
========================================================= */

function getGeneralOpeningQuotes() {

    return [
        ...GAME_QUOTES
            .luky
            .openingGeneral
    ];
}


/* =========================================================
   SPECIFICKÉ OPENINGY
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

   Pořadí:
   1. nepoužitá specifická
   2. nepoužitá obecná
   3. po vyčerpání náhodná
   4. pokud lze, neopakuje se stejná jako minule
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
        history
            .opening
            ?.character
            ?.[characterId] ||
        [];


    const usedGeneral =
        history
            .opening
            ?.general ||
        [];


    /* =====================================================
       NEPOUŽITÉ SPECIFICKÉ
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
        unusedSpecific.length >
        0
    ) {

        const selected =
            unusedSpecific[0];


        return {

            source:
                "character",

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
       NEPOUŽITÉ OBECNÉ
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
        unusedGeneral.length >
        0
    ) {

        const selected =
            unusedGeneral[0];


        return {

            source:
                "general",

            index:
                selected.index,

            quote: {

                type:
                    "single",

                text:
                    selected.quote
            },

            key:
                `opening-general-${selected.index}`
        };
    }


    /* =====================================================
       VŠECHNO UŽ BYLO POUŽITO
    ===================================================== */

    const pool =
        [];


    specificQuotes.forEach(
        (quote, index) => {

            pool.push({

                source:
                    "character",

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

                source:
                    "general",

                index,

                quote: {

                    type:
                        "single",

                    text
                },

                key:
                    `opening-general-${index}`
            });
        }
    );


    if (
        pool.length ===
        0
    ) {

        return null;
    }


    let availablePool =
        pool;


    if (
        pool.length >
            1 &&
        history.lastQuoteKey
    ) {

        const filtered =
            pool.filter(
                (item) =>
                    item.key !==
                    history.lastQuoteKey
            );


        if (
            filtered.length >
            0
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
   REGISTRACE POUŽITÉHO OPENINGU
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

            character:
                {},

            general:
                []
        };
    }


    if (
        !quoteHistory
            .opening
            .character
    ) {

        quoteHistory
            .opening
            .character =
            {};
    }


    if (
        !Array.isArray(
            quoteHistory
                .opening
                .general
        )
    ) {

        quoteHistory
            .opening
            .general =
            [];
    }


    /* =====================================================
       SPECIFICKÁ
    ===================================================== */

    if (
        selection.source ===
        "character"
    ) {

        const characterId =
            selection
                .characterId;


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
                ] =
                [];
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
       OBECNÁ
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
   REAKCE NA VÝRAZNOU PENALIZACI
========================================================= */

function getHeavyDrawReaction(
    characterId,
    preferredIndex = null
) {

    const characterQuotes =
        getCharacterQuotes(
            characterId
        );


    const reactions =
        characterQuotes
            ?.heavyDrawReaction;


    if (
        !Array.isArray(
            reactions
        ) ||
        reactions.length ===
            0
    ) {

        return null;
    }


    const normalizedPreferredIndex =
        Number.isInteger(
            preferredIndex
        )
            ? preferredIndex
            : null;


    const selected =
        normalizedPreferredIndex !==
            null &&
        normalizedPreferredIndex >=
            0 &&
        normalizedPreferredIndex <
            reactions.length
            ? reactions[
                normalizedPreferredIndex
            ]
            : reactions[
                Math.floor(
                    Math.random() *
                    reactions.length
                )
            ];


    return normalizeQuote(
        selected
    );
}


/* =========================================================
   SPECIÁLNÍ SITUAČNÍ HLÁŠKY
========================================================= */

function getDanyBadSituationQuote() {

    return normalizeQuote(
        GAME_QUOTES
            .luky
            .characters
            .dany
            .badSituation
    );
}


function getLukyBadSituationQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .badSituation;
}


function getLukyDefeatQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .defeat;
}


/* =========================================================
   "MÁM X KARET"

   1 karta je záměrně speciální.

   Pokud má Luky jednu kartu a hráč ho zkouší
   nachytat po správně řečeném UNO, odpověď je:

   "UNO jsem řekl."

   game.js bude navíc evidovat skutečný UNO stav,
   takže tuto odpověď použije jen ve správné situaci.
========================================================= */

function getLukyCardCountQuote(
    cardCount
) {

    const count =
        Number(
            cardCount
        );


    if (
        count ===
        1
    ) {

        return getLukyUnoAlreadySaidQuote();
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
   STŮJ – LUKY
========================================================= */

function getSkipCounterQuote(
    counterNumber
) {

    if (
        counterNumber <=
        0
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
   STŮJ – HRÁČ
========================================================= */

function getPlayerSkipCounterQuote(
    counterNumber
) {

    if (
        counterNumber <=
        0
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

   Převádí string nebo objekt na jednotný formát.
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

            type:
                "single",

            text:
                quote
        };
    }


    if (
        quote.type ===
            "single" &&
        typeof quote.text ===
            "string"
    ) {

        return {

            type:
                "single",

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

            type:
                "sequence",

            lines:
                quote.lines.filter(
                    (line) =>
                        typeof line ===
                            "string" &&
                        line.length >
                            0
                ),

            pauseMs:
                Math.max(
                    0,
                    Number(
                        quote.pauseMs
                    ) ||
                    0
                )
        };
    }


    return null;
}


/* =========================================================
   POMOCNÉ GETTERY
========================================================= */


/* =========================================================
   FALEŠNÉ UNO HRÁČE
========================================================= */

function getFalseUnoQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .falseUno;
}


/* =========================================================
   LUKYMU ZBÝVÁ JEDNA KARTA
========================================================= */

function getLukyOneCardQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .oneCardLeft;
}


/* =========================================================
   LUKY ŘEKNE UNO
========================================================= */

function getLukyUnoQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .uno;
}


/* =========================================================
   LUKY UNO UŽ ŘEKL
========================================================= */

function getLukyUnoAlreadySaidQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .unoAlreadySaid;
}


/* =========================================================
   LUKY BYL NACHYTÁN
========================================================= */

function getLukyCaughtUnoPenaltyQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .caughtUnoPenalty;
}


/* =========================================================
   STARŠÍ GETTER

   Zachováváme kvůli kompatibilitě game.js.
========================================================= */

function getCaughtUnoQuote() {

    return GAME_QUOTES
        .luky
        .reactions
        .caughtUno;
}


/* =========================================================
   HRÁČ ŘEKNE UNO
========================================================= */

function getPlayerUnoQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .uno;
}


/* =========================================================
   HRÁČ NACHYTÁ LUKYHO
========================================================= */

function getPlayerCaughtLukyUnoQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .caughtLukyUno;
}


/* =========================================================
   KUŘ!
========================================================= */

function getKurQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .kur;
}


/* =========================================================
   SEDMIČKA
========================================================= */

function getSevenSwapQuote() {

    return GAME_QUOTES
        .player
        .reactions
        .sevenSwap;
}


/* =========================================================
   PŘEMÝŠLENÍ
========================================================= */

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
