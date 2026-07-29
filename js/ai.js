"use strict";


/* =========================================================
   DOTS UNO
   LUKYHO AI

   Cíl AI:
   - nehrát dokonale
   - působit jako člověk
   - vždy mít prodlevu 2–4 sekundy
   - občas zobrazit "..."
   - rozumně pracovat s:
       +2
       +4
       Stůj
       Kuř!
       sedmičkou
       nulou
       změnou barvy

   AI NEMÁ pamatovat přesný obsah staré ruky hráče
   po výměně rukou přes 0 nebo 7.
========================================================= */


/* =========================================================
   HLAVNÍ ROZHODNUTÍ AI

   Vrací objekt typu:

   {
       action: "play",
       cards: [...],
       chosenColor: "red"
   }

   nebo:

   {
       action: "draw"
   }
========================================================= */

function getLukyDecision(gameState) {
    if (!gameState) {
        return {
            action: "draw"
        };
    }


    const hand =
        Array.isArray(gameState.lukyHand)
            ? gameState.lukyHand
            : [];


    if (hand.length === 0) {
        return {
            action: "none"
        };
    }


    /*
        Nejdřív řešíme aktivní +2/+4 řetězec.
    */

    if (
        gameState.drawPenalty > 0 &&
        gameState.topPenaltyType
    ) {
        const drawCounter =
            chooseDrawStackCounter(
                hand,
                gameState.topPenaltyType
            );


        if (drawCounter) {
            return {
                action: "play",

                cards:
                    drawCounter,

                chosenColor:
                    needsColorChoice(
                        drawCounter
                    )
                        ? chooseLukyColorAfterPlay(
                            hand,
                            drawCounter
                        )
                        : null
            };
        }


        return {
            action: "draw"
        };
    }


    /*
        Aktivní Stůj řetězec.
    */

    if (
        gameState.skipChainCount > 0
    ) {
        const skipCounter =
            chooseSkipCounter(
                hand
            );


        if (skipCounter) {
            return {
                action: "play",

                cards:
                    skipCounter,

                chosenColor: null
            };
        }


        return {
            action: "skip"
        };
    }


    /*
        Běžný tah.
    */

    const playableGroups =
        getPlayableGroups(
            hand,
            gameState
        );


    if (
        playableGroups.length === 0
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
        action: "play",

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
   PRODLEVA AI

   UI / game.js může zavolat tuto funkci před samotným tahem.
========================================================= */

async function waitForLukyThinking(
    {
        onThinkingStart = null,
        onThinkingEnd = null
    } = {}
) {
    const totalDelay =
        getRandomAiThinkingTime();


    const showDots =
        randomChance(
            GAME_CONFIG
                .aiThinking
                .showThinkingDotsChance
        );


    if (
        showDots &&
        typeof onThinkingStart === "function"
    ) {
        onThinkingStart(
            getThinkingQuote()
        );
    }


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


        if (remaining > 0) {
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
        typeof onThinkingEnd === "function"
    ) {
        onThinkingEnd();
    }
}


/* =========================================================
   SLEEP
========================================================= */

function sleep(milliseconds) {
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
   PLAYABLE SKUPINY

   Každá skupina = jedna karta nebo více identických karet
   pro Kuř!.
========================================================= */

function getPlayableGroups(
    hand,
    gameState
) {
    const groups = [];

    const visitedIds =
        new Set();


    hand.forEach((card) => {

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
            Kuř! skupina.
        */

        if (
            identical.length >=
            GAME_CONFIG.kur.minimumCards
        ) {
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
                    [...identical]
                );
            }
        }
    });


    return groups;
}


/* =========================================================
   HORNÍ ODHOD
========================================================= */

function getTopDiscardCard(gameState) {
    const pile =
        Array.isArray(
            gameState?.discardPile
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
   VÝBĚR NEJLEPŠÍ SKUPINY

   AI není dokonalá.

   Preferuje:
   - Kuř! když může odhodit víc karet
   - čísla před divokými kartami
   - silnější karty občas
   - nulu / sedmičku podle situace
========================================================= */

function chooseBestPlayableGroup(
    groups,
    hand,
    gameState
) {
    if (
        !Array.isArray(groups) ||
        groups.length === 0
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
        (a, b) =>
            b.score -
            a.score
    );


    /*
        Aby AI nebyla úplně deterministická:
        většinou vezme nejlepší možnost,
        občas druhou nejlepší.
    */

    if (
        scored.length > 1 &&
        randomChance(0.18)
    ) {
        return scored[1].cards;
    }


    return scored[0].cards;
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
        !cards ||
        cards.length === 0
    ) {
        return -9999;
    }


    const first =
        cards[0];


    let score = 0;


    /*
        Kuř! je výhodné.
    */

    if (
        cards.length > 1
    ) {
        score +=
            cards.length * 16;
    }


    /*
        Čím víc karet AI odhodí, tím lépe.
    */

    score +=
        cards.length * 10;


    /*
        Číselné karty jsou levné.
    */

    if (
        first.type ===
        CARD_TYPES.NUMBER
    ) {
        score += 15;


        if (
            first.value === 0
        ) {
            score +=
                scoreZeroPlay(
                    hand,
                    gameState
                );
        }


        if (
            first.value === 7
        ) {
            score +=
                scoreSevenPlay(
                    hand,
                    gameState
                );
        }
    }


    /*
        Stůj.
    */

    if (
        first.type ===
        CARD_TYPES.SKIP
    ) {
        score += 24;
    }


    /*
        Změna směru nemá v 1v1 efekt,
        takže nižší priorita.
    */

    if (
        first.type ===
        CARD_TYPES.REVERSE
    ) {
        score += 7;
    }


    /*
        +2 je silná karta.
    */

    if (
        first.type ===
        CARD_TYPES.DRAW_TWO
    ) {
        score += 36;

        score +=
            getDrawPenaltyForCards(
                cards
            ) * 3;
    }


    /*
        Změnu barvy si spíš šetří,
        pokud není potřeba.
    */

    if (
        first.type ===
        CARD_TYPES.WILD
    ) {
        score += 6;


        if (
            countNormalPlayableCards(
                hand,
                gameState
            ) === 0
        ) {
            score += 35;
        }
    }


    /*
        +4 je silná, ale AI ji nemusí vždy pálit hned.
    */

    if (
        first.type ===
        CARD_TYPES.WILD_DRAW_FOUR
    ) {
        score += 42;

        score +=
            getDrawPenaltyForCards(
                cards
            ) * 3;
    }


    /*
        Když Lukymu zbývá málo karet,
        víc preferuje rychlé odhazování.
    */

    if (
        hand.length <= 3
    ) {
        score +=
            cards.length * 12;
    }


    /*
        Trocha náhody.
    */

    score +=
        randomInteger(
            0,
            8
        );


    return score;
}


/* =========================================================
   POČET BĚŽNĚ HRATELNÝCH KARET
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

            if (
                isWildCard(card)
            ) {
                return false;
            }


            if (
                isDrawTwo(card)
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
   NULA – ROZHODOVÁNÍ

   Když má Luky výrazně víc karet než hráč,
   výměna je atraktivní.

   Když má méně karet, nula je nevýhodná.
========================================================= */

function scoreZeroPlay(
    hand,
    gameState
) {
    const playerCards =
        Array.isArray(
            gameState.playerHand
        )
            ? gameState.playerHand.length
            : 0;


    const lukyCards =
        hand.length;


    const difference =
        lukyCards -
        playerCards;


    if (
        difference >= 4
    ) {
        return 45;
    }


    if (
        difference >= 2
    ) {
        return 24;
    }


    if (
        difference <= -3
    ) {
        return -30;
    }


    if (
        difference <= -1
    ) {
        return -12;
    }


    return 0;
}


/* =========================================================
   SEDMIČKA – BODOVÁNÍ KARTY
========================================================= */

function scoreSevenPlay(
    hand,
    gameState
) {
    const playerCards =
        Array.isArray(
            gameState.playerHand
        )
            ? gameState.playerHand.length
            : 0;


    const difference =
        hand.length -
        playerCards;


    if (
        difference >= 4
    ) {
        return 32;
    }


    if (
        difference >= 2
    ) {
        return 18;
    }


    if (
        difference <= -2
    ) {
        return -12;
    }


    return 0;
}


/* =========================================================
   SEDMIČKA – CHCE LUKY VYMĚNIT RUCE?

   AI si nepamatuje starou ruku hráče.
   Rozhodnutí je založeno pouze na aktuálních počtech karet.
========================================================= */

function shouldLukySwapOnSeven(
    gameState
) {
    const lukyCards =
        gameState?.lukyHand?.length ||
        0;


    const playerCards =
        gameState?.playerHand?.length ||
        0;


    /*
        Pokud má Luky alespoň o 2 karty víc,
        většinou chce výměnu.
    */

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
        malá náhodná možnost.
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
        téměř nikdy nemění.
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
            CARD_TYPES.WILD_DRAW_FOUR
        );


    const drawTwos =
        groupIdenticalCardsByType(
            hand,
            CARD_TYPES.DRAW_TWO
        );


    /*
        NAVRCHU +4
    */

    if (
        topPenaltyType ===
        CARD_TYPES.WILD_DRAW_FOUR
    ) {
        /*
            Nejraději použije +4.
        */

        if (
            drawFours.length > 0
        ) {
            return chooseDrawCardGroup(
                drawFours
            );
        }


        /*
            Jinak potřebuje alespoň 2× +2.
        */

        const validTwos =
            drawTwos.filter(
                (group) =>
                    group.length >=
                    GAME_CONFIG
                        .drawStacking
                        .minimumDrawTwosAgainstDrawFour
            );


        if (
            validTwos.length > 0
        ) {
            return chooseDrawCardGroup(
                validTwos,
                GAME_CONFIG
                    .drawStacking
                    .minimumDrawTwosAgainstDrawFour
            );
        }


        return null;
    }


    /*
        NAVRCHU +2
    */

    if (
        topPenaltyType ===
        CARD_TYPES.DRAW_TWO
    ) {
        /*
            Preferuje +2, pokud ji má.
        */

        if (
            drawTwos.length > 0
        ) {
            return chooseDrawCardGroup(
                drawTwos
            );
        }


        if (
            drawFours.length > 0
        ) {
            return chooseDrawCardGroup(
                drawFours
            );
        }
    }


    return null;
}


/* =========================================================
   SKUPINY IDENTICKÝCH DOBÍRACÍCH KARET

   Např. dvě modré +2 tvoří jednu Kuř! skupinu.
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


    const groups = [];

    const used =
        new Set();


    relevant.forEach((card) => {

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
    });


    return groups;
}


/* =========================================================
   VÝBĚR DOBÍRACÍ SKUPINY

   AI občas zahraje všechny stejné karty přes Kuř!,
   ale ne vždy.
========================================================= */

function chooseDrawCardGroup(
    groups,
    minimumCount = 1
) {
    if (
        !Array.isArray(groups) ||
        groups.length === 0
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
        valid.length === 0
    ) {
        return null;
    }


    valid.sort(
        (a, b) =>
            b.length -
            a.length
    );


    const best =
        valid[0];


    /*
        Pokud má více identických karet,
        často je pošle najednou.
    */

    if (
        best.length >
        minimumCount
    ) {
        if (
            randomChance(0.72)
        ) {
            return [...best];
        }


        return best.slice(
            0,
            minimumCount
        );
    }


    return [...best];
}


/* =========================================================
   STŮJ COUNTER
========================================================= */

function chooseSkipCounter(hand) {
    const skipGroups =
        groupIdenticalCardsByType(
            hand,
            CARD_TYPES.SKIP
        );


    if (
        skipGroups.length === 0
    ) {
        return null;
    }


    /*
        Stačí jedna Stůj.

        Pokud má více identických, Kuř! mu nedává
        zvláštní efekt, takže AI většinou použije jednu.
    */

    const group =
        skipGroups[0];


    if (
        group.length >= 2 &&
        randomChance(0.12)
    ) {
        return [...group];
    }


    return [
        group[0]
    ];
}


/* =========================================================
   JE POTŘEBA VYBRAT BARVU?
========================================================= */

function needsColorChoice(cards) {
    if (
        !Array.isArray(cards) ||
        cards.length === 0
    ) {
        return false;
    }


    return isWildCard(
        cards[0]
    );
}


/* =========================================================
   VÝBĚR BARVY PO DIVOKÉ KARTĚ

   Luky vybere barvu, které má v ruce nejvíc
   po odečtení právě zahraných karet.
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
        red: 0,
        yellow: 0,
        green: 0,
        blue: 0
    };


    remaining.forEach(
        (card) => {

            if (
                Object.prototype.hasOwnProperty.call(
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
        (a, b) =>
            b[1] -
            a[1]
    );


    const bestCount =
        entries[0][1];


    if (
        bestCount === 0
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
   MÁ LUKY PŘESNĚ JEDNU KARTU?
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
   ROZHODNUTÍ, ZDA LUKY UNO ZAPOMENE
========================================================= */

function shouldLukyForgetUno() {
    return randomChance(
        GAME_CONFIG
            .lukyUno
            .forgetChance
    );
}


/* =========================================================
   EMOTE – SILNÁ SITUACE PRO LUKYHO
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
   EMOTE – MÍRNÁ SITUACE PRO LUKYHO
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
   ROZDÍL POČTU KARET

   Kladné číslo = hráč má více karet než Luky.
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
   JE LUKY VE VÝRAZNÉ VÝHODĚ POČTEM KARET?
========================================================= */

function isLukyClearlyAhead(
    gameState
) {
    return (
        getLukyCardAdvantage(
            gameState
        ) >= 4
    );
}


/* =========================================================
   POMOCNÁ FUNKCE PRO AI DEBUG

   Lze zavolat v konzoli:
   debugLukyDecision(gameState)
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
