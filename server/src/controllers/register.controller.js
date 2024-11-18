import { Router } from "express";
import bcrypt from "bcrypt";
import model from "../model.js";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.post('/registerAccount', requireAuth, async (req, res) => {
    // Want to check if registration is possible
    // and if-so create the account and store into database
    console.log(req.body.username);
    const user = model.findUserById(req.body.username);

    if (user !== undefined) {
        console.log('Username already taken.');
        res.sendStatus(403);
    } else if (!/\d/.test(req.body.password) || !/[a-zA-Z]/.test(req.body.password) || (req.body.password.length < 3)) {
        console.log('Password too short.');
        res.sendStatus(403);
    } else {
        console.log("Account is valid, creation will be complete.");
        const passwordHashed = await bcrypt.hash(req.body.password, 10);
        // model.createUser(req.body.username, req.body.username, req.body.password, 0, 0);

        const insertStatement = await db.prepare('INSERT INTO users (username, password, played, won) VALUES (?,?,?,?)');
        insertStatement.run(req.body.username, passwordHashed, 0, 0);
        console.log('Insertion to database complete.');
        model.createUser(req.body.username, req.body.username, passwordHashed, 0, 0);
        console.log("User added to dictionary.");
        res.sendStatus(200);
    }

});



export default { router };