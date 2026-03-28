# AI Mafia

AI-powered Mafia party game where **Gemini Live** acts as the Game Master with real-time voice.
Players see each other via **Fishjam** video. Built for the Software Mansion x Gemini Hackathon.

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Bun |
| Backend | Hono + native Bun WebSocket |
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand (client), in-memory (server) |
| Video | Fishjam Cloud (WebRTC) |
| AI Game Master | Gemini 2.5 Flash Native Audio (Live API) |
| Linting | Biome |
| Monorepo | Bun workspaces |

## Project Structure

```
mafia-ai/
├── apps/
│   ├── client/                  # React + Vite + Tailwind
│   │   └── src/
│   │       ├── components/      # VideoTile, RoleCard, VotePanel, PhaseOverlay
│   │       ├── hooks/           # useGameSocket (WebSocket connection)
│   │       ├── pages/           # Lobby, Room
│   │       └── store/           # Zustand game store
│   └── server/                  # Bun + Hono
│       └── src/
│           ├── fishjam/         # FishjamService (room/peer management)
│           ├── game/            # GameManager (roles, phases, voting, win conditions)
│           ├── gemini/          # GeminiSession (Live API WebSocket), prompts
│           └── ws/              # WebSocket event handler
├── packages/
│   └── types/                   # Shared TypeScript types (Player, GameState, Events)
├── biome.json                   # Biome linter/formatter config
└── package.json                 # Bun workspaces root
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- Fishjam Cloud account from [fishjam.io](https://fishjam.io)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd mafia-ai
bun install

# Configure environment
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env with your keys:
#   GEMINI_API_KEY=your_key
#   FISHJAM_URL=wss://<your-id>.fishjam.io
#   FISHJAM_MANAGEMENT_TOKEN=your_token
```

### Run

```bash
# Start both server and client
bun run dev

# Or separately:
bun run dev:server   # Server on http://localhost:3001
bun run dev:client   # Client on http://localhost:5173
```

### Verify

```bash
# Health check
curl http://localhost:3001/health

# Test Gemini connection (check server logs for audio response)
curl http://localhost:3001/test-gemini
```

## Game Rules

### Roles

| Role | Team | Night Action |
|------|------|-------------|
| **Mafia** | Mafia | Choose a player to eliminate |
| **Detective** | Civilians | Investigate one player to learn their role |
| **Doctor** | Civilians | Choose one player to protect from elimination |
| **Civilian** | Civilians | No night action |

### Role Distribution

- **Detective**: 1 (always)
- **Doctor**: 1 (always)
- **Mafia**: `floor(player_count / 4) + 1`
- **Civilian**: remaining players
- Minimum 4 players to start

### Game Flow

```
Lobby → Role Assignment → Night → Day → Voting → Night → ... → Game Over
```

1. **Lobby** — Players join the room, see each other via video. Host clicks "Start Game" when 4+ players are in.

2. **Role Assignment** — Each player privately receives their role. Nobody else sees it. Lasts 3 seconds.

3. **Night** — Gemini (Game Master) narrates "Night falls..."
   - Mafia picks a target to kill
   - Detective picks a target to investigate
   - Doctor picks a target to save
   - When all night actors submit, night resolves:
     - If doctor saved the mafia's target — nobody dies
     - Otherwise the target is eliminated

4. **Day** — Gemini announces who was eliminated (or that nobody died). Players discuss via voice who they suspect. Gemini facilitates discussion, calls out nervous behavior.

5. **Voting** — Each alive player votes to eliminate someone. Majority vote eliminates that player.

6. **Win Conditions** (checked after every elimination):
   - **Civilians win**: all mafia eliminated
   - **Mafia wins**: mafia count >= civilian count

### Gemini Game Master

Gemini Live connects via WebSocket on the server. It:
- Receives text commands about game state changes
- Responds with streaming PCM audio that gets broadcast to all players
- Has a dramatic, noir narrator personality
- Knows all roles (secret) and never reveals them
- Facilitates discussion, provokes quiet players, reacts to nervousness

## Architecture

### Communication Flow

```
Browser ←→ WebSocket ←→ Bun Server ←→ Gemini Live API
   ↕                        ↕
Fishjam Cloud          Fishjam Server SDK
(WebRTC video)         (room/peer mgmt)
```

### WebSocket Protocol

**Client → Server:**
- `join_room` — join/create a game room (name validated: 1-20 chars)
- `start_game` — host starts the game (requires 4+ players)
- `start_voting` — manually trigger voting phase during day
- `cast_vote` — vote to eliminate (validated: voting phase, alive target)
- `night_action` — submit night action (validated: night phase, correct role, alive target)

**Server → Client:**
- `room_joined` — confirm join with player ID, game state, and Fishjam token
- `game_started` — game is starting
- `role_assigned` — your private role (sent only to you)
- `phase_changed` — phase transition with updated public state
- `player_eliminated` — a player was eliminated (reveals their role)
- `investigation_result` — detective receives target's name and role (private)
- `vote_cast` — someone voted
- `vote_result` — voting resolved (handles ties randomly)
- `game_over` — game ended with winner
- `error` — validation error or server error

### Timeouts

All phases have automatic timeouts to prevent the game from hanging:

| Phase | Timeout | Behavior |
|-------|---------|----------|
| Night | 60s | Auto-resolves with submitted actions |
| Day | 60s | Auto-triggers voting phase |
| Voting | 30s | Auto-resolves with submitted votes |
| Role Reveal | 3s | Transitions to first night |

If a player disconnects mid-phase, their pending actions are cleared and the phase resolves with remaining players. If all players disconnect, the game is cleaned up.

### Validation

All client actions are validated server-side:
- **Night actions**: must be night phase, player must have a night role, target must be alive and not self
- **Votes**: must be voting phase, voter must be alive, target must be alive and not self
- **Player names**: trimmed, 1-20 characters
- **Vote ties**: resolved randomly among tied players

### Security

- Player roles are NEVER sent in public game state — alive players always appear as "civilian"
- Dead players' roles are revealed
- Gemini session lives on the server only, never exposed to clients
- One Gemini session per game room
- WebSocket reconnects automatically (up to 5 retries, 2s delay)
- Direct URL navigation to `/room/:id` redirects to lobby if no player name

## Scripts

```bash
bun run dev           # Start server + client
bun run dev:server    # Server only (port 3001)
bun run dev:client    # Client only (port 5173)
bun run lint          # Biome check
bun run format        # Biome format
```

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `GEMINI_API_KEY` | server `.env` | Google AI Studio API key |
| `FISHJAM_URL` | server `.env` | `wss://<id>.fishjam.io` |
| `FISHJAM_MANAGEMENT_TOKEN` | server `.env` | Fishjam management token |
| `PORT` | server `.env` | Server port (default: 3001) |
| `VITE_SERVER_WS_URL` | client `.env` | WebSocket URL (default: `ws://localhost:3001/ws`) |
| `VITE_FISHJAM_ID` | client `.env` | Fishjam ID (default: hardcoded) |
