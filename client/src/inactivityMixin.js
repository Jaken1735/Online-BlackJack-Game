export default {
    created() {
        this.setupInactivityTimer();
        this.setupEventListeners();
    },
    methods: {
        setupInactivityTimer() {
            this.lastActivity = new Date().getTime();
            setInterval(() => {
                if (this.$store.state.authenticated){
                    console.log(this.$store.state.authenticated)
                    this.checkInactivity();
                }
            }, 5000); // check every 5 seconds
        },
        setupEventListeners() {
            document.addEventListener('mousemove', this.resetActivityTimer);
            document.addEventListener('keypress', this.resetActivityTimer);
            document.addEventListener('click', this.resetActivityTimer);
        },
        resetActivityTimer() {
            this.lastActivity = new Date().getTime();
        },
        checkInactivity() {
            fetch('/api/checkinactivity', {
                method: "POST",
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify({ lastActivity: this.lastActivity, user: this.$store.state.username, session: this.$store.state.gameSession }),
            })
                .then(res => {
                    if (res.ok) {
                        return res.json();
                    }
                    throw new Error("User inactive");
                })
                .then(({ logOut }) => {
                    if (logOut) {
                        const currentTime = new Date().getTime();
                        console.log(`Current time:${  currentTime}`)
                        this.logout();
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        },
        logout() {
            this.socket = this.$root.socket;
            if (this.$store.state.inGame) {
                this.$store.state.inGame = false;
                this.$store.state.gameSession = "";
                this.socket.emit('leaveRoom');
            }
            const { push } = this.$router;
            this.$store.commit('setAuthenticated', false);
            this.$store.commit("setTarget", "/login");
            this.$store.state.sessionExpired = true;
            push("/login");
        },
    },
};