import betterLogging from "better-logging";
import express from "express";
import expressSession from "express-session";
import socketIOSession from "express-socket.io-session";
import {Server} from "socket.io";
import cookie from 'cookie';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import https from "https";
import * as path from "path";
import csp from 'helmet-csp';
import {resolvePath} from "./util.js";
import model from "./model.js";
import game from "./controllers/game.controller.js";
import sessions from "./controllers/sessions.controller.js";
import profile from "./controllers/profile.controller.js";
import register from "./controllers/register.controller.js";
import db from "./db.js";
import {getGameState, isBusted, newGame} from "./gameHub.js";
import {convertBooleanValues, convertDeck, convertIntoDeck, convertPlayerlist} from "./databaseConvertions.js";
import inactivityCheck from "./middleware/inactivityCheck.js";


const port = 8989;
const app = express();
// const server = createServer(app);
// const io = new Server(server);

// Setting up a https server

// const privateKey = fs.readFileSync('./certificates/keystore.p12', 'binary');

const filename = fileURLToPath(import.meta.url);
const dirName = dirname(filename);
const p12Path = path.join(dirName, 'certificates', 'keystore.p12');
const privateKey = fs.readFileSync(p12Path);
const passPhrase = 'rootroot';

const credentials = {
    pfx: privateKey,
    passphrase: passPhrase,
};

const httpsServer = https.createServer(credentials, app);
const io = new Server(httpsServer);
// const io2 = new Server(httpsServer);

// ________________________

const { Theme } = betterLogging;
betterLogging(console, {
  color: Theme.green,
});

// Enable debug output
console.logLevel = 4;

// Register a custom middleware for logging incoming requests
app.use(
  betterLogging.expressMiddleware(console, {
    ip: { show: true, color: Theme.green.base },
    method: { show: true, color: Theme.green.base },
    header: { show: false },
    path: { show: true },
    body: { show: true },
  })
);

// Configure session management
const sessionConf = expressSession({
  secret: "Super secret! Shh! Do not tell anyone...",
  resave: true,
  saveUninitialized: true,
});

app.use(sessionConf);
io.use(
  socketIOSession(sessionConf, {
    autoSave: true,
    saveUninitialized: true,
  })
);

// Serve static files
app.use(express.static(resolvePath("client", "dist")));

// Register middlewares that parse the body of the request, available under req.body property
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting up XSS security using csp-helmet

app.use(
    csp({
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'", "default.example"],
            scriptSrc: ["'self'", "js.example.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
        reportOnly: false,
    })
);

// Bind REST controllers to /api/*
// app.use("/api", inactivityCheck.router);
app.use("/api", register.router);
app.use("/api", game.router);
app.use("/api", sessions.router);
app.use("/api", profile.router);

// Initialize a model
model.init(io);

// Want to update the server with all the stored data in the database
// Want to add all the stored timeslots
await db.each("SELECT id, roomName, players FROM sessions", (err, row) => {
    if (err) { throw new Error(err); }
    const sessionName = `${row.id}${row.roomName}`;
    console.log(sessionName);
    model.createRoom(sessionName, row.roomName, row.players);
});
console.log("Added stored game-sessions!");

// Want to add all the stored assistants
await db.each("SELECT username, password, played, won FROM users", (err, row) => {
    if (err) { throw new Error(err); }
    model.createUser(row.username, row.username, row.password, row.played, row.won);
    console.log("Created User: ");
    console.log(`${row.username} ${row.played} ${row.won}`);
});
console.log("Added stored users!");

// Handle socket.io connections
io.on("connection", async (socket) => {
    const {session, headers} = socket.handshake;
    session.socketID = socket.id;
    const cookies = cookie.parse(headers.cookie || '');
    console.log('Cookies:', cookies);
    session.save((err) => {
        if (err) console.error(err);
        else console.debug(`Saved socketID: ${session.socketID}`);
    });

    console.log(session);

    console.log("Persistent Storage starts here: ");
    console.log(cookies.InGame);

    // Check if the user was in a gem
    const client = cookies.InGame;

    const database = await db.prepare(
    "SELECT room_name FROM activePlayer WHERE player = (?)"
    );
    const identifier = await database.get(client);
    console.log("The fetched player: ");
    console.log(identifier);

    if (identifier !== undefined) {

        const reebootgameState = getGameState(identifier.room_name);

        if (reebootgameState.players.length === 0) {
            // If there's an existing game state, emit an event to the client to resume the game
            console.log("Step 1 to restoring game.");
            console.log(identifier.room_name);
            const reebootDb = await db.prepare(
                "SELECT * FROM game_states WHERE room_name = (?)"
            );
            const fetchedState = await reebootDb.get(identifier.room_name);

            // Create gameState

            console.log("Step 2 to restoring game.");

            console.log(fetchedState);
            const playerNames = fetchedState.players.split(',').filter(name => name.length > 0);

            // const reebootgameState = getGameState(identifier.room_name);

            console.log("Players in the correct order");
            console.log(playerNames);

            // Now we want to start to fill in the fetched information which is stored in the different tables
            // Want to fetch the information from all the players in the disrupted session

            const fetchQuery = await db.prepare(
                `SELECT * FROM activePlayer WHERE player IN (${playerNames.map(name => `'${name}'`).join(', ')})`
            );
            const activePlayers = await fetchQuery.all();
            console.log(activePlayers);
            console.log("Step 3 to restoring game.");

            // Recreate the players and add to the rebootGamestate

            // activePlayers.forEach((active) => {
                // reebootgameState.players.push({
                    // name: active.player,
                    // hand: convertIntoDeck(active.hand),
                    // isWaiting: convertBooleanValues(active.isWaiting),
                    // checkBust: convertBooleanValues(active.checkBust)
                // });
            // });

            // Create a new sorted array of players based on the playerNames order// Recreate the players and add to the rebootGamestate
            reebootgameState.players = playerNames.map(name => {
                const player = activePlayers.find(active => active.player === name);
                return {
                    name: player.player,
                    hand: convertIntoDeck(player.hand),
                    isWaiting: convertBooleanValues(player.isWaiting),
                    checkBust: convertBooleanValues(player.checkBust)
                };
            });



            console.log("Converted Players: ");
            console.log(reebootgameState.players)

            // Recreate the rest of the gamestate

            const rbDeck = convertIntoDeck(fetchedState.deck);
            const rbDealerHand = convertIntoDeck(fetchedState.dealer_hand);
            reebootgameState.deck = rbDeck;
            reebootgameState.dealerHand = rbDealerHand;
            reebootgameState.activePlayer = fetchedState.active_player;
            if (fetchedState.game_result === null) {
                reebootgameState.gameResult = "";
            } else {
                reebootgameState.gameResult = fetchedState.game_result;
            }
            reebootgameState.gameStart = convertBooleanValues(fetchedState.game_start);
            reebootgameState.showNewGameButton = convertBooleanValues(fetchedState.show_new_game_button);

            // Removing the last object in the decks due to a typo occurring when converting

            reebootgameState.deck.pop();
            reebootgameState.dealerHand.pop();
            reebootgameState.players.forEach((player) => {
                player.hand.pop();
            });


            console.log("Step 4 and completion.");
            console.log("Reebooted GameState: ");
            console.log(reebootgameState);

            console.log("__________________");
            console.log(reebootgameState.dealerHand);
            console.log("__________________");
            console.log(reebootgameState.players);
            const resumeGame = "Server Error, you can now continue playing!";

            socket.join(identifier.room_name);
            session.socketUser = client;
            session.save((err) => {
                if (err) console.error(err);
                else console.debug(`Saved socketUser: ${client}`);
            });

            model.createRoom(`_${identifier.room_name}`, identifier.room_name, reebootgameState.players.length);
            io.in(identifier.room_name).emit('resumeGame', reebootgameState, resumeGame);

        } else { // When there are multiple connections disrupted by a server error

            console.log("MULTIPLE________MULTIPLE");
            const resumeGame = "Server Error, you can now continue playing!";
            socket.join(identifier.room_name);

            session.socketUser = client;
            session.save((err) => {
                if (err) console.error(err);
                else console.debug(`Saved socketUser: ${client}`);
            });
            io.in(identifier.room_name).emit('resumeGame', reebootgameState, resumeGame);

        }
    }

    socket.on('joinRoom', async ({room, playerName}) => {
        // Join the socket.io room
        socket.join(room);
        session.socketUser = playerName;
        session.save((err) => {
            if (err) console.error(err);
            else console.debug(`Saved socketUser: ${playerName}`);
        });

        // Get the specific game state for this room
        const gameState = getGameState(room);
        console.log("Create GameState: ");
        console.log(gameState);
        const isWaiting = gameState.gameStart;
        const checkBust = false;

        // Add the player to the player list
        gameState.players.push({name: playerName, hand: [], isWaiting, checkBust});

        if (gameState.gameStart === false) {
            // Emit the setActivePlayer event to all clients in the room
            io.in(room).emit('setActivePlayer', 0);

            // Start a new game when the gameSession has zero players when joining
            gameState.gameStart = true;
            newGame(room);

        }

        // CONVERTING INTO DATABASE VALUES

        const dbDeck = convertDeck(gameState.deck);
        const dbDealerHand = convertDeck(gameState.dealerHand);
        const dbPlayers = convertPlayerlist(gameState.players);
        const playerIndex = gameState.players.findIndex(player => player.name === playerName);
        const dbPlayerHand = convertDeck(gameState.players[playerIndex].hand);

        // DATABASE Manipulation

        const deleteGamestateNewGame1 = await db.prepare('DELETE FROM game_states WHERE room_name = ?');
        const updateGamestateNewGame1 = await db.prepare('INSERT INTO game_states (room_name, deck, dealer_hand, players, active_player, game_result, game_start, show_new_game_button) VALUES (?,?,?,?,?,?,?,?)');
        const updatePlayersNewGame1 = await db.prepare('INSERT INTO activePlayer (room_name, player, hand, isWaiting, checkBust) VALUES (?,?,?,?,?)');

        deleteGamestateNewGame1.run(room);

        updateGamestateNewGame1.run(room, dbDeck, dbDealerHand, dbPlayers, gameState.activePlayer, null, gameState.gameStart, gameState.showNewGameButton);
        updatePlayersNewGame1.run(room, playerName, dbPlayerHand, isWaiting, checkBust);

        io.emit('sessionsUpdated', model.getRooms());
        io.in(room).emit('updateGameState', gameState);
    });

    socket.on('newGame', async () => {

        const room = Array.from(socket.rooms)[1];
        console.log("New game call for: ");
        console.log(room);

        const gameState = getGameState(room);
        // Call the newGame function to reset the game state
        newGame(room);

        const convertedPlayerHands = [];

        gameState.players.forEach((player) => {
            const temp = player;
            temp.isWaiting = false;
            temp.checkBust = false;
            const conPhand = convertDeck(player.hand);
            convertedPlayerHands.push({ name: player.name, hand: conPhand });
        });

        gameState.showNewGameButton = false;
        io.to(room).emit('setActivePlayer', 0);

        // Emit the updateGameState event to all connected clients with the updated game state
        io.to(room).emit('updateGameState', gameState);

        const dbDeck = convertDeck(gameState.deck);
        const dbDealerHand = convertDeck(gameState.dealerHand);
        const dbPlayers = convertPlayerlist(gameState.players);

        const resetPlayers = await db.prepare(`UPDATE activePlayer SET
    hand = (CASE player ${convertedPlayerHands.map(player => `WHEN '${player.name}' THEN '${player.hand}'`).join(' ')} END),
    isWaiting = (CASE player ${gameState.players.map(player => `WHEN '${player.name}' THEN ${player.isWaiting ? 1 : 0}`).join(' ')} END),
    checkBust = (CASE player ${gameState.players.map(player => `WHEN '${player.name}' THEN ${player.checkBust ? 1 : 0}`).join(' ')} END)
WHERE player IN (${gameState.players.map(player => `'${player.name}'`).join(', ')})`);
        resetPlayers.run();

        const updateGameStateHit = await db.prepare('UPDATE game_states SET deck = ?, dealer_hand = ?, players = ?, active_player = ?, game_result = ?, game_start = ?, show_new_game_button = ? WHERE room_name = ?');
        updateGameStateHit.run(dbDeck, dbDealerHand, dbPlayers, gameState.activePlayer, gameState.gameResult, gameState.gameStart, gameState.showNewGameButton, room);


    });

    socket.on("hit", async () => {

        console.log(socket.rooms);
        const room = Array.from(socket.rooms)[1];
        console.log("Room: ");
        console.log(room);

        const gameState = getGameState(room);
        const {activePlayer, players} = gameState;
        console.log("ActivePlayer: ");
        console.log(activePlayer);
        if (activePlayer >= 0) {
            game.hit(room, activePlayer);
            io.to(room).emit("updateGameState", gameState); // Emit the event to the specific room


            // CONVERTING INTO DATABASE VALUES

            const dbDeck = convertDeck(gameState.deck);
            const dbDealerHand = convertDeck(gameState.dealerHand);
            const dbPlayers = convertPlayerlist(gameState.players);
            const player = gameState.players[activePlayer];
            const dbPlayerHand = convertDeck(player.hand);

            const updateGameStateHit = await db.prepare('UPDATE game_states SET deck = ?, dealer_hand = ?, players = ?, active_player = ?, game_result = ?, game_start = ?, show_new_game_button = ? WHERE room_name = ?');
            updateGameStateHit.run(dbDeck, dbDealerHand, dbPlayers, gameState.activePlayer, gameState.gameResult, gameState.gameStart, gameState.showNewGameButton, room);

            const updatePlayerStateHit = await db.prepare('UPDATE activePlayer SET hand = ?, isWaiting = ?, checkBust = ? WHERE player = ?');
            updatePlayerStateHit.run(dbPlayerHand, player.isWaiting, player.checkBust, player.name);


            try {
                if ((activePlayer === players.length - 1 && isBusted(room, activePlayer)) || (isBusted(room, activePlayer) && players[activePlayer + 1].isWaiting)) {
                    console.log("Time to let the dealer play after being busted!");

                    // Update the game state after the dealer's play
                    const updatedGameState = getGameState(room);
                    updatedGameState.showNewGameButton = true;
                    io.in(room).emit("updateGameState", updatedGameState);
                } else {
                    io.to(room).emit('setActivePlayer', gameState.activePlayer);
                }
                const dbDeck2 = convertDeck(gameState.deck);
                const dbDealerHand2 = convertDeck(gameState.dealerHand);
                const dbPlayers2 = convertPlayerlist(gameState.players);
                const dbPlayerHand2 = convertDeck(player.hand);

                const updateGameStateHit2 = await db.prepare('UPDATE game_states SET deck = ?, dealer_hand = ?, players = ?, active_player = ?, game_result = ?, game_start = ?, show_new_game_button = ? WHERE room_name = ?');
                updateGameStateHit2.run(dbDeck2, dbDealerHand2, dbPlayers2, gameState.activePlayer, gameState.gameResult, gameState.gameStart, gameState.showNewGameButton, room);

                const updatePlayerStateHit2 = await db.prepare('UPDATE activePlayer SET hand = ?, isWaiting = ?, checkBust = ? WHERE player = ?');
                updatePlayerStateHit2.run(dbPlayerHand2, player.isWaiting, player.checkBust, player.name);

            } catch (error) {
                if ((activePlayer === players.length - 1 && isBusted(room, activePlayer))) {
                    console.log("Time to let the dealer play after being busted!");

                    // Update the game state after the dealer's play
                    const updatedGameState = getGameState(room);
                    updatedGameState.showNewGameButton = true;
                    io.in(room).emit("updateGameState", updatedGameState);
                } else {
                    io.to(room).emit('setActivePlayer', gameState.activePlayer);

                }

                const dbDeck3 = convertDeck(gameState.deck);
                const dbDealerHand3 = convertDeck(gameState.dealerHand);
                const dbPlayers3 = convertPlayerlist(gameState.players);
                const dbPlayerHand3 = convertDeck(player.hand);

                const updateGameStateHit3 = await db.prepare('UPDATE game_states SET deck = ?, dealer_hand = ?, players = ?, active_player = ?, game_result = ?, game_start = ?, show_new_game_button = ? WHERE room_name = ?');
                updateGameStateHit3.run(dbDeck3, dbDealerHand3, dbPlayers3, gameState.activePlayer, gameState.gameResult, gameState.gameStart, gameState.showNewGameButton, room);

                const updatePlayerStateHit3 = await db.prepare('UPDATE activePlayer SET hand = ?, isWaiting = ?, checkBust = ? WHERE player = ?');
                updatePlayerStateHit3.run(dbPlayerHand3, player.isWaiting, player.checkBust, player.name);
            }

        }
    });

    socket.on("stand", async () => {
        // const room = Object.keys(socket.rooms)[1];

        const room = Array.from(socket.rooms)[1];
        const gameState = getGameState(room);
        console.log("GameState: ");
        console.log(gameState);
        const {activePlayer, players} = gameState;
        if (activePlayer >= 0) {
            game.stand(room, activePlayer);
            console.log("Current ActivePlayer: ");
            console.log(gameState.activePlayer);
            console.log(players[activePlayer]);

            try {
                if ((activePlayer === players.length - 1) || (players[activePlayer + 1].isWaiting)) {
                    // console.log("Time to let the dealer play after standi!");

                    // Update the game state after the dealer's play
                    const updatedGameState = getGameState(room);
                    updatedGameState.showNewGameButton = true;
                    io.in(room).emit("updateGameState", updatedGameState);
                } else {
                    io.to(room).emit('setActivePlayer', gameState.activePlayer);
                    io.to(room).emit("updateGameState", gameState);
                }

                // CONVERTING INTO DATABASE VALUES

                const dbDeck = convertDeck(gameState.deck);
                const dbDealerHand = convertDeck(gameState.dealerHand);
                const dbPlayers = convertPlayerlist(gameState.players);
                const player = gameState.players[activePlayer];
                const dbPlayerHand = convertDeck(player.hand);

                const updateGameStateHit = await db.prepare('UPDATE game_states SET deck = ?, dealer_hand = ?, players = ?, active_player = ?, game_result = ?, game_start = ?, show_new_game_button = ? WHERE room_name = ?');
                updateGameStateHit.run(dbDeck, dbDealerHand, dbPlayers, gameState.activePlayer, gameState.gameResult, gameState.gameStart, gameState.showNewGameButton, room);

                const updatePlayerStateHit = await db.prepare('UPDATE activePlayer SET hand = ?, isWaiting = ?, checkBust = ? WHERE player = ?');
                updatePlayerStateHit.run(dbPlayerHand, player.isWaiting, player.checkBust, player.name);


            } catch (error) {
                if (activePlayer === players.length - 1) {
                    // console.log("Time to let the dealer play after being busted!");

                    // Update the game state after the dealer's play
                    const updatedGameState = getGameState(room);
                    updatedGameState.showNewGameButton = true;
                    io.in(room).emit("updateGameState", updatedGameState);
                } else {
                    io.to(room).emit('setActivePlayer', gameState.activePlayer);
                    io.to(room).emit("updateGameState", gameState);
                }

                // CONVERTING INTO DATABASE VALUES

                const dbDeck = convertDeck(gameState.deck);
                const dbDealerHand = convertDeck(gameState.dealerHand);
                const dbPlayers = convertPlayerlist(gameState.players);
                const player = gameState.players[activePlayer];
                const dbPlayerHand = convertDeck(player.hand);

                const updateGameStateHit = await db.prepare('UPDATE game_states SET deck = ?, dealer_hand = ?, players = ?, active_player = ?, game_result = ?, game_start = ?, show_new_game_button = ? WHERE room_name = ?');
                updateGameStateHit.run(dbDeck, dbDealerHand, dbPlayers, gameState.activePlayer, gameState.gameResult, gameState.gameStart, gameState.showNewGameButton, room);

                const updatePlayerStateHit = await db.prepare('UPDATE activePlayer SET hand = ?, isWaiting = ?, checkBust = ? WHERE player = ?');
                updatePlayerStateHit.run(dbPlayerHand, player.isWaiting, player.checkBust, player.name);

            }
        }
    });

    socket.on("leaveRoom", async () => {
        const room = Array.from(socket.rooms)[1];
        const gameState = getGameState(room);

        console.log("A player is now leaving a game!!");
        console.log("Session: ");
        console.log(session);

        const {socketUser} = session;
        console.log("User that wants to leave room: ");
        console.log(socketUser);

        // Find the index of the player that is leaving
        const playerIndex = gameState.players.findIndex(player => player.name === socketUser);

        // Remove the player from the players array
        if (playerIndex !== -1) {
            gameState.players.splice(playerIndex, 1);
        }

        const deletePlayerState = await db.prepare('DELETE FROM activePlayer WHERE player = ?');
        deletePlayerState.run(socketUser);

        if (gameState.players.length >= 1 && gameState.players[0].isWaiting) {
            newGame(room);
            const convertedPlayerHands = [];

            gameState.players.forEach((player) => {
                const temp = player;
                temp.isWaiting = false;
                temp.checkBust = false;
                const conPhand = convertDeck(player.hand);
                convertedPlayerHands.push({ name: player.name, hand: conPhand });
            });


            gameState.showNewGameButton = false;
            io.to(room).emit('setActivePlayer', 0);

            // Emit the updateGameState event to all connected clients with the updated game state
            io.to(room).emit('updateGameState', gameState);

            const resetPlayers = await db.prepare(`UPDATE activePlayer SET
    hand = (CASE player ${convertedPlayerHands.map(player => `WHEN '${player.name}' THEN '${player.hand}'`).join(' ')} END),
    isWaiting = (CASE player ${gameState.players.map(player => `WHEN '${player.name}' THEN ${player.isWaiting ? 1 : 0}`).join(' ')} END),
    checkBust = (CASE player ${gameState.players.map(player => `WHEN '${player.name}' THEN ${player.checkBust ? 1 : 0}`).join(' ')} END)
WHERE player IN (${gameState.players.map(player => `'${player.name}'`).join(', ')})`);
            resetPlayers.run();

        } else {
            // If the leaving player was the active player, set the next player as the active player
            if (gameState.activePlayer === playerIndex) {
                gameState.activePlayer = gameState.activePlayer === gameState.players.length ? 0 : gameState.activePlayer;
            }

            // Update the game state for all clients in the room
            io.in(room).emit('updateGameState', gameState);

            // If there are no players left in the room, set gameStart to false
            if (gameState.players.length === 0) {
                gameState.gameStart = false;
            }

        }

        const dbDeck = convertDeck(gameState.deck);
        const dbDealerHand = convertDeck(gameState.dealerHand);
        const dbPlayers = convertPlayerlist(gameState.players);

        const updateGameStateHit = await db.prepare('UPDATE game_states SET deck = ?, dealer_hand = ?, players = ?, active_player = ?, game_result = ?, game_start = ?, show_new_game_button = ? WHERE room_name = ?');
        updateGameStateHit.run(dbDeck, dbDealerHand, dbPlayers, gameState.activePlayer, gameState.gameResult, gameState.gameStart, gameState.showNewGameButton, room);

        // Leave the socket.io room
        io.emit('sessionsUpdated', model.getRooms());
        socket.leave(room);
    });

    socket.on('newGameSlot', () => {
        io.emit('sessionsUpdated', model.getRooms());
    });

});

// server.listen(port, () => {
  // console.log(`Listening on http://localhost:${port}/`);
// });

httpsServer.listen(port, () => {
    console.log(`HTTPS server listening on https://localhost:${port}/`);
});
