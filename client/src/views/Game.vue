<template>
  <div  class="container">
    <h1 class="text-center mb-4">Blackjack Game</h1>
    <h2 class="text-center mb-4">Room: {{$store.state.gameSession.name}}</h2>

    <!-- Dealer's hand -->
    <div class="row">
      <div class="col text-center">
        <h3>Dealer's Hand</h3>
        <div class="d-flex justify-content-center">
          <div v-for="card in dealerHand" :key="card.suit + card.value" class="card m-2">
            <img class="card-image" :src="'/assets/' + card.value.toLowerCase() + '_of_' + card.suit.toLowerCase() + '.svg'" :alt="card.value + ' of ' + card.suit">
          </div>
        </div>
      </div>
    </div>

    <!-- Player's hands -->
    <div class="row mt-4">
      <div v-for="(player, index) in players" :key="index" class="col text-center">
        <h3>{{ player.name }}'s Hand</h3>
        <div class="d-flex justify-content-center">
          <div v-for="card in player.hand" :key="card.suit + card.value" class="card m-2">
            <img class="card-image" :src="'/assets/' + card.value.toLowerCase() + '_of_' + card.suit.toLowerCase() + '.svg'" :alt="card.value + ' of ' + card.suit">
          </div>
        </div>
        <div v-if="activePlayer === index && !(player.isWaiting)">
          <button v-if="player.name === $store.state.username && showNewGameButton === false" type="submit" class="btn btn-primary m-2" @click="hit()">Hit</button>
          <button v-if="player.name === $store.state.username && showNewGameButton === false" type="submit" class="btn btn-warning m-2" @click="stand()">Stand</button>
        </div>
        <!-- If a game is under way, let the joined players wait until a new game has started -->
        <div v-if="player.isWaiting" class="text-muted">Waiting for the next game...</div>
      </div>
    </div>

    <!-- New game button -->
    <div v-if="showNewGameButton === true" class="row mt-4">
      <div class="col text-center">
        <button type="submit" class="btn btn-success m-2" @click="newGame()">New Game</button>
      </div>
    </div>

    <!-- Game result message -->
    <!-- <div class="row mt-4">
      <div class="col text-center">
        <h4 class="text-info" v-if="gameResult">{{ gameResult }}</h4>
      </div>
    </div> -->

    <!-- Game result message box -->
    <div v-if="gameResult" id="gameResultModal" class="modal" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Game Result</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="clearGameResult()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <!-- <p>{{ gameResult }}</p> -->
            <p v-for="(line, index) in gameResult.split('*')" :key="index">{{ line }}<br></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="clearGameResult()">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resume Game Box -->
    <div v-if="resumeGame" id="gameResultModal" class="modal" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Server Error</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="clearResumeGame()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>{{ resumeGame }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="clearResumeGame()">Close</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "GameView",
  components: {},
  data: () => ({
    socket: null,
    deck: [],
    dealerHand: [],
    players: [],
    activePlayer: 0,
    gameResult: "",
    cardImages: {},
    showNewGameButton: false,
    resumeGame: "",
  }),
  mounted() {
    this.socket = this.$root.socket;

    // Listen for 'updateGameState' event
    this.socket.on("updateGameState", (gameState) => {
      console.log("ClientSide GameState: ");
      console.log(gameState);
      this.dealerHand = gameState.dealerHand;
      this.players = gameState.players;
      // this.activePlayer = gameState.activePlayer;
      this.showNewGameButton = gameState.showNewGameButton;
      this.gameResult = gameState.gameResult;
      console.log("Displaying the GameResult: ");
      console.log(gameState.gameResult);
    });

    this.socket.on('setActivePlayer', (newActivePlayer) => {
      this.activePlayer = newActivePlayer;
    });

    this.socket.on("resumeGame", (gameState, resumeGame) => {
      this.loadGameState(gameState);
      this.resumeGame = resumeGame;
    });

    // Emit 'join' event to the server with the current username
    // this.socket.emit("join", this.$store.state.username);
    this.socket.emit("joinRoom", { room: this.$store.state.gameSession.name, playerName: this.$store.state.username });
  },
  methods: {
    hit() {
      console.log(`${this.$store.state.username} hitted`)
      this.socket.emit("hit");
    },
    stand() {
      console.log(`${this.$store.state.username} standed`)
      this.socket.emit("stand");
    },
    newGame() {
      console.log(`${this.$store.state.username} created a new game`)
      this.socket.emit("newGame");
    },
    clearGameResult() {
      this.gameResult = "";
    },
    loadGameState(gameState) {
      this.dealerHand = gameState.dealerHand;
      this.players = gameState.players;
      this.activePlayer = gameState.activePlayer;
      this.showNewGameButton = gameState.showNewGameButton;
      this.gameResult = gameState.gameResult;
    },
    clearResumeGame() {
      this.resumeGame = "";
    },
  },
};
</script>

<style scoped>
.card-image {
  width: 100px;
  height: auto;
}

.modal {
  display: block;
  background-color: rgba(0 0 0 / 50%);
}
</style>
