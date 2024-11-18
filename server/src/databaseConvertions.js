// Functions that convert fetched information from database
// Functions that convert information into stored properties in database
// Mainly utilized to achieve persistent storage management

export function convertDeck(deck) {
    let deckString = "";
    deck.forEach((card) => {
        deckString += `${card.suit};${card.value},`;
    });
    return deckString;

}

export function convertIntoDeck(deck) {
    const tempList = deck.split(",");
    const newDeck = [];
    tempList.forEach((cardValue) => {
        const cardSplit = cardValue.split(";");
        const suit = cardSplit[0];
        const value = cardSplit[1];
        newDeck.push({
            suit,
            value,
            stringValue: value + suit
        });

    });

    return newDeck;

}

export function convertPlayerlist(playerList) {
    let playerString = "";
    playerList.forEach((player) => {
        playerString += `${player.name},`
    });
    return playerString;
}

export function convertBooleanValues(value) {
    let rvalue = false;
    if (value === 1) {
        rvalue = true;
    }
    return rvalue;
}
