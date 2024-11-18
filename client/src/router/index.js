import { createRouter, createWebHistory } from "vue-router";
import store from "../store";
import Profile from "../views/Profile.vue";
import Lobby from "../views/Lobby.vue";
import Register from "../views/Register.vue";
import Game from "../views/Game.vue";
import Login from "../views/Login.vue";

const routes = [
  {
    path: "/",
    redirect: "/lobby",
  },
  {
    path: "/profile",
    component: Profile,
  },
  {
    path: "/game",
    component: Game,
  },
  {
    path: "/lobby",
    component: Lobby,
  },
  {
    path: "/register",
    component: Register,
  },
  {
    path: "/login",
    component: Login,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Setup authentication guard.
router.beforeEach((to, from, next) => {
  if (store.state.authenticated || to.path !== "/profile" || to.path !== "/game") {
    console.log("Authenticated")
    next();
  } else {
    console.info("Unauthenticated user. Redirecting to lobby page.");
    next("/lobby");
  }
});

export default router;
