# Online BlackJack Game

A multiplayer online Blackjack game built with a modern tech stack, featuring real-time gameplay, user authentication, and a responsive interface.

## 🃏 Features

- Multiplayer blackjack gameplay with standard rules
- Real-time game updates using WebSockets
- User registration and authentication
- Game rooms for multiple concurrent games
- Persistent user profiles and game statistics
- Responsive design works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- Vue.js 3 - Progressive JavaScript framework
- Vuex - State management
- Vue Router - Client-side routing
- Bootstrap 5 - UI components and styling
- Socket.io-client - Real-time communication

### Backend
- Node.js - JavaScript runtime
- Express - Web framework
- Socket.io - WebSocket library for real-time bidirectional communication
- SQLite - Database for persistent storage
- Bcrypt - Password hashing for security

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/Online-BlackJack-Game.git
   cd Online-BlackJack-Game
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run start
   ```

This will build the client-side code and start the server. The application will be available at `http://localhost:3000` (or the port specified in your environment).

## 🎮 How to Play

1. Register an account or log in
2. Join an existing game room or create a new one
3. Wait for players to join (minimum 1 player)
4. Take turns to hit (draw a card) or stand (end your turn)
5. The dealer plays last according to standard rules
6. Winners are determined by whoever is closest to 21 without going over

## 📝 Game Rules

- The goal is to have a hand value closer to 21 than the dealer without exceeding 21
- Number cards (2-10) are worth their face value
- Face cards (Jack, Queen, King) are worth 10 points
- Aces are worth 11 points, unless that would cause the hand to exceed 21, then they're worth 1 point
- Players take turns deciding to "hit" (draw another card) or "stand" (keep current hand)
- The dealer must hit until their hand is worth at least 17 points
- If a player's hand exceeds 21 points, they "bust" and lose automatically
- If the dealer busts, all players who didn't bust win
- If neither busts, the hand closest to 21 wins

## 📂 Project Structure

- `/client` - Front-end Vue.js application
- `/server` - Back-end Express server
- `/server/src/models` - Database models
- `/server/src/controllers` - Application logic

## 📄 License

This project is licensed under the ISC License.