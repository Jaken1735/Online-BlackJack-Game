import { Router } from "express";
import cookie from "cookie";
import model from "../model.js";
import db from "../db.js";
import {dealerPlays, getGameState, isBusted} from "../gameHub.js";
import {calculateScore} from "../cardOperations.js";

const router = Router();

async function determineResults(room) {
    const gameState = getGameState(room);
    const dealerScore = calculateScore(gameState.dealerHand);

    const playersPromises = gameState.players.map(async (player) => {
        const playerScore = calculateScore(player.hand);
        const user = model.findUserById(player.name);
        if (player.checkBust === false && player.isWaiting === false) {
            if (dealerScore > 21 || dealerScore < playerScore) {
                gameState.gameResult += `* ${player.name} wins over the dealer!\n`;
                user.won += 1;
                user.played += 1;
            } else if (dealerScore === playerScore) {
                gameState.gameResult += `* It is a draw between ${player.name} and the dealer!\n`;
                user.played += 1;
            } else {
                gameState.gameResult += `* The dealer wins over ${player.name}!\n`;
                user.played += 1;
            }
            // const updateStatement = await db.prepare('UPDATE users SET played = ?, won = ? WHERE username = ?');
            // updateStatement.run(user.played, user.won, player.name);

        }
        const updateStatement = await db.prepare('UPDATE users SET played = ?, won = ? WHERE username = ?');
        updateStatement.run(user.played, user.won, player.name);

    });

    await Promise.all(playersPromises);
}

function nextPlayerOrFinishTurn(room, playerIndex) {
    const gameState = getGameState(room);


    try {
        // Set the active player to the next player in the list or disable player actions if all players have played
        if (playerIndex < gameState.players.length - 1 && !(gameState.players[gameState.activePlayer+1].isWaiting)) {
            gameState.activePlayer = playerIndex + 1;
        } else {
            gameState.activePlayer = -1; // Disable player actions
            console.log("Time to let the dealer play and determine the results.");
            let skipDealerPlay = true;
            gameState.players.forEach((player) => {
                if (player.checkBust === false) {
                    skipDealerPlay = false;
                }
            });
            if (skipDealerPlay === false) {
                dealerPlays(room); // Make the dealer play after all players have played
                determineResults(room); // Calculate the game results for each player
            } else {
                determineResults(room); // Calculate the game results for each player
            }
        }

    } catch(error) {
        // Set the active player to the next player in the list or disable player actions if all players have played
        if (playerIndex < gameState.players.length - 1) {
            gameState.activePlayer = playerIndex + 1;
        } else {
            gameState.activePlayer = -1; // Disable player actions
            console.log("Time to let the dealer play and determine the results.");
            let skipDealerPlay = true;
            gameState.players.forEach((player) => {
                if (player.checkBust === false) {
                    skipDealerPlay = false;
                }
            });
            if (skipDealerPlay === false) {
                dealerPlays(room); // Make the dealer play after all players have played
                determineResults(room); // Calculate the game results for each player
            } else {
                determineResults(room); // Calculate the game results for each player
            }
        }
    }

}

function hit(room, playerIndex) {
    const gameState = getGameState(room);
    const player = gameState.players[playerIndex];
    console.log("This player is hitting: ");
    console.log(player);
    player.hand.push(gameState.deck.pop());

    if (isBusted(room, playerIndex)) {
        console.log('BUSTED!!!!');
        gameState.gameResult = `* ${player.name} busted!\n`;
        player.checkBust = true;
        nextPlayerOrFinishTurn(room, playerIndex);
    }
}

function stand(room, playerIndex) {
    // const gameState = getGameState(room);
    console.log('STANDING!!!');
    nextPlayerOrFinishTurn(room, playerIndex);
}

router.get('/playerList/:gameSession', (req, res) => {
    // Get the list of players in the game-session
    const {gameSession} = req.params;
    console.log("Fetched GameSession: ");
    console.log(gameSession);
    const game = model.findRoomByName(`_${gameSession}`);
    console.log("The Game Identified: ");
    console.log(game);
    console.log(game.name);
    res.status(200).json({ playerList: game.players })
});

router.post('/game/join', async (req, res) => {
    // Setting up connection with the game-session the user wants to join
    const {sessionToJoin} = req.body;

    // Finding the user which is trying to connect to the session
    const {userId} = req.session;
    const {socketUser} = req.session;
    // const {socketID} = req.session;


    if (userId !== undefined) {
        const user = model.findUserById(userId);

        // *** Security Check ***

        if (user === undefined) {
            console.log("Security Breach, throw error!");
            res.sendStatus(401).end();
        }

        // *** - ***

        const fetchedSession = model.findRoomByName(`_${sessionToJoin.name}`)
        fetchedSession.numberOfPlayers += 1

        const updateStatement = await db.prepare('UPDATE sessions SET players = ? WHERE roomName = ?');
        updateStatement.run(fetchedSession.numberOfPlayers, fetchedSession.name);


        // Want to join the correct game-session
        user.joinRoom(fetchedSession.name);
        res.cookie("InGame", user.username);
        console.log(req.session);

        res.sendStatus(200);


    } else if (socketUser !== undefined) {
        const user = model.findUserById(socketUser);

        // *** Security Check ***

        if (user === undefined) {
            console.log("Security Breach, throw error!");
            res.sendStatus(401).end();
        }

        // *** - ***

        const fetchedSession = model.findRoomByName(`_${sessionToJoin.name}`)
        fetchedSession.numberOfPlayers += 1

        const updateStatement = await db.prepare('UPDATE sessions SET players = ? WHERE roomName = ?');
        updateStatement.run(fetchedSession.numberOfPlayers, user.username, fetchedSession.name);

        // Want to join the correct game-session
        user.joinRoom(fetchedSession.name);
        res.cookie("InGame", user.username);

        res.sendStatus(200);
    } else {
        console.log("Session trying to join is undefined");
        res.sendStatus(403);
    }

});

router.post('/game/leave', async (req, res) => {
    const {sessionToLeave} = req.body;

    console.log("Headers: ");
    console.log(req.headers);

    const cookies = cookie.parse(req.headers.cookie || '');
    console.log('Cookies:', cookies);

    // Finding the user which is trying to connect to the session
    const {socketUser} = req.session;
    // const {socketID} = req.session;
    console.log("Session when leaving game room: ");
    console.log(req.session);
    let identification;

    if (socketUser === undefined) {
        identification = cookies.InGame;
        console.log("When there is no SocketUser: ");
        console.log(identification);
    } else {
        identification = socketUser;
    }


    try {

        const user = model.findUserById(identification);
        const fetchedSession = model.findRoomByName(`_${sessionToLeave.name}`)


        let updateStatement = "";
        updateStatement = await db.prepare('UPDATE sessions SET players = ? WHERE roomName = ?');
        fetchedSession.numberOfPlayers -= 1
        updateStatement.run(fetchedSession.numberOfPlayers, fetchedSession.name);

        user.joinRoom(null);

        res.clearCookie("InGame");
        req.session.userId = identification;
        req.session.save((err) => {
            if (err) console.error(err);
            else console.debug(`Saved user: ${JSON.stringify(req.session.userId)}`);
            console.log("New req session: ");
            console.log(req.session);
        });

        res.cookie("LoggedIn", identification);

        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(403);
    }

});


export default { router, hit, stand };