/**
 * @class User
 */
class User {
  constructor(name, password, played, won) {
    this.username = name;
    this.password = password;
    this.played = played;
    this.won = won;
    this.winRate = ((this.won/this.played)*100);
    this.currentRoom = null;
  }

  /**
   * Join a specified room.
   * @param {Room} room - The room to join.
   * @returns {void}
   */
  joinRoom(room) {
    this.currentRoom = room;
  }
}

export default User;
