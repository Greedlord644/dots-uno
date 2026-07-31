"use strict";


/* =========================================================
   DOTS UNO
   DEFINICE KARET A BALÍČKU
========================================================= */


/* =========================================================
   BARVY
========================================================= */

const CARD_COLORS = {
    RED: "red",
    YELLOW: "yellow",
    GREEN: "green",
    BLUE: "blue",
    WILD: "wild"
};


const CARD_COLOR_LABELS = {
    red: "Červená",
    yellow: "Žlutá",
    green: "Zelená",
    blue: "Modrá",
    wild: "Divoká"
};


/* =========================================================
   TYPY KARET
========================================================= */

const CARD_TYPES = {
    NUMBER: "number",

    SKIP: "skip",

    REVERSE: "reverse",

    DRAW_TWO: "draw_two",

    WILD: "wild",

    WILD_DRAW_FOUR: "wild_draw_four"
};


/* =========================================================
   HODNOTY PRO ZOBRAZENÍ NA KARTÁCH

   Na kartách nebudou české názvy.
   Pouze čísla / symboly.
========================================================= */

const CARD_DISPLAY = {
    skip: "⊘",

    reverse: "↻",

    draw_two: "+2",

    wild: "✦",

    wild_draw_four: "+4"
};


/* =========================================================
   POŘADÍ BAREV PŘI ŘAZENÍ
========================================================= */

const COLOR_SORT_INDEX = new Map(
    GAME_CONFIG.handSorting.colorOrder.map(
        (color, index) => [
            color,
            index
        ]
    )
);


/* =========================================================
   TVORBA KARTY
========================================================= */

function createCard({
    color,
    type,
    value = null
}) {
    return {
        id: createCardId(),

        color,

        type,

        value,

        /*
            Tato hodnota je důležitá hlavně u divokých karet.

            Samotná karta je wild,
            ale po zahrání může být aktivní barva např. blue.

            activeColor se neukládá do karty v ruce.
            Herní engine si aktivní barvu drží zvlášť.
        */
        activeColor: null
    };
}


/* =========================================================
   ID KARTY
========================================================= */

let cardIdCounter = 0;


function createCardId() {
    cardIdCounter += 1;

    return `card-${Date.now()}-${cardIdCounter}`;
}


/* =========================================================
   STANDARDNÍ BALÍČEK

   Používáme strukturu klasického balíčku:

   Každá barva:
   - 1× nula
   - 2× čísla 1–9
   - 2× Stůj
   - 2× Změna směru
   - 2× +2

   Divoké:
   - 4× Změna barvy
   - 4× +4
========================================================= */

function createDeck() {
    const deck = [];

    const colors = [
        CARD_COLORS.RED,
        CARD_COLORS.YELLOW,
        CARD_COLORS.GREEN,
        CARD_COLORS.BLUE
    ];


    colors.forEach((color) => {

        /*
            Jedna nula.
        */

        deck.push(
            createCard({
                color,
                type: CARD_TYPES.NUMBER,
                value: 0
            })
        );


        /*
            Čísla 1–9 dvakrát.
        */

        for (
            let number = 1;
            number <= 9;
            number += 1
        ) {
            deck.push(
                createCard({
                    color,
                    type: CARD_TYPES.NUMBER,
                    value: number
                })
            );

            deck.push(
                createCard({
                    color,
                    type: CARD_TYPES.NUMBER,
                    value: number
                })
            );
        }


        /*
            2× Stůj.
        */

        for (
            let index = 0;
            index < 2;
            index += 1
        ) {
            deck.push(
                createCard({
                    color,
                    type: CARD_TYPES.SKIP
                })
            );
        }


        /*
            2× Změna směru.
        */

        for (
            let index = 0;
            index < 2;
            index += 1
        ) {
            deck.push(
                createCard({
                    color,
                    type: CARD_TYPES.REVERSE
                })
            );
        }


        /*
            2× +2.
        */

        for (
            let index = 0;
            index < 2;
            index += 1
        ) {
            deck.push(
                createCard({
                    color,
                    type: CARD_TYPES.DRAW_TWO
                })
            );
        }
    });


    /*
        4× Změna barvy.
    */

    for (
        let index = 0;
        index < 4;
        index += 1
    ) {
        deck.push(
            createCard({
                color: CARD_COLORS.WILD,
                type: CARD_TYPES.WILD
            })
        );
    }


    /*
        4× +4.
    */

    for (
        let index = 0;
        index < 4;
        index += 1
    ) {
        deck.push(
            createCard({
                color: CARD_COLORS.WILD,
                type: CARD_TYPES.WILD_DRAW_FOUR
            })
        );
    }


    return deck;
}


/* =========================================================
   MÍCHÁNÍ BALÍČKU
========================================================= */

function shuffleDeck(cards) {
    const shuffled =
        [...cards];


    for (
        let index = shuffled.length - 1;
        index > 0;
        index -= 1
    ) {
        const randomIndex =
            Math.floor(
                Math.random() *
                (index + 1)
            );


        [
            shuffled[index],
            shuffled[randomIndex]
        ] = [
            shuffled[randomIndex],
            shuffled[index]
        ];
    }


    return shuffled;
}


/* =========================================================
   ZOBRAZENÁ HODNOTA KARTY
========================================================= */

function getCardDisplayValue(card) {
    if (!card) {
        return "";
    }


    if (
        card.type === CARD_TYPES.NUMBER
    ) {
        return String(
            card.value
        );
    }


    return (
        CARD_DISPLAY[card.type] ||
        ""
    );
}


/* =========================================================
   ČESKÝ POPIS KARTY

   Nepoužívá se přímo na kartě.
   Hodí se pro status, debug, accessibility apod.
========================================================= */

function getCardDescription(card) {
    if (!card) {
        return "";
    }


    const color =
        CARD_COLOR_LABELS[card.color] ||
        "";


    switch (card.type) {

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


        default:
            return "Karta";
    }
}


/* =========================================================
   IDENTICKÉ KARTY PRO KUŘ!

   Identické znamená:
   - stejná barva
   - stejný typ
   - stejné číslo u číselných karet
========================================================= */

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
        cardA.color !==
        cardB.color
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
   NAJDI IDENTICKÉ KARTY V RUCE
========================================================= */

function findIdenticalCards(
    hand,
    referenceCard
) {
    if (
        !Array.isArray(hand) ||
        !referenceCard
    ) {
        return [];
    }


    return hand.filter(
        (card) =>
            areCardsIdentical(
                card,
                referenceCard
            )
    );
}


/* =========================================================
   JE TO KUŘ?
========================================================= */

function isKurSelection(cards) {
    if (
        !GAME_CONFIG.kur.enabled ||
        !Array.isArray(cards)
    ) {
        return false;
    }


    if (
        cards.length <
        GAME_CONFIG.kur.minimumCards
    ) {
        return false;
    }


    const reference =
        cards[0];


    return cards.every(
        (card) =>
            areCardsIdentical(
                reference,
                card
            )
    );
}


/* =========================================================
   HODNOTA DOBÍRACÍ PENALIZACE KARTY
========================================================= */

function getDrawPenaltyValue(card) {
    if (!card) {
        return 0;
    }


    if (
        card.type ===
        CARD_TYPES.DRAW_TWO
    ) {
        return 2;
    }


    if (
        card.type ===
        CARD_TYPES.WILD_DRAW_FOUR
    ) {
        return 4;
    }


    return 0;
}


/* =========================================================
   SOUČET PENALIZACE PŘI KUŘ!
========================================================= */

function getDrawPenaltyForCards(cards) {
    if (!Array.isArray(cards)) {
        return 0;
    }


    return cards.reduce(
        (total, card) =>
            total +
            getDrawPenaltyValue(card),
        0
    );
}


/* =========================================================
   JE KARTA DIVOKÁ?
========================================================= */

function isWildCard(card) {
    if (!card) {
        return false;
    }


    return (
        card.type ===
            CARD_TYPES.WILD ||

        card.type ===
            CARD_TYPES.WILD_DRAW_FOUR
    );
}


/* =========================================================
   JE KARTA +2?
========================================================= */

function isDrawTwo(card) {
    return (
        card?.type ===
        CARD_TYPES.DRAW_TWO
    );
}


/* =========================================================
   JE KARTA +4?
========================================================= */

function isDrawFour(card) {
    return (
        card?.type ===
        CARD_TYPES.WILD_DRAW_FOUR
    );
}


/* =========================================================
   JE KARTA STŮJ?
========================================================= */

function isSkipCard(card) {
    return (
        card?.type ===
        CARD_TYPES.SKIP
    );
}


/* =========================================================
   JE KARTA NULA?
========================================================= */

function isZeroCard(card) {
    return (
        card?.type ===
            CARD_TYPES.NUMBER &&

        card.value === 0
    );
}


/* =========================================================
   JE KARTA SEDMIČKA?
========================================================= */

function isSevenCard(card) {
    return (
        card?.type ===
            CARD_TYPES.NUMBER &&

        card.value === 7
    );
}


/* =========================================================
   ZÁKLADNÍ HRATELNOST KARTY

   Toto řeší pouze běžný stav bez aktivního
   +2 / +4 / Stůj řetězce.

   Domácí pravidla pro stackování budou v game.js.
========================================================= */

function isCardNormallyPlayable(
    card,
    topCard,
    currentColor
) {
    if (
        !card ||
        !topCard
    ) {
        return false;
    }


    /*
        Divoké karty lze vždy.
    */

    if (
        isWildCard(card)
    ) {
        return true;
    }


    /*
        +2 se v běžném tahu řídí stejnými pravidly
        jako ostatní barevné akční karty:
        - lze ji zahrát na stejnou aktuální barvu
        - nebo na jinou +2

        Na obyčejnou dvojku jiné barvy zahrát nejde.
    */


    /*
        +4 lze vždy.
    */

    if (
        card.type ===
        CARD_TYPES.WILD_DRAW_FOUR &&
        GAME_CONFIG.drawStacking
            .drawFourAlwaysPlayable
    ) {
        return true;
    }


    /*
        Shodná aktuální barva.
    */

    if (
        card.color ===
        currentColor
    ) {
        return true;
    }


    /*
        Stejné číslo.
    */

    if (
        card.type ===
            CARD_TYPES.NUMBER &&

        topCard.type ===
            CARD_TYPES.NUMBER &&

        card.value ===
            topCard.value
    ) {
        return true;
    }


    /*
        Stejný akční symbol.

        Např. modrý Stůj na červený Stůj.
    */

    if (
        card.type !==
            CARD_TYPES.NUMBER &&

        card.type ===
            topCard.type
    ) {
        return true;
    }


    return false;
}


/* =========================================================
   VALIDACE VÝBĚRU PRO KUŘ!

   Pokud je vybráno více karet, musí být všechny identické.
========================================================= */

function isValidCardSelection(cards) {
    if (
        !Array.isArray(cards) ||
        cards.length === 0
    ) {
        return false;
    }


    if (
        cards.length === 1
    ) {
        return true;
    }


    return isKurSelection(cards);
}


/* =========================================================
   JE VÝBĚR +2?
========================================================= */

function isDrawTwoSelection(cards) {
    return (
        Array.isArray(cards) &&
        cards.length > 0 &&
        cards.every(
            (card) =>
                isDrawTwo(card)
        )
    );
}


/* =========================================================
   JE VÝBĚR +4?
========================================================= */

function isDrawFourSelection(cards) {
    return (
        Array.isArray(cards) &&
        cards.length > 0 &&
        cards.every(
            (card) =>
                isDrawFour(card)
        )
    );
}


/* =========================================================
   MŮŽE VÝBĚR PŘEHODIT AKTUÁLNÍ PENALIZACI?

   Důležité:
   Celková nasčítaná penalizace a hodnota, kterou je potřeba
   aktuálně přehodit, jsou dvě různé věci.

   Přehazuje se přesně hodnota POSLEDNÍHO zahraného stacku.
========================================================= */

function canCounterDrawStack(
    selectedCards,
    requiredCounterAmount
) {
    if (
        !Array.isArray(selectedCards) ||
        selectedCards.length === 0
    ) {
        return false;
    }


    if (
        !isValidCardSelection(
            selectedCards
        )
    ) {
        return false;
    }


    const selectedPenalty =
        getDrawPenaltyForCards(
            selectedCards
        );


    if (
        !Number.isFinite(
            requiredCounterAmount
        ) ||
        requiredCounterAmount <= 0
    ) {
        return false;
    }


    /*
        Přehazuje se vždy přesně hodnota POSLEDNÍHO stacku.

        Příklady:
        +2                 -> musí přijít +2
        +4                 -> musí přijít +4
        2× +2 přes Kuř!    -> poslední stack je +4
        3× +2 přes Kuř!    -> poslední stack je +6
        2× +4 přes Kuř!    -> poslední stack je +8

        Celková nasčítaná penalizace se řeší zvlášť v game.js
        a může být libovolně vysoká.
    */

    return (
        selectedPenalty ===
        requiredCounterAmount
    );
}

/* =========================================================
   STŮJ ŘETĚZEC
========================================================= */

function canCounterSkip(
    selectedCards
) {
    if (
        !GAME_CONFIG.skip
            .canCounterSkip
    ) {
        return false;
    }


    if (
        !Array.isArray(selectedCards) ||
        selectedCards.length === 0
    ) {
        return false;
    }


    /*
        Jedna nebo více identických Stůj.

        Více karet přes Kuř! se z hlediska
        efektu počítá pořád jako jeden Stůj.
    */

    return (
        isValidCardSelection(
            selectedCards
        ) &&
        selectedCards.every(
            (card) =>
                isSkipCard(card)
        )
    );
}


/* =========================================================
   URČENÍ EFEKTIVNÍHO TYPU VÝBĚRU

   Hodí se pro game.js.
========================================================= */

function getSelectionType(cards) {
    if (
        !Array.isArray(cards) ||
        cards.length === 0
    ) {
        return null;
    }


    const firstCard =
        cards[0];


    if (
        !isValidCardSelection(
            cards
        )
    ) {
        return null;
    }


    return firstCard.type;
}


/* =========================================================
   URČENÍ HODNOTY SPECIÁLNÍHO EFEKTU
========================================================= */

function getSelectionEffect(cards) {
    if (
        !Array.isArray(cards) ||
        cards.length === 0
    ) {
        return {
            type: null,
            amount: 0,
            isKur: false
        };
    }


    const type =
        getSelectionType(cards);


    return {
        type,

        /*
            Jen +2 / +4 se při Kuř! sčítají.
        */
        amount:
            type === CARD_TYPES.DRAW_TWO ||
            type === CARD_TYPES.WILD_DRAW_FOUR
                ? getDrawPenaltyForCards(
                    cards
                )
                : 0,

        isKur:
            isKurSelection(cards)
    };
}


/* =========================================================
   ŘAZENÍ KARET V RUCE
========================================================= */

function sortHand(cards) {
    return [...cards].sort(
        compareCards
    );
}


function compareCards(
    cardA,
    cardB
) {
    const colorA =
        COLOR_SORT_INDEX.has(
            cardA.color
        )
            ? COLOR_SORT_INDEX.get(
                cardA.color
            )
            : 999;


    const colorB =
        COLOR_SORT_INDEX.has(
            cardB.color
        )
            ? COLOR_SORT_INDEX.get(
                cardB.color
            )
            : 999;


    /*
        Nejdřív podle barvy.
    */

    if (
        colorA !== colorB
    ) {
        return (
            colorA -
            colorB
        );
    }


    /*
        U stejné barvy podle priority typu.
    */

    const typeDifference =
        getCardTypeSortIndex(
            cardA
        ) -
        getCardTypeSortIndex(
            cardB
        );


    if (
        typeDifference !== 0
    ) {
        return typeDifference;
    }


    /*
        U čísel podle čísla.
    */

    if (
        cardA.type ===
            CARD_TYPES.NUMBER &&
        cardB.type ===
            CARD_TYPES.NUMBER
    ) {
        return (
            cardA.value -
            cardB.value
        );
    }


    return 0;
}


/* =========================================================
   PRIORITA TYPU PŘI ŘAZENÍ
========================================================= */

function getCardTypeSortIndex(card) {
    switch (card.type) {

        case CARD_TYPES.NUMBER:
            return 0;


        case CARD_TYPES.SKIP:
            return 1;


        case CARD_TYPES.REVERSE:
            return 2;


        case CARD_TYPES.DRAW_TWO:
            return 3;


        case CARD_TYPES.WILD:
            return 4;


        case CARD_TYPES.WILD_DRAW_FOUR:
            return 5;


        default:
            return 99;
    }
}


/* =========================================================
   ODEBRÁNÍ KARET Z RUKY PODLE ID
========================================================= */

function removeCardsFromHand(
    hand,
    cardsToRemove
) {
    const ids =
        new Set(
            cardsToRemove.map(
                (card) =>
                    card.id
            )
        );


    return hand.filter(
        (card) =>
            !ids.has(
                card.id
            )
    );
}


/* =========================================================
   NAJDI KARTY PODLE ID
========================================================= */

function getCardsByIds(
    hand,
    cardIds
) {
    const ids =
        new Set(
            cardIds
        );


    return hand.filter(
        (card) =>
            ids.has(
                card.id
            )
    );
}


/* =========================================================
   KOPIE KARTY PRO SAVE

   Vrací pouze data potřebná k uložení.
========================================================= */

function serializeCard(card) {
    return {
        id: card.id,
        color: card.color,
        type: card.type,
        value: card.value
    };
}


/* =========================================================
   OBNOVENÍ KARTY ZE SAVE
========================================================= */

function deserializeCard(data) {
    if (!data) {
        return null;
    }


    return {
        id:
            String(
                data.id
            ),

        color:
            data.color,

        type:
            data.type,

        value:
            data.value ?? null,

        activeColor:
            null
    };
}
