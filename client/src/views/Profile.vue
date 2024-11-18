<template>
  <!-- Specified CSS layout which can be seen further down below -->
  <div class="container">
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <!-- Header which contains the user's name and a log out link -->
        <h1 class="text-center">PROFILE PAGE<br><span class="h4">Signed in as: {{ user.username }}</span></h1>
      </div>
    </div>

    <!-- Displaying user's game stats -->
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <h2 class="text-center">Game Stats</h2>
        <ul class="list-group">
          <li class="list-group-item">Games Played: {{ user.played }}</li>
          <li class="list-group-item">Games Won: {{ user.won }}</li>
          <li class="list-group-item">Win rate: {{ user.winRate }}%</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProfileView",
  components: {},
  data:() => ({ // Fetching and creating the necessary data
    user: "",
  }),
  created() {
    fetch('/api/profile/user')
        .then((res) => res.json())
        .then(({ fetchedUser }) => {
          console.log("Fetched User: ");
          console.log(fetchedUser.name);
          this.user = fetchedUser;
        }).catch(console.error);
  },
  methods: {
  }
}
</script>

<style>
.container {
  margin-top: 50px;
}
</style>