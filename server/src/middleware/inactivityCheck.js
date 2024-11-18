import { Router } from "express";
import model from "../model.js";
import db from "../db.js";

const router = Router();
const timeOut = 20000;

router.post('/checkinactivity', async (req, res) => {
    let logOut = false;
    const {lastActivity} = req.body;
    const {user} = req.body;
    const {session} = req.body;
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastActivity;

    if (timeDiff > timeOut) {
        logOut = true
        // req.session.assistantId = undefined;
        const player = model.findUserById(user);
        const fetchedSession = model.findRoomByName(`_${session.name}`);

        console.log(player);
        console.log(fetchedSession);

        if (fetchedSession !== undefined) {
            console.log("____Logged out midGame____");
            let updateStatement = "";
            updateStatement = await db.prepare('UPDATE sessions SET players = ? WHERE roomName = ?');
            fetchedSession.numberOfPlayers -= 1
            updateStatement.run(fetchedSession.numberOfPlayers, fetchedSession.name);
            player.joinRoom(null);
        }

        res.clearCookie("InGame");
        req.session.destroy();
    }
    res.status(200).json({logOut});
});

export default { router };