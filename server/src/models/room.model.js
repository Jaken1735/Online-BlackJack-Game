/**
 * @class Room
 */
class Room {
  constructor(name, num) {
    this.name = name;
    this.messages = [];
    // this.players = [player1, player2, player3, player4];
    this.numberOfPlayers = num;
  }

  /**
   * Add a message.
   * @param {String} message - The message to add.
   * @returns {void}
   */
  addMessage(message) {
    this.messages.push(message);
  }
}

export default Room;
