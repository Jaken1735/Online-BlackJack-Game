// Import card-related functions (createDeck, shuffle, dealCards, calculateScore)
import {createDeck, shuffle, dealCards, calculateScore} from './cardOperations.js';

// gameState object
const gameStates = {};

function getGameState(room) {
    if (!gameStates[room]) {
        gameStates[room] = {
            deck: [],
            dealerHand: [],
            players: [],
            activePlayer: 0,
            gameResult: "",
            gameStart: false,
            showNewGameButton: false,
        };
    }
    return gameStates[room];
}

// newGame function
function newGame(room) {
    const gameState = getGameState(room);
    gameState.deck = shuffle(createDeck());
    gameState.dealerHand = dealCards(gameState.deck, 2);
    // gameState.players.forEach((player) => {
        // player.hand = dealCards(gameState.deck, 2);
    // });
    // ESLint fix starts here
    gameState.players = gameState.players.map((player) => (
        {...player, hand: dealCards(gameState.deck, 2)}
    ));
    // ESLint fix ends here
    gameState.activePlayer = 0;
    gameState.gameResult = "";
}

function isBusted(room, playerIndex) {
    const gameState = getGameState(room);
    const playerHand = gameState.players[playerIndex].hand;
    console.log("Checking score to see if the player is busted: ");
    console.log(playerHand);
    const score = calculateScore(playerHand);
    return score > 21;
}

function dealerPlays(room) {
    const gameState = getGameState(room);
    const {dealerHand} = gameState;
    let dealerScore = calculateScore(dealerHand);

    console.log("Dealer plays: ");
    console.log(dealerHand);
    console.log(dealerScore);

    // The dealer should draw cards until their score is 17 or higher
    // console.log("Current State of game Deck: ");
    // console.log(gameState.deck);
    while (dealerScore < 17) {
        console.log("Next Card for Dealer: ");
        console.log(gameState.deck.pop());

        dealerHand.push(gameState.deck.pop());
        dealerScore = calculateScore(dealerHand); // Update dealerScore state

    }

    // Update the dealer's hand in the game state
    gameState.dealerHand = dealerHand;
}

export { getGameState, newGame, isBusted, dealerPlays };