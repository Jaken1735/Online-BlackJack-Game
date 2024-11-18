<template>
  <div class="container">
    <h1 class="text-center">Black Jack Lobby</h1>
    <h3 class="text-center text-bg-warning">{{ msg }}</h3>

    <!-- Display current game sessions -->
    <table class="table table-striped">
      <thead>
      <tr>
        <th>Room Name</th>
        <th>Amount of players in game</th>
        <th>Join game</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="session in sessions" :key="session.id">
        <td>{{ session.name }}</td>
        <td>{{ session.numberOfPlayers }}/4</td>
        <td v-if="session.numberOfPlayers < 4"><button type="submit" class="btn btn-primary" @click="redirect('/game', session)">Join</button></td>
        <td v-if="session.numberOfPlayers >= 4" class="text-bg-warning">Game is full</td>
      </tr>
      </tbody>
    </table>

    <!-- Create new game session -->
    <div class="row justify-content-center">
      <div class="col-md-6">
        <form @submit.prevent="createNewGame()">
          <div class="mb-3">
            <label for="newGameName" class="form-label large-label">New Room Name</label>
            <input
                id="newGameName"
                v-model="newGame.name"
                type="text"
                class="form-control large-input"
                placeholder="Enter Room name here"
                required
            />
          </div>
          <button type="submit" class="btn btn-success">Create New Game Session</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LobbyView",
  components: {},
  data: () => ({
    msg: "",
    newGame: { name: '', numberOfPlayers: 0 },
    sessions: [],
  }),
  created() { // Fetching the list of all current Black Jack game-sessions
      fetch('/api/fetchGameSessions')
          .then((res) => res.json())
          .then(({ list }) => {
              console.log(list);
              this.sessions = [];
              this.sessions = list;
              console.log("Game-Sessions up for show");
              console.log(this.sessions);
          }).catch(console.error);

      // Set up a listener for the 'sessionsUpdated' event
      this.socket = this.$root.socket;
      this.socket.on('sessionsUpdated', (updatedSessions) => {
          this.sessions = updatedSessions;
      });

  },
  methods: {
    createNewGame() { // Adding a new game session, will only be available for those who are logged in
      fetch('/api/addGameSession', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          newSession: this.newGame,
        }),
      }).then((res) => {
        if(res.ok) { return res; }
        this.msg = "You need to be logged in to an account to create a new game.";
        throw new Error();
      }).then(() => {
        this.msg = "";
        console.log("New and Valid Game-Session: ");
        console.log(this.newGame);
        // this.sessions.push(this.newGame);
        this.newGame = { name: '', numberOfPlayers: 0 };
        this.$store.commit("setSessions", this.sessions);
        this.socket.emit("newGameSlot");
      }).catch(console.error);
    },
    redirect(target, session) {
      const { commit } = this.$store;
      const { push } = this.$router;

      fetch('/api/game/join', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToJoin: session,
        },),
      }).then((res) => {
        if(res.ok) { return res; }
        this.msg = "You need to be logged in to join a game!";
        throw new Error();
      }).then(() => {
        commit("setInGame", true);
        commit("setGameSession", session);
        push(target);
      }).catch(console.error);
    }
  },

};
</script>

<style>
.large-label {
  font-size: 24px;
  font-weight: bold;
}

.large-input {
  font-size: 18px;
  height: 48px;
}
</style>
