import { Router } from "express";
import model from "../model.js";

const router = Router();

/**
 * requireAuth is a middleware function that limit access to an endpoint to authenticated users.
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @returns {void}
 */
const requireAuth = (req, res, next) => {
  // Use an unique session identifier to access information about the user making the request
  const { id } = req.session;
  const user = model.findUserById(id);

  if (user === undefined) {
    // Choose the appropriate HTTP response status code and send an HTTP response, if any, back to the client
    res.status(401).end();
    return;
  }

  next();
};

router.get("/users/me", (req, res) => {
  const { id } = req.session;
  const user = model.findUserById(id);

  res.status(200).json({ authenticated: user !== undefined });
});

router.post("/login", (req, res) => {
  // Check how to access data being sent as a path, query, header and cookie parameter or in the HTTP request body
  const { username } = req.body;

  const { id } = req.session;

  // Create a new user with the given name and associate it with the currently active session
  model.createUser(id, username);
  req.session.save((err) => {
    if (err) console.error(err);
    else console.debug(`Saved user: ${JSON.stringify(model.findUserById(id))}`);
  });

  // FIXME Send HTTP response status code 200 OK only when the login was successful

  res.status(200).json({ authenticated: true });
});

export default { router, requireAuth };
