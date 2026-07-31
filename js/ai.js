"use strict";


/* =========================================================
   DOTS UNO
   LUKYHO AI

   Cíl:
   - rozumný, ale ne dokonalý soupeř
   - lidské prodlevy
   - přemýšlení jen tam, kde má skutečně více možností
   - jasné / vynucené tahy jsou rychlé
   - malá ruka zrychluje, velká může lehce přidat čas
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
        gameState.drawPenalty > 0
    ) {

        const requiredCounterAmount =
            getAiRequiredDrawCounterAmount(
                gameState
            );


        const counter =
            chooseDrawStackCounter(
                hand,
                requiredCounterAmount
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

    const config =
        GAME_CONFIG.aiThinking;


    const profile =
        getLukyThinkingProfile(
            gameState
        );


    const totalDelay =
        getLukyThinkingDelay(
            profile,
            gameState
        );


    /*
        "..." dává smysl jen tehdy, když Luky skutečně vybírá
        mezi více možnostmi. U jasného / vynuceného tahu by
        působilo uměle a jen zdržovalo hru.
    */

    const showDots =
        profile.mode !==
            "obvious" &&
        totalDelay >=
            config.thinkingDotsMinMs &&
        randomChance(
            config.showThinkingDotsChance
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


    await sleep(
        totalDelay
    );


    if (
        typeof onThinkingEnd ===
            "function"
    ) {

        onThinkingEnd();
    }
}


/* =========================================================
   PROFIL PŘEMÝŠLENÍ

   obvious:
   - vynucené líznutí
   - vynucené Stůj
   - právě jedna reálná možnost

   normal:
   - dvě reálné možnosti

   complex:
   - tři a více možností
========================================================= */

function getLukyThinkingProfile(
    gameState
) {

    const hand =
        Array.isArray(
            gameState?.lukyHand
        )
            ? gameState.lukyHand
            : [];


    if (
        !gameState ||
        hand.length ===
            0
    ) {

        return {
            mode:
                "obvious",

            optionCount:
                0,

            forcedDraw:
                true
        };
    }


    /*
        Aktivní dobírací stack.
    */

    if (
        gameState.drawPenalty >
        0
    ) {

        const requiredAmount =
            getAiRequiredDrawCounterAmount(
                gameState
            );


        const counterOptions =
            getDrawStackCounterOptions(
                hand,
                requiredAmount
            );


        if (
            counterOptions.length ===
            0
        ) {

            return {
                mode:
                    "obvious",

                optionCount:
                    1,

                forcedDraw:
                    true
            };
        }


        return {
            mode:
                counterOptions.length === 1
                    ? "obvious"
                    : counterOptions.length === 2
                        ? "normal"
                        : "complex",

            optionCount:
                counterOptions.length,

            forcedDraw:
                false
        };
    }


    /*
        Aktivní Stůj řetězec.
    */

    if (
        gameState.skipChainCount >
        0
    ) {

        const skipOptions =
            groupIdenticalCardsByType(
                hand,
                CARD_TYPES.SKIP
            );


        return {
            mode:
                skipOptions.length <= 1
                    ? "obvious"
                    : "normal",

            optionCount:
                Math.max(
                    1,
                    skipOptions.length
                ),

            forcedDraw:
                false
        };
    }


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
            mode:
                "obvious",

            optionCount:
                1,

            forcedDraw:
                true
        };
    }


    if (
        playableGroups.length ===
        1
    ) {

        return {
            mode:
                "obvious",

            optionCount:
                1,

            forcedDraw:
                false
        };
    }


    if (
        playableGroups.length ===
        2
    ) {

        return {
            mode:
                "normal",

            optionCount:
                2,

            forcedDraw:
                false
        };
    }


    return {
        mode:
            "complex",

        optionCount:
            playableGroups.length,

        forcedDraw:
            false
    };
}


function getLukyThinkingDelay(
    profile,
    gameState
) {

    const config =
        GAME_CONFIG.aiThinking;


    const handCount =
        Array.isArray(
            gameState?.lukyHand
        )
            ? gameState.lukyHand.length
            : 0;


    /*
        Když je jasné, že Luky pouze lízne, hra má odsýpat.
        Týká se to i několika po sobě jdoucích neúspěšných kol.
    */

    if (
        profile?.forcedDraw
    ) {

        return randomInteger(
            config.repeatedForcedDrawMinMs,
            config.repeatedForcedDrawMaxMs
        );
    }


    let minMs;
    let maxMs;


    switch (
        profile?.mode
    ) {

        case "complex":

            minMs =
                config.complexMinMs;

            maxMs =
                config.complexMaxMs;

            break;


        case "normal":

            minMs =
                config.normalMinMs;

            maxMs =
                config.normalMaxMs;

            break;


        case "obvious":
        default:

            minMs =
                config.obviousMinMs;

            maxMs =
                config.obviousMaxMs;

            break;
    }


    /*
        Čím méně karet Luky má, tím méně má co analyzovat.
    */

    if (
        handCount > 0 &&
        handCount <=
            config.smallHandThreshold
    ) {

        minMs -=
            config.smallHandReductionMs;

        maxMs -=
            config.smallHandReductionMs;
    }


    /*
        Větší ruka může přidat trochu času, protože existuje
        více kombinací, ale nikdy nepřekročí absolutní limit.
    */

    if (
        handCount >
        config.largeHandThreshold
    ) {

        const bonus =
            Math.min(
                config.largeHandMaxBonusMs,
                (
                    handCount -
                    config.largeHandThreshold
                ) *
                config.largeHandBonusPerCardMs
            );


        minMs +=
            Math.round(
                bonus *
                0.45
            );

        maxMs +=
            bonus;
    }


    minMs =
        Math.max(
            250,
            minMs
        );


    maxMs =
        Math.max(
            minMs,
            Math.min(
                config.absoluteMaxMs,
                maxMs
            )
        );


    return randomInteger(
        minMs,
        maxMs
    );
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

function getAiRequiredDrawCounterAmount(
    gameState
) {

    const explicitAmount =
        Number(
            gameState
                ?.topPenaltyAmount
        );


    if (
        Number.isFinite(
            explicitAmount
        ) &&
        explicitAmount >
            0
    ) {

        return explicitAmount;
    }


    /*
        Kompatibilita se starší rozehranou partií.
    */

    if (
        gameState?.topPenaltyType ===
        CARD_TYPES.DRAW_TWO
    ) {

        return 2;
    }


    if (
        gameState?.topPenaltyType ===
        CARD_TYPES.WILD_DRAW_FOUR
    ) {

        return 4;
    }


    return 0;
}


function getDrawStackCounterOptions(
    hand,
    requiredCounterAmount
) {

    const required =
        Number(
            requiredCounterAmount
        );


    if (
        !Array.isArray(
            hand
        ) ||
        !Number.isFinite(
            required
        ) ||
        required <=
            0
    ) {

        return [];
    }


    const options =
        [];


    const drawTwos =
        groupIdenticalCardsByType(
            hand,
            CARD_TYPES.DRAW_TWO
        );


    const drawFours =
        groupIdenticalCardsByType(
            hand,
            CARD_TYPES.WILD_DRAW_FOUR
        );


    /*
        Kuř! vyžaduje identické karty, takže kombinujeme jen
        karty stejného typu / stejné identity. Hledáme přesně
        hodnotu posledního stacku, ne celkovou penalizaci.
    */

    if (
        required %
            2 ===
        0
    ) {

        const neededTwos =
            required /
            2;


        drawTwos.forEach(
            (group) => {

                if (
                    group.length >=
                    neededTwos
                ) {

                    options.push(
                        group.slice(
                            0,
                            neededTwos
                        )
                    );
                }
            }
        );
    }


    if (
        required %
            4 ===
        0
    ) {

        const neededFours =
            required /
            4;


        drawFours.forEach(
            (group) => {

                if (
                    group.length >=
                    neededFours
                ) {

                    options.push(
                        group.slice(
                            0,
                            neededFours
                        )
                    );
                }
            }
        );
    }


    return options;
}


function chooseDrawStackCounter(
    hand,
    requiredCounterAmount
) {

    const options =
        getDrawStackCounterOptions(
            hand,
            requiredCounterAmount
        );


    if (
        options.length ===
        0
    ) {

        return null;
    }


    /*
        Když je více přesných možností (např. +4 lze dát
        jednou +4 nebo dvěma identickými +2), preferuje Luky
        menší počet odhozených karet jen lehce. Není dokonalý.
    */

    const sorted =
        [
            ...options
        ].sort(
            (
                first,
                second
            ) =>
                first.length -
                second.length
        );


    if (
        sorted.length >
            1 &&
        randomChance(
            0.22
        )
    ) {

        return sorted[
            randomInteger(
                1,
                sorted.length - 1
            )
        ];
    }


    return sorted[0];
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
