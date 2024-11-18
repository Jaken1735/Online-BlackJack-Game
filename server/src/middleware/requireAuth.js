// Middelware

import model from "../model.js";

const requireAuth = (req, res, next) => {

    console.log("Require Authentication (Middelware).");
    console.log(req.path);


    try {
        console.log("Inside Authentication statement.");
        const {userId} = req.session;
        const {socketUser} = req.session;
        const user = model.findUserById(userId);
        const socUser = model.findUserById(socketUser);

        if (user === undefined) {
            if (socUser === undefined) {
                console.log("User not found in auth");
                res.status(401).end();
                return;
            }
            console.log("Authenticate passed!");
            next();
        }
        console.log("Authenticate passed!");
        next();
    } catch (error) {
        console.log("Error in auth");
        res.status(401).end();
    }
};

export default requireAuth;