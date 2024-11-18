import { Router } from "express";
import model from "../model.js";

const router = Router();

/**
 * API (see the route handlers below) should combine uniquely identifiable resources (paths)
 * with the appropriate HTTP request methods (GET, POST, PUT, DELETE and more) to manipulate them.
 *
 * GET     /rooms                       =>  get all rooms
 * GET     /rooms/{name}/messages       =>  get all messages in a room with the given name
 * POST    /rooms/{name}/messages       =>  create a new message in a room with the given name
 * PUT     /rooms/{name}/messages/{id}  =>  update a message with the given id in a room with the given name
 * DELETE  /rooms/{name}/messages/{id}  =>  delete a message with the given id in a room with the given name
 * etc.
 */

router.get("/rooms", (req, res) => {
  const rooms = model.getRooms();

  // Choose the appropriate HTTP response status code and send an HTTP response, if any, back to the client
  res.status(200).json({ rooms }); // same as { rooms: rooms }
});

router.get("/rooms/:name/messages", (req, res) => {
  // Check how to access data being sent as a path, query, header and cookie parameter or in the HTTP request body
  const { name } = req.params;
  const room = model.findRoomByName(name);

  // Use an unique session identifier to access information about the user making the request
  const { id, socketID } = req.session;
  const user = model.findUserById(id);

  // Check if a room with the given name exists
  if (room === undefined) {
    res.status(404).end();
    return;
  }

  // FIXME Check if the user making the request is authorized to request data

  // Join the specified room
  user.joinRoom(room);
  model.join(socketID, room);

  // Send a join message to all connected clients in the room
  room.addMessage(`${user.name} joined the room!`);
  model.broadcast(room, `${user.name} joined the room!`);

  res.status(200).json({ messages: room.messages });
});

router.post("/rooms/:name/messages", (req, res) => {
  const { name } = req.params;
  const { message } = req.body;
  const room = model.findRoomByName(name);

  const { id } = req.session;
  const user = model.findUserById(id);

  // FIXME Check if a room with the given name exists, if the user making the request is authorized to send a message in the room etc.

  // Send a custom message to all connected clients in the room
  room.addMessage(`${user.name}: ${message}`);
  model.broadcast(room, `${user.name}: ${message}`);

  res.status(200).end();
});

export default { router };
