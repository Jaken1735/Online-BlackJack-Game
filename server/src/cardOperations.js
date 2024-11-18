// Stores all the required functions in order to manipulate the card-deck
// used in the black jack game

export function createDeck() {
    const suits = ['heart', 'diamond', 'club', 'spade'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];

    // for (const suit of suits) {
        // for (const value of values) {
            // deck.push({
                // suit,
                // value,
                // stringValue: value + suit
            // });
        // }
    // }

    // ESLint fix starts here

    suits.forEach((suit) => {
        values.forEach((value) => {
            deck.push({
                suit,
                value,
                stringValue: value + suit
            });
        });
    });

    // ESLint fix ends here

    return deck;
}

export function shuffle(inputDeck) {
    // ESLint fix starts here
    const deck = [...inputDeck];
    // ESLint fix ends here
    for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

export function dealCards(deck, numberOfCards) {
    return deck.splice(-numberOfCards).reverse();
}

export function calculateScore(hand) {
    let score = 0;
    let aces = 0;

    // for (const card of hand) {
        // const {value} = card;

        // if (value === 'A') {
            // aces += 1;
            // score += 11;
        // } else if (value === 'K' || value === 'Q' || value === 'J') {
            // score += 10;
        // } else {
            // score += parseInt(value, 10);
        // }
    // }

    // ESLint fix starts here

    hand.forEach(card => {
        const {value} = card;

        if (value === 'A') {
            aces += 1;
            score += 11;
        } else if (value === 'K' || value === 'Q' || value === 'J') {
            score += 10;
        } else {
            score += parseInt(value, 10);
        }
    });

    // ESLint fix ends here

    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }

    return score;
}