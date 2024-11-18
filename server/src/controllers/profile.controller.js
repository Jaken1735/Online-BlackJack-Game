import { Router } from "express";
import bcrypt from "bcrypt";
import cookie from "cookie";
import model from "../model.js";
import db from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get('/profile/user', (req, res) => {
    // Want to get the correct information for the logged-in user
    console.log("SESSION: ");
    console.log(req.session);
    const { userId, socketUser } = req.session;
    let user = "";

    const cookies = cookie.parse(req.headers.cookie || '');
    console.log('Cookies:', cookies);

    if (userId === undefined) {
        if (socketUser === undefined) {
            user = model.findUserById(cookies.LoggedIn);
        } else {
            user = model.findUserById(socketUser);
        }
    } else {
        user = model.findUserById(userId);
    }
    res.status(200).json({ fetchedUser: user });
});

router.post('/authenticateLogin', async (req, res) => {
    // Authenticate login
    console.log(req.body.username);
    const user = model.findUserById(req.body.username);

    if (user === undefined) {
        console.log('User not found.');
        res.sendStatus(403);
    }
    console.log(user);

    console.log("The users password: ");
    console.log(user.password);
    console.log("The fetched password: ");
    console.log(req.body.password);

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    console.log(passwordMatch);

    if (!/\d/.test(req.body.password) || !/[a-zA-Z]/.test(req.body.password) || (req.body.password.length < 3)) {
        console.log('Password too short.');
        res.sendStatus(403);
    } else if (!(passwordMatch)) {
        console.log("Faulty password.");
        res.sendStatus(403);
    } else {
        req.session.userId = `${req.body.username}`;
        req.session.save((err) => {
            if (err) console.error(err);
            else console.debug(`Saved user: ${JSON.stringify(req.session.userId)}`);
        });
        console.log("New req session: ");
        console.log(req.session);
        res.sendStatus(200);
    }

});

router.post('/profileLogout', (req, res) => {
    // Want to erase userId in cookie.
    req.session.destroy();
    console.log("New req session: ");
    console.log(req.session);
    res.clearCookie("LoggedIn");
    res.sendStatus(200);
});

router.post('/addGameSession', requireAuth, async (req, res) => {
    console.log(req.body.newSession);
    const {newSession} = req.body;
    console.log(`${newSession.name}`);

    const { userId } = req.session;
    const { socketUser } = req.session;

    const cookies = cookie.parse(req.headers.cookie || '');
    console.log('Cookies:', cookies);
    let user = "";

    if (userId === undefined) {
        if (socketUser === undefined) {
            user = model.findUserById(cookies.LoggedIn);
        } else {
            user = model.findUserById(socketUser);
        }
    } else {
        user = model.findUserById(userId);
    }
    

    if (model.findRoomByName(`_${newSession.name}`) !== undefined) { // Check if timeslot already exists
        console.log("GameRoom already exists!");
        res.sendStatus(403);
    } else if(user === undefined) { // Check if user is logged in
        console.log("Need to be logged in order to create a new Game-Session.");
        res.sendStatus(403);
    } else {
        console.log("New and valid Game-Session.");
        model.createRoom(`_${newSession.name}`, newSession.name, 0);
        const insertStatement = await db.prepare('INSERT INTO sessions (id, roomName, players) VALUES (?,?,?)');
        insertStatement.run('_', newSession.name, 0);
        console.log("Insertion to Database Complete!");
        // model.broadcast()
        res.sendStatus(200);
    }
});

export default { router };