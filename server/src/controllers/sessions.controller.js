import { Router } from "express";
import model from "../model.js";

const router = Router();

router.get('/init/server', (req, res) => {
    const { userId } = req.session;
    let temp = "";
    if (userId !== undefined) {
        temp = userId.slice(1);
        console.log("Split temp.");
        console.log(temp);
    } else {
        temp = undefined;
    }
    const user = model.findUserById(temp);
    res.status(200).json({ authenticated: user !== undefined });
});

router.get('/fetchGameSessions', (req, res) => {
    const sessions = model.getRooms();
    console.log("Game-Session entries: ");
    console.log(sessions);
    // model.join(socketID, 'lobby');

    res.status(200).json({ list: sessions });

});

export default { router };