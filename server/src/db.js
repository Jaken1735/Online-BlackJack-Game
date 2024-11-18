import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { resolvePath } from "./util.js";

sqlite3.verbose();

const db = await open({
    filename: resolvePath("db.sqlite"),
    driver: sqlite3.Database,
});

await db.run("DROP TABLE IF EXISTS sessions");
// await db.run("DROP TABLE IF EXISTS users");
await db.run("DROP TABLE IF EXISTS game_states");
await db.run("DROP TABLE IF EXISTS activePlayer");

await db.run("CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(50), roomName VARCHAR(50), players INTEGER, player1 VARCHAR(50), player2 VARCHAR(50), player3 VARCHAR(50), player4 VARCHAR(50), PRIMARY KEY (roomName))");
await db.run("CREATE TABLE IF NOT EXISTS users (username VARCHAR(50), password VARCHAR(50), played INTEGER, won INTEGER, PRIMARY KEY (username))");

// LEVANDE RESURSER

await db.run(`CREATE TABLE IF NOT EXISTS game_states (room_name VARCHAR(50), deck TEXT, dealer_hand TEXT, players TEXT, active_player INTEGER, game_result TEXT, game_start INTEGER, show_new_game_button INTEGER, PRIMARY KEY (room_name))`);

await db.run(`CREATE TABLE IF NOT EXISTS activePlayer (room_name VARCHAR(50), player VARCHAR(50), hand TEXT, isWaiting INTEGER, checkBust INTEGER, PRIMARY KEY (player))`);


// const insertStatement3 = await db.prepare("INSERT INTO game_states (roomName, deck, dealer_hand, players, active_player, game_result, game_start, show_new_game_button) VALUES (?,?,?,?,?,?,?,?)");
const insertStatement = await db.prepare("INSERT INTO sessions (id, roomName, players) VALUES (?,?,?)");
const insertStatement2 = await db.prepare("INSERT INTO users (username, password, played, won) VALUES (?,?,?,?)");

insertStatement.run("_","BlackJack123",0);
insertStatement.run("_","BlackJackforBros",0);
// insertStatement2.run("Jaken1735", "Jag123", 9, 7);

insertStatement2.finalize();
insertStatement.finalize();
// insertStatement3.finalize();

export default db;