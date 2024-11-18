<template>
    <div class="row">
        <div class="col"></div>
        <form class="col" @submit.prevent="authenticate()">
            <label for="msg" class="form-label h2">Log in</label>
            <!-- <div>
                <h2 class="text-center text-bg-danger">{{ msg }}</h2>
            </div> -->
            <div v-if="msg" class="alert alert-danger" role="alert">
                Bad credentials. Please try again.
                <button type="button" class="btn-close" @click="clearMsg"></button>
            </div>

            <!-- Add the session expired message box here -->
            <div v-if="$store.state.sessionExpired" class="alert alert-warning" role="alert">
                Your session has expired. Please log in again.
                <button type="button" class="btn-close" @click="clearSessionExpired"></button>
            </div>
            <div>
                <label for="username" class="form-label h6">Enter username here</label>
                <input
                        id="username"
                        v-model="username"
                        type="text"
                        class="form-control"
                        placeholder="username..."
                        required
                />
            </div>
            <!-- Same layout as username for password -->
            <div>
                <label for="password" class="form-label h6">Enter password here</label>
                <input
                        id="password"
                        v-model="password"
                        type="text"
                        class="form-control"
                        placeholder="password..."
                        required
                />
            </div>
            <button type="submit" class="btn btn-dark mt-4 float-end">OK</button>
        </form>
        <div class="col"></div>
    </div>
</template>

<script>
export default {
  name: "LoginView",
  components: {},
  data: () => ({
      username: "",
      password: "",
      msg: false,
  }),
  methods: {
    authenticate() { // Here we redirect the user to the Admin page if the login was successfully
      const {commit} = this.$store;
      const {push} = this.$router;
      if (!/\d/.test(this.username) || !/[a-zA-Z]/.test(this.username) || !/\d/.test(this.password) || !/[a-zA-Z]/.test(this.password)) {
        commit("setAuthenticated", false);
        this.msg = true;
      } else if ((this.password.length < 3) || (this.username.length < 3)) {
        commit("setAuthenticated", false);
        this.msg = true;
      } else {
        fetch('/api/authenticateLogin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username: this.username, password: this.password,}),
        }).then((res) => {
          if (res.ok) { return res; }
          commit("setAuthenticated", false);
          this.msg = true;
          push("/login");
          throw new Error();
        }).then(() => {
          commit("setAuthenticated", true);
          commit("setUsername", this.username);
          this.$store.state.sessionExpired = false;
          push("/profile");
        }).catch(console.error);
      }
    },
      clearSessionExpired() {
        this.$store.state.sessionExpired = false;
      },
      clearMsg() {
        this.msg = false;
      },
  },
};
</script>
