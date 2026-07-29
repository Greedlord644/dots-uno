"use strict";


/* =========================================================
   DOTS UNO
   LUKYHO AI

   Cíl:
   - rozumný, ale ne dokonalý soupeř
   - lidské prodlevy
   - občas delší přemýšlení
   - s velkou rukou trochu rychlejší tah
   - žádné vlastní generované hlášky
========================================================= */


/* =========================================================
   HLAVNÍ ROZHODNUTÍ AI
========================================================= */

function getLukyDecision(gameState) {

    if (!gameState) {

        return {
            action: "draw"
        };
    }


    const hand =
        Array.isArray(
            gameState.lukyHand
        )
            ? gameState.lukyHand
            : [];


    if (
        hand.length === 0
    ) {

        return {
            action: "none"
        };
    }


    /* =====================================================
       +2 / +4 ŘETĚZEC
    ===================================================== */

    if (
        gameState.drawPenalty > 0 &&
        gameState.topPenaltyType
    ) {

        const counter =
            chooseDrawStackCounter(
                hand,
                gameState.topPenaltyType
            );


        if (counter) {

            return {

                action:
                    "play",

                cards:
                    counter,

                chosenColor:
                    needsColorChoice(
                        counter
                    )
                        ? chooseLukyColorAfterPlay(
                            hand,
                            counter
                        )
                        : null
            };
        }


        return {
            action: "draw"
        };
    }


    /* =====================================================
       STŮJ ŘETĚZEC
    ===================================================== */

    if (
        gameState.skipChainCount >
        0
    ) {

        const counter =
            chooseSkipCounter(
                hand
            );


        if (counter) {

            return {

                action:
                    "play",

                cards:
                    counter,

                chosenColor:
                    null
            };
        }


        return {
            action: "skip"
        };
    }


    /* =====================================================
       BĚŽNÝ TAH
    ===================================================== */

    const playableGroups =
        getPlayableGroups(
            hand,
            gameState
        );


    if (
        playableGroups.length ===
        0
    ) {

        return {
            action: "draw"
        };
    }


    const chosenGroup =
        chooseBestPlayableGroup(
            playableGroups,
            hand,
            gameState
        );


    if (!chosenGroup) {

        return {
            action: "draw"
        };
    }


    return {

        action:
            "play",

        cards:
            chosenGroup,

        chosenColor:
            needsColorChoice(
                chosenGroup
            )
                ? chooseLukyColorAfterPlay(
                    hand,
                    chosenGroup
                )
                : null
    };
}


/* =========================================================
   PŘEMÝŠLENÍ LUKYHO

   Standard:
   2–4 s

   Občas:
   6–8 s

   Hodně karet:
   1,5–3 s
========================================================= */

async function waitForLukyThinking(
    {
        gameState = null,
        onThinkingStart = null,
        onThinkingEnd = null
    } = {}
) {

    const handCount =
        Array.isArray(
            gameState?.lukyHand
        )
            ? gameState.lukyHand.length
            : null;


    const totalDelay =
        getRandomAiThinkingTime(
            handCount
        );


    const showDots =
        randomChance(
            GAME_CONFIG
                .aiThinking
                .showThinkingDotsChance
        );


    if (
        showDots &&
        typeof onThinkingStart ===
            "function"
    ) {

        onThinkingStart(
            getThinkingQuote()
        );
    }


    /*
        Pokud ukazujeme "...", necháme je viditelné
        aspoň minimální dobu.

        Při dlouhém tahu ale zůstávají klidně déle.
    */

    if (showDots) {

        const minimumDotsTime =
            Math.min(
                GAME_CONFIG
                    .aiThinking
                    .thinkingDotsMinMs,

                totalDelay
            );


        await sleep(
            minimumDotsTime
        );


        const remaining =
            totalDelay -
            minimumDotsTime;


        if (
            remaining > 0
        ) {

            await sleep(
                remaining
            );
        }

    } else {

        await sleep(
            totalDelay
        );
    }


    if (
        typeof onThinkingEnd ===
            "function"
    ) {

        onThinkingEnd();
    }
}


/* =========================================================
   SLEEP
========================================================= */

function sleep(
    milliseconds
) {

    return new Promise(
        (resolve) => {

            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}


/* =========================================================
   HRATELNÉ SKUPINY

   Jedna karta nebo více identických karet přes Kuř!.
========================================================= */

function getPlayableGroups(
    hand,
    gameState
) {

    const groups =
        [];


    const visitedIds =
        new Set();


    hand.forEach(
        (card) => {

            if (
                visitedIds.has(
                    card.id
                )
            ) {

                return;
            }


            const identical =
                findIdenticalCards(
                    hand,
                    card
                );


            identical.forEach(
                (item) => {

                    visitedIds.add(
                        item.id
                    );
                }
            );


            /*
                Jedna karta.
            */

            if (
                isCardNormallyPlayable(
                    card,
                    getTopDiscardCard(
                        gameState
                    ),
                    gameState.currentColor
                )
            ) {

                groups.push(
                    [card]
                );
            }


            /*
                Kuř!
            */

            if (
                GAME_CONFIG
                    .kur
                    .enabled &&
                identical.length >=
                    GAME_CONFIG
                        .kur
                        .minimumCards &&
                isCardNormallyPlayable(
                    card,
                    getTopDiscardCard(
                        gameState
                    ),
                    gameState.currentColor
                )
            ) {

                groups.push(
                    [
                        ...identical
                    ]
                );
            }
        }
    );


    return groups;
}


/* =========================================================
   VRCHNÍ KARTA
========================================================= */

function getTopDiscardCard(
    gameState
) {

    const pile =
        Array.isArray(
            gameState
                ?.discardPile
        )
            ? gameState.discardPile
            : [];


    if (
        pile.length === 0
    ) {

        return null;
    }


    return pile[
        pile.length - 1
    ];
}


/* =========================================================
   VÝBĚR TAHU
========================================================= */

function chooseBestPlayableGroup(
    groups,
    hand,
    gameState
) {

    if (
        !Array.isArray(
            groups
        ) ||
        groups.length ===
            0
    ) {

        return null;
    }


    const scored =
        groups.map(
            (cards) => ({

                cards,

                score:
                    scorePlayableGroup(
                        cards,
                        hand,
                        gameState
                    )
            })
        );


    scored.sort(
        (
            first,
            second
        ) =>
            second.score -
            first.score
    );


    /*
        AI není perfektní.

        Občas vybere druhou nejlepší možnost.
    */

    if (
        scored.length >
            1 &&
        randomChance(
            0.18
        )
    ) {

        return scored[1]
            .cards;
    }


    return scored[0]
        .cards;
}


/* =========================================================
   BODOVÁNÍ TAHU
========================================================= */

function scorePlayableGroup(
    cards,
    hand,
    gameState
) {

    if (
        !Array.isArray(
            cards
        ) ||
        cards.length ===
            0
    ) {

        return -9999;
    }


    const first =
        cards[0];


    let score =
        0;


    /* =====================================================
       KUŘ!
    ===================================================== */

    if (
        cards.length >
        1
    ) {

        score +=
            cards.length *
            16;
    }


    /*
        Odhodit více karet je výhodné.
    */

    score +=
        cards.length *
        10;


    /* =====================================================
       ČÍSLO
    ===================================================== */

    if (
        first.type ===
        CARD_TYPES.NUMBER
    ) {

        score +=
            15;


        if (
            first.value ===
            0
        ) {

            score +=
                scoreZeroPlay(
                    hand,
                    gameState
                );
        }


        if (
            first.value ===
            7
        ) {

            score +=
                scoreSevenPlay(
                    hand,
                    gameState
                );
        }
    }


    /* =====================================================
       STŮJ
    ===================================================== */

    if (
        first.type ===
        CARD_TYPES.SKIP
    ) {

        score +=
            24;


        /*
            Když má soupeř málo karet,
            Stůj je ještě hodnotnější.
        */

        if (
            gameState
                ?.playerHand
                ?.length <=
            3
        ) {

            score +=
                14;
        }
    }


    /* =====================================================
       REVERSE

       V 1v1 bez speciálního efektu.
    ===================================================== */

    if (
        first.type ===
        CARD_TYPES.REVERSE
    ) {

        score +=
            7;
    }


    /* =====================================================
       +2
    ===================================================== */

    if (
        first.type ===
        CARD_TYPES.DRAW_TWO
    ) {

        score +=
            36;


        score +=
            getDrawPenaltyForCards(
                cards
            ) *
            3;
    }


    /* =====================================================
       WILD
    ===================================================== */

    if (
        first.type ===
        CARD_TYPES.WILD
    ) {

        score +=
            6;


        /*
            Pokud nemá jinou normálně hratelnou kartu,
            Wild je výrazně atraktivnější.
        */

        if (
            countNormalPlayableCards(
                hand,
                gameState
            ) === 0
        ) {

            score +=
                35;
        }
    }


    /* =====================================================
       +4
    ===================================================== */

    if (
        first.type ===
        CARD_TYPES.WILD_DRAW_FOUR
    ) {

        score +=
            42;


        score +=
            getDrawPenaltyForCards(
                cards
            ) *
            3;


        /*
            Pokud má hráč málo karet,
            Luky rád zatlačí.
        */

        if (
            gameState
                ?.playerHand
                ?.length <=
            3
        ) {

            score +=
                14;
        }
    }


    /* =====================================================
       LUKY MÁ MÁLO KARET

       Preferuje rychlé odhazování.
    ===================================================== */

    if (
        hand.length <=
        3
    ) {

        score +=
            cards.length *
            12;
    }


    /*
        Malá náhoda, aby tahy nebyly pokaždé stejné.
    */

    score +=
        randomInteger(
            0,
            8
        );


    return score;
}


/* =========================================================
   BĚŽNĚ HRATELNÉ KARTY
========================================================= */

function countNormalPlayableCards(
    hand,
    gameState
) {

    const topCard =
        getTopDiscardCard(
            gameState
        );


    return hand.filter(
        (card) => {

            /*
                Tady chceme zjistit množství "normálních"
                možností, abychom věděli, zda si má Luky
                šetřit Wild.
            */

            if (
                isWildCard(
                    card
                )
            ) {

                return false;
            }


            if (
                isDrawTwo(
                    card
                )
            ) {

                return false;
            }


            return isCardNormallyPlayable(
                card,
                topCard,
                gameState.currentColor
            );
        }
    ).length;
}


/* =========================================================
   NULA

   Pokud má Luky víc karet než hráč,
   výměna je pro něj zajímavější.
========================================================= */

function scoreZeroPlay(
    hand,
    gameState
) {

    const playerCards =
        Array.isArray(
            gameState
                ?.playerHand
        )
            ? gameState.playerHand.length
            : 0;


    const lukyCards =
        hand.length;


    const difference =
        lukyCards -
        playerCards;


    if (
        difference >=
        4
    ) {

        return 45;
    }


    if (
        difference >=
        2
    ) {

        return 24;
    }


    if (
        difference <=
        -3
    ) {

        return -30;
    }


    if (
        difference <=
        -1
    ) {

        return -12;
    }


    return 0;
}


/* =========================================================
   SEDMIČKA
========================================================= */

function scoreSevenPlay(
    hand,
    gameState
) {

    const playerCards =
        Array.isArray(
            gameState
                ?.playerHand
        )
            ? gameState.playerHand.length
            : 0;


    const difference =
        hand.length -
        playerCards;


    if (
        difference >=
        4
    ) {

        return 32;
    }


    if (
        difference >=
        2
    ) {

        return 18;
    }


    if (
        difference <=
        -2
    ) {

        return -12;
    }


    return 0;
}


/* =========================================================
   CHCE LUKY VYMĚNIT RUCE PO 7?
========================================================= */

function shouldLukySwapOnSeven(
    gameState
) {

    const lukyCards =
        gameState
            ?.lukyHand
            ?.length ||
        0;


    const playerCards =
        gameState
            ?.playerHand
            ?.length ||
        0;


    /*
        Výrazně horší ruka:
        skoro vždy chce výměnu.
    */

    if (
        lukyCards >=
        playerCards + 4
    ) {

        return randomChance(
            0.92
        );
    }


    if (
        lukyCards >=
        playerCards + 2
    ) {

        return randomChance(
            0.82
        );
    }


    /*
        Stejný počet:
        jen občas.
    */

    if (
        lukyCards ===
        playerCards
    ) {

        return randomChance(
            0.18
        );
    }


    /*
        Pokud je na tom Luky lépe,
        výměnu téměř nechce.
    */

    return randomChance(
        0.05
    );
}


/* =========================================================
   +2 / +4 COUNTER
========================================================= */

function chooseDrawStackCounter(
    hand,
    topPenaltyType
) {

    const drawFours =
        groupIdenticalCardsByType(
            hand,
            CARD_TYPES
                .WILD_DRAW_FOUR
        );


    const drawTwos =
        groupIdenticalCardsByType(
            hand,
            CARD_TYPES
                .DRAW_TWO
        );


    /* =====================================================
       NAVRCHU +4
    ===================================================== */

    if (
        topPenaltyType ===
        CARD_TYPES
            .WILD_DRAW_FOUR
    ) {

        /*
            Jedna nebo více +4 stačí
            bez ohledu na velikost aktuálního součtu.
        */

        if (
            drawFours.length >
            0
        ) {

            return chooseDrawCardGroup(
                drawFours
            );
        }


        /*
            Na +4 lze použít minimálně 2× +2.
        */

        const validDrawTwos =
            drawTwos.filter(
                (group) =>
                    group.length >=
                    GAME_CONFIG
                        .drawStacking
                        .minimumDrawTwosAgainstDrawFour
            );


        if (
            validDrawTwos.length >
            0
        ) {

            return chooseDrawCardGroup(
                validDrawTwos,
                GAME_CONFIG
                    .drawStacking
                    .minimumDrawTwosAgainstDrawFour
            );
        }


        return null;
    }


    /* =====================================================
       NAVRCHU +2
    ===================================================== */

    if (
        topPenaltyType ===
        CARD_TYPES
            .DRAW_TWO
    ) {

        /*
            Preferuje +2.
        */

        if (
            drawTwos.length >
            0
        ) {

            return chooseDrawCardGroup(
                drawTwos
            );
        }


        /*
            +4 je také možné.
        */

        if (
            drawFours.length >
            0
        ) {

            return chooseDrawCardGroup(
                drawFours
            );
        }
    }


    return null;
}


/* =========================================================
   IDENTICKÉ DOBÍRACÍ KARTY
========================================================= */

function groupIdenticalCardsByType(
    hand,
    type
) {

    const relevant =
        hand.filter(
            (card) =>
                card.type ===
                type
        );


    const groups =
        [];


    const used =
        new Set();


    relevant.forEach(
        (card) => {

            if (
                used.has(
                    card.id
                )
            ) {

                return;
            }


            const group =
                relevant.filter(
                    (candidate) =>
                        areCardsIdentical(
                            card,
                            candidate
                        )
                );


            group.forEach(
                (item) => {

                    used.add(
                        item.id
                    );
                }
            );


            groups.push(
                group
            );
        }
    );


    return groups;
}


/* =========================================================
   VÝBĚR +2 / +4 SKUPINY
========================================================= */

function chooseDrawCardGroup(
    groups,
    minimumCount = 1
) {

    if (
        !Array.isArray(
            groups
        ) ||
        groups.length ===
            0
    ) {

        return null;
    }


    const valid =
        groups.filter(
            (group) =>
                group.length >=
                minimumCount
        );


    if (
        valid.length ===
        0
    ) {

        return null;
    }


    valid.sort(
        (
            first,
            second
        ) =>
            second.length -
            first.length
    );


    const best =
        valid[0];


    /*
        Více identických karet:
        často je hodí najednou, ale ne vždy.
    */

    if (
        best.length >
        minimumCount
    ) {

        if (
            randomChance(
                0.72
            )
        ) {

            return [
                ...best
            ];
        }


        return best.slice(
            0,
            minimumCount
        );
    }


    return [
        ...best
    ];
}


/* =========================================================
   STŮJ COUNTER
========================================================= */

function chooseSkipCounter(
    hand
) {

    const groups =
        groupIdenticalCardsByType(
            hand,
            CARD_TYPES.SKIP
        );


    if (
        groups.length ===
        0
    ) {

        return null;
    }


    /*
        Více Stůj přes Kuř! nedává silnější efekt,
        takže si je Luky většinou šetří.
    */

    const group =
        groups[0];


    if (
        group.length >=
            2 &&
        randomChance(
            0.10
        )
    ) {

        return [
            ...group
        ];
    }


    return [
        group[0]
    ];
}


/* =========================================================
   JE POTŘEBA VYBRAT BARVU?
========================================================= */

function needsColorChoice(
    cards
) {

    if (
        !Array.isArray(
            cards
        ) ||
        cards.length ===
            0
    ) {

        return false;
    }


    return isWildCard(
        cards[0]
    );
}


/* =========================================================
   VÝBĚR BARVY PO WILD

   Vybere barvu, které má po zahrání
   nejvíc v ruce.
========================================================= */

function chooseLukyColorAfterPlay(
    hand,
    playedCards
) {

    const playedIds =
        new Set(
            playedCards.map(
                (card) =>
                    card.id
            )
        );


    const remaining =
        hand.filter(
            (card) =>
                !playedIds.has(
                    card.id
                )
        );


    const counts = {

        red:
            0,

        yellow:
            0,

        green:
            0,

        blue:
            0
    };


    remaining.forEach(
        (card) => {

            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        counts,
                        card.color
                    )
            ) {

                counts[
                    card.color
                ] += 1;
            }
        }
    );


    const entries =
        Object.entries(
            counts
        );


    entries.sort(
        (
            first,
            second
        ) =>
            second[1] -
            first[1]
    );


    const bestCount =
        entries[0]?.[1] ||
        0;


    /*
        Nemá žádnou barevnou kartu.
        Barvu zvolí náhodně.
    */

    if (
        bestCount ===
        0
    ) {

        const colors = [

            CARD_COLORS.RED,

            CARD_COLORS.YELLOW,

            CARD_COLORS.GREEN,

            CARD_COLORS.BLUE
        ];


        return colors[
            randomInteger(
                0,
                colors.length - 1
            )
        ];
    }


    const bestColors =
        entries
            .filter(
                ([, count]) =>
                    count ===
                    bestCount
            )
            .map(
                ([color]) =>
                    color
            );


    return bestColors[
        randomInteger(
            0,
            bestColors.length - 1
        )
    ];
}


/* =========================================================
   MÁ LUKY ŽLUTOU?
========================================================= */

function lukyHasYellowCard(
    gameState
) {

    return Boolean(
        gameState
            ?.lukyHand
            ?.some(
                (card) =>
                    card.color ===
                    CARD_COLORS.YELLOW
            )
    );
}


/* =========================================================
   MÁ LUKY UNO?
========================================================= */

function lukyHasUno(
    gameState
) {

    return (
        gameState
            ?.lukyHand
            ?.length ===
        1
    );
}


/* =========================================================
   ZAPOMENE UNO?
========================================================= */

function shouldLukyForgetUno() {

    return randomChance(
        GAME_CONFIG
            .lukyUno
            .forgetChance
    );
}


/* =========================================================
   SILNÝ EMOTE
========================================================= */

function shouldShowLukyStrongEmote() {

    if (
        !GAME_CONFIG
            .emotes
            .enabled
    ) {

        return false;
    }


    return randomChance(
        GAME_CONFIG
            .emotes
            .strongSituationChance
    );
}


/* =========================================================
   MÍRNÝ EMOTE
========================================================= */

function shouldShowLukyMildEmote() {

    if (
        !GAME_CONFIG
            .emotes
            .enabled
    ) {

        return false;
    }


    return randomChance(
        GAME_CONFIG
            .emotes
            .mildSituationChance
    );
}


/* =========================================================
   VÝHODA LUKYHO PODLE POČTU KARET

   Kladné číslo = hráč má víc karet než Luky.
========================================================= */

function getLukyCardAdvantage(
    gameState
) {

    const playerCount =
        gameState
            ?.playerHand
            ?.length ||
        0;


    const lukyCount =
        gameState
            ?.lukyHand
            ?.length ||
        0;


    return (
        playerCount -
        lukyCount
    );
}


/* =========================================================
   JE LUKY VÝRAZNĚ VE VEDENÍ?
========================================================= */

function isLukyClearlyAhead(
    gameState
) {

    return (
        getLukyCardAdvantage(
            gameState
        ) >=
        4
    );
}


/* =========================================================
   DEBUG
========================================================= */

function debugLukyDecision(
    gameState
) {

    const decision =
        getLukyDecision(
            gameState
        );


    console.log(
        "Luky decision:",
        decision
    );


    return decision;
}
