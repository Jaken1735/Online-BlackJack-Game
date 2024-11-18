import {createStore} from "vuex";

export default createStore({
  state: {
    authenticated: false,
    username: "",
    sessions: [],
    target: "",
    inGame: false,
    gameSession: "",
    sessionExpired: false,
  },
  getters: {
    isAuthenticated(state) {
      return state.authenticated;
    },
    getUsername(state) {
      return state.username;
    },
    getSessions(state) {
      return state.sessions;
    }
  },
  mutations: {
    setAuthenticated(state, authenticated) {
      state.authenticated = authenticated;
    },
    setUsername(state, username) {
      state.username = username;
    },
    setSessions(state, sessions) {
      state.sessions = sessions;
    },
    setTarget(state, target) {
      state.target = target;
    },
    setInGame(state, inGame) {
      state.inGame = inGame;
    },
    setGameSession(state, gameSession) {
      state.gameSession = gameSession;
    },
  },
  actions: {},
  modules: {},
});
