<template>
  <div class="row">
    <div class="col"></div>
    <form class="col" @submit.prevent="register()">
      <label for="msg" class="form-label h2">Create Account</label>
      <div>
        <h2 class="text-center text-bg-danger">{{ msg }}</h2>
        <h2 class="text-center text-bg-success">{{ msg2 }}</h2>
        <label for="username" class="form-label h6">Enter username here</label>
        <input
            id="username"
            v-model="username"
            type="text"
            class="form-control"
            placeholder="Username..."
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
            placeholder="Password..."
            required
        />
      </div>
      <!-- Same layout for confirmation of password -->
      <div>
        <label for="confirmPassword" class="form-label h6">Confirm password here</label>
        <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="text"
            class="form-control"
            placeholder="Confirm password..."
            required
        />
      </div>
      <button type="submit" class="btn btn-dark mt-4 float-end">Create Account</button>
    </form>
    <div class="col"></div>
  </div>
</template>

<script>
export default {
  name: "RegisterView",
  components: {},
  data: () => ({
    username: "",
    password: "",
    confirmPassword: "",
    msg: "",
    msg2: "",
  }),
  methods: {
    register() {
      const {push} = this.$router;
      if (this.password !== this.confirmPassword) {
        this.msg = "Passwords do not match, please try again!";
      } else if(!/\d/.test(this.username) || !/[a-zA-Z]/.test(this.username) || !/\d/.test(this.password) || !/[a-zA-Z]/.test(this.password)) {
        this.msg = "Bad credentials, please try again!";
      } else if((this.password.length < 3) || (this.username.length < 3)) {
        this.msg = "Bad credentials, please try again!";
      } else {
        fetch('/api/registerAccount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username: this.username, password: this.password,}),
        }).then((res) => {
          if (res.ok) { return res; }
          this.msg = "Bad credentials, please try again!"
          push("/register");
          throw new Error();
        }).then(() => {
          this.msg2 = "Success, your account has been created!";
          this.username = "";
          this.password = "";
          this.confirmPassword = "";
          push("/register");
        }).catch(console.error);
      }
    }
  },
}
</script>

<style>
.container {
  margin-top: 50px;
}
</style>