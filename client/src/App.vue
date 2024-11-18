<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark">
    <button
      class="navbar-toggler mx-2 mb-2"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div id="navbarNav" class="collapse navbar-collapse mx-2">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a v-if="$store.state.inGame === false" class="nav-link" href="#" @click="redirect('/lobby')">Game Lobby</a>
          <a v-if="$store.state.inGame === true" class="nav-link" href="#" @click="redirect('/lobby')">Return to Game Lobby</a>
        </li>
        <li v-if="$store.state.inGame === false" class="nav-item">
          <a v-if="$store.state.authenticated === false" class="nav-link" href="#" @click="redirect('/login')">Login</a>
          <a v-if="$store.state.authenticated === true" class="nav-link" href="#" @click="redirect('/profile')">Profile</a>
        </li>
        <li v-if="$store.state.inGame === false" class="nav-item">
          <a v-if="$store.state.authenticated === false" class="nav-link" href="#" @click="redirect('/register')">Register</a>
          <a v-if="$store.state.authenticated === true" class="nav-link" href="#" @click="redirect('/login')">Logout</a>
        </li>
      </ul>
    </div>
  </nav>
  <section class="container-fluid py-4">
    <router-view />
  </section>
</template>

<script>
// @ is an alias to /src
import "bootstrap";
import io from "socket.io-client";
// import inactivityMixin from "./inactivityMixin";

export default {
  name: "App",
  components: {},
  // mixins: [inactivityMixin],
  data: () => ({
    socket: io(/* socket.io options */).connect(),
  }),
  created() {
    const { commit } = this.$store;
    const { push } = this.$router;

    fetch("/api/init/server")
        .then((res) => res.json())
        .then(({ authenticated }) => {
          commit("setAuthenticated", authenticated);
          push(authenticated === true ? "/profile" : "/lobby");
        })
        .catch(console.error);
  },
  methods: {
    redirect(target) {
      if(target === "/login" && this.$store.state.authenticated === true) {
        this.$store.state.authenticated = false;
        fetch('/api/profileLogout', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify({logout: 'logout'})
        }).catch(console.error);
      } else if(target === '/lobby' && this.$store.state.inGame === true) {
        this.$store.state.inGame = false;
        fetch('/api/game/leave', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({ sessionToLeave: this.$store.state.gameSession })
        }).then((res) => {
            if(res.ok) { return res; }
            console.log("Unexpected error when leaving game.");
            throw new Error();
        }).then(() => {
            this.$store.state.gameSession = "";
            this.socket.emit("leaveRoom");
        }).catch(console.error);
      }
      this.$router.push(target);
    },
  },
};
</script>

<style>
@import url("bootstrap/dist/css/bootstrap.css");

html,
body {
  background-color: #C1C6C9; /* Crayon gray background color */
}

/* Customize the navbar color */
.navbar-dark.bg-dark {
  background-color: #fff !important; /* White navbar color */
  color: #000 !important; /* Black text color for the navbar */
}

/* Change the text color of navbar links */
.navbar-dark .navbar-nav .nav-link {
  color: #000; /* Black text color for the navbar links */
}
</style>
