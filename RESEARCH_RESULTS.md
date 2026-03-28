# Deep Sea Stories Research: Voice AI Game Architecture

## 1. Architecture Overview

Deep Sea Stories is a real-time voice AI game built by Software Mansion (Fishjam team) where a group of detectives solve a mystery by questioning an AI "Riddle Master" powered by Google Gemini. It showcases Fishjam's Selective Forwarding Unit (SFU) with AI agent integration.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Fastify + tRPC |
| **Frontend** | React + Vite + TypeScript |
| **Real-time comms** | Fishjam Cloud (WebRTC SFU) |
| **AI voice** | Google Gemini Live API (speech-to-speech) |
| **Audio format** | PCM16, 16kHz input / 24kHz output |
| **Monorepo** | Yarn workspaces |
| **Deployment** | Docker + nginx reverse proxy |

### Key Concept: The "Ghost Peer" Agent

The central architectural pattern is the **Fishjam Agent** -- a server-side "ghost peer" that joins the room like a normal participant but is controlled entirely by the backend. It:
1. **Receives** raw PCM audio from all human players in the room
2. **Forwards** that audio to the Gemini Live API via WebSocket
3. **Receives** Gemini's audio response
4. **Sends** it back to all players through Fishjam as an audio track

Players never know they're talking to a server-side bridge -- they just hear the AI as another "participant" in the room.

---

## 2. Audio Flow Diagram

```
                          FISHJAM CLOUD (SFU)
                    +--------------------------+
                    |                          |
  Player A ------->|  WebRTC Audio Tracks      |
  (browser mic)    |                          |
                    |    Selective Forwarding   |
  Player B ------->|    Unit routes audio      |
  (browser mic)    |    to subscribers         |
                    |                          |
  Player C ------->|                          |
  (browser mic)    +------+--------+----------+
                          |        ^
            Raw PCM 16kHz |        | PCM 24kHz
            (per-peer)    |        | (agent track)
                          v        |
                   +------+--------+------+
                   |   BACKEND SERVER      |
                   |                       |
                   |  Fishjam Agent        |
                   |  (ghost peer)         |
                   |    |                  |
                   |    v                  |
                   |  VAD Filter           |
                   |  (mutex lock)         |
                   |    |                  |
                   |    | One speaker      |
                   |    | at a time        |
                   |    v                  |
                   |  Base64 encode        |
                   |    |            ^     |
                   |    v            |     |
                   |  Gemini WS   Gemini   |
                   |  sendRealtime  audio  |
                   |  Input()    response  |
                   |    |            |     |
                   +----+------------+-----+
                        |            |
                        v            ^
                   +----+------------+-----+
                   |   GEMINI LIVE API      |
                   |   (WebSocket)          |
                   |                        |
                   |  Model: gemini-2.5-    |
                   |  flash-native-audio-   |
                   |  preview-12-2025       |
                   +------------------------+
```

---

## 3. Key Code Patterns

### 3.1 Creating the Fishjam Agent (Ghost Peer)

From the Fishjam SDK documentation and Deep Sea Stories pattern:

```typescript
import { FishjamClient } from '@fishjam-cloud/js-server-sdk';
import * as GeminiIntegration from '@fishjam-cloud/js-server-sdk/gemini';

const fishjamClient = new FishjamClient({
  fishjamId: process.env.FISHJAM_ID!,
  managementToken: process.env.FISHJAM_TOKEN!,
});

// Create the Gemini-compatible client
const genAi = GeminiIntegration.createClient({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Create an agent in the room
// subscribeMode: 'auto' means it receives ALL peer audio automatically
// output: audio format settings matching what Gemini expects (16kHz PCM16)
const { agent } = await fishjamClient.createAgent(room.id, {
  subscribeMode: 'auto',
  output: GeminiIntegration.geminiInputAudioSettings,
});

// Create an outgoing audio track for Gemini's responses (24kHz PCM16)
const agentTrack = agent.createTrack(GeminiIntegration.geminiOutputAudioSettings);
```

### 3.2 Bidirectional Audio Bridge (Agent <-> Gemini)

```typescript
import { Modality } from '@google/genai';

const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

const session = await genAi.live.connect({
  model: GEMINI_MODEL,
  config: { responseModalities: [Modality.AUDIO] },
  callbacks: {
    onmessage: (msg) => {
      // Forward Gemini audio -> Fishjam agent track -> all players
      if (msg.data) {
        const pcmData = Buffer.from(msg.data, 'base64');
        agent.sendData(agentTrack.id, pcmData);
      }
      // Handle user interruption (clear buffered audio)
      if (msg.serverContent?.interrupted) {
        console.log('Agent was interrupted by user.');
        agent.interruptTrack(agentTrack.id);
      }
    }
  }
});

// Forward player audio -> Gemini
agent.on('trackData', ({ data }) => {
  session.sendRealtimeInput({
    audio: {
      mimeType: GeminiIntegration.inputMimeType, // 'audio/pcm;rate=16000'
      data: Buffer.from(data).toString('base64'),
    }
  });
});
```

### 3.3 VAD (Voice Activity Detection) Floor Control

Deep Sea Stories uses a custom VAD filter with a **mutex lock** to handle multiple speakers:

```
Conceptual pseudocode (exact implementation from the repo):

class AudioStreamingOrchestrator {
  private activeSpeakerId: string | null = null;
  private lockTimeout: NodeJS.Timeout | null = null;

  onTrackData(peerId: string, audioChunk: Buffer) {
    const hasVoice = detectVoiceActivity(audioChunk); // uses node-vad

    if (this.activeSpeakerId === null && hasVoice) {
      // First speaker detected -- lock the floor
      this.activeSpeakerId = peerId;
    }

    if (this.activeSpeakerId === peerId) {
      // Only forward the active speaker's audio to Gemini
      this.forwardToGemini(audioChunk);

      if (!hasVoice) {
        // Speaker stopped -- release lock after brief silence
        this.lockTimeout = setTimeout(() => {
          this.activeSpeakerId = null;
        }, SILENCE_THRESHOLD_MS);
      } else {
        clearTimeout(this.lockTimeout);
      }
    }
    // All other speakers' audio is DROPPED silently
  }
}
```

Key points:
- Uses `node-vad` library for Voice Activity Detection
- Implements a **mutex lock** -- only one speaker at a time reaches Gemini
- First person to speak "wins" the floor
- Floor releases after a silence threshold
- Other speakers' audio is silently discarded
- This prevents Gemini from getting confused by overlapping audio

### 3.4 Agent Audio Format Specs

| Direction | Sample Rate | Encoding | Channels | MIME Type |
|-----------|------------|----------|----------|-----------|
| Players -> Agent -> Gemini | 16,000 Hz | PCM16 (16-bit signed int) | 1 (mono) | `audio/pcm;rate=16000` |
| Gemini -> Agent -> Players | 24,000 Hz | PCM16 (16-bit signed int) | 1 (mono) | `audio/pcm;rate=24000` |

### 3.5 Agent Lifecycle (from Fishjam docs)

Under the hood, the `@fishjam-cloud/js-server-sdk` agent:
1. **Created** via REST API: `POST /room/{roomId}/peer` with `type: "agent"`
2. **Connects** via WebSocket: `/socket/agent/websocket` using Protobuf messages
3. **Receives** audio as `AgentRequest.TrackData` protobuf messages
4. **Sends** audio by first creating a track (`AgentRequest.CreateTrack`), then streaming `AgentRequest.TrackData`
5. **Disconnects** by closing WebSocket; can reconnect with same token

---

## 4. Fishjam Agent Pattern in Detail

### How the AI "Peer" Joins the Room

The Fishjam Agent is NOT a browser peer. It's a server-side construct:

```
Browser Peer (Player):
  Browser -> getUserMedia() -> WebRTC -> Fishjam SFU

Agent Peer (AI):
  Backend server -> Fishjam SDK -> WebSocket (protobuf) -> Fishjam SFU
```

The agent appears as a regular peer in the room. Other peers see it in their peer list. Audio flows to/from it like any other participant, but it's actually the backend bridging to Gemini.

### Agent Configuration Options

```typescript
// Creating an agent with full options:
const agentOptions = {
  subscribeMode: 'auto',  // Automatically subscribe to all peer audio
  output: {
    audioFormat: 'pcm16',
    audioSampleRate: 16000,  // Match Gemini's input requirement
  }
};

const agentCallbacks = {
  onError: console.error,
  onClose: (code, reason) => console.log('Agent closed', code, reason),
};

const { agent } = await fishjamClient.createAgent(
  room.id,
  agentOptions,
  agentCallbacks
);
```

### Agent Events

| Event | Data | Description |
|-------|------|-------------|
| `trackData` | `{ track, peerId, data }` | Raw PCM audio bytes from a peer |
| `trackImage` | `{ contentType, data }` | Video frame capture (for vision) |

### Agent Methods

| Method | Description |
|--------|-------------|
| `agent.createTrack(codecParams)` | Create outgoing audio track |
| `agent.sendData(trackId, buffer)` | Send audio chunk to track |
| `agent.interruptTrack(trackId)` | Clear buffered audio (for interruptions) |
| `agent.captureImage(trackId)` | Capture a video frame (rate-limited 1fps) |
| `agent.disconnect()` | Close the agent connection |

---

## 5. Answers to Mafia-Specific Questions

### Q1: Can we create private audio channels for mafia night?

**Yes, with separate rooms.** Fishjam supports creating multiple rooms. For mafia night, you could:
- Create a **separate room** for mafia-only communication
- Move mafia players to that room temporarily
- Run a dedicated Gemini agent in that room
- Move players back for day phase

**Alternative (simpler):** Since our game already has the Game Master narrating night, we don't need private audio channels. The current approach of having Gemini handle night actions via text/function calls works. Players can just stay muted during night, and the Game Master addresses them individually.

**Important limitation:** Fishjam does NOT support per-peer selective audio routing within a single room for player-to-player audio. All peers in a room hear all other peers. Selective subscription only applies to agent-peer communication.

### Q2: Can we mute specific peers via API?

**Not directly from the server.** Fishjam does not expose a server-side "mute peer" API. Muting is a client-side operation:
- Client can stop sending audio (`track.enabled = false`)
- Client can choose not to play a received track

**For our game:** We already handle this correctly -- the client mutes the mic during night phase and when it's not the player's turn. The VAD mutex approach from Deep Sea Stories is an elegant server-side alternative: even if a player unmutes, their audio simply gets dropped by the VAD filter.

### Q3: Can we run multiple Gemini sessions?

**Yes.** The Fishjam SDK explicitly supports creating multiple agents in the same room:

```typescript
const { agent: agent1 } = await fishjamClient.createAgent(room.id, agentOptions, callbacks1);
const { agent: agent2 } = await fishjamClient.createAgent(room.id, agentOptions, callbacks2);
```

Each agent is billed as a normal peer. For Mafia, potential uses:
- One Gemini session for the Game Master narrator
- A second session for private mafia deliberation
- However, cost and latency increase with each session

### Q4: How reliable is transcription?

**The Deep Sea Stories approach uses Gemini's native speech-to-speech** -- no separate transcription step. The model hears raw audio and responds with raw audio. Transcription is available as a side-channel:
- `inputAudioTranscription: {}` -- transcribes what players say
- `outputAudioTranscription: {}` -- transcribes what Gemini says

Our current Mafia implementation already uses this correctly. Reliability depends on:
- Audio quality (echo cancellation, noise suppression)
- Single-speaker clarity (the VAD filter helps enormously)
- Gemini model capabilities

### Q5: How is audio mixing handled?

**There is NO mixing.** This is the key insight. Fishjam's SFU **selectively forwards** individual audio streams -- it does NOT mix them. Each peer's audio arrives at the agent as a separate `trackData` event with a `peerId` attached.

This enables the VAD mutex pattern: the backend can inspect each peer's audio independently and choose which one to forward to Gemini.

Deep Sea Stories evaluated three approaches:
1. **Server-side mixing** (all audio into one stream) -- degraded transcription quality
2. **Agent per client** (separate Gemini session per player) -- too expensive, chaotic
3. **VAD mutex filtering** (one speaker at a time) -- **winner**, used in production

### Q6: What's the latency?

The blog post mentions targeting "sub-second responsiveness." The pipeline adds:
- **Fishjam SFU hop**: ~50-100ms (WebRTC)
- **VAD processing**: ~10-20ms
- **Network to Gemini**: ~50-100ms
- **Gemini processing**: ~200-500ms (speech-to-speech is faster than S2T+LLM+TTS)
- **Return path**: ~100-200ms

**Total estimated: 400ms - 1 second** for first audio chunk. The streaming nature means subsequent chunks arrive with lower perceived latency.

Our current Mafia setup bypasses Fishjam for audio entirely (direct WebSocket to server), which should have similar or slightly lower latency for the audio path, but loses the WebRTC quality benefits (echo cancellation, jitter buffering, packet loss recovery).

---

## 6. Smelter / MediaPipe Findings

### Gesture Recognition Example

Fishjam has a separate example demonstrating real-time gesture recognition in videoconferencing using:

- **MediaPipe**: Hand landmark detection AI model, running in `VIDEO` mode with support for 2 hands
- **Smelter**: A Rust-based video compositing engine (now available as WASM for browser)
- **Fishjam**: WebRTC transport layer

**Architecture:**
```
Camera -> MediaPipe (Web Worker) -> Gesture Recognition -> React State
                                                            |
                                                            v
Camera -> Smelter (compositor) -> Modified Video -> Fishjam broadcast
```

**Key technical details:**
- MediaPipe runs in a **Web Worker** to avoid blocking the main thread
- Uses `requestVideoFrameCallback()` for frame capture
- Smelter accepts registered inputs/outputs with React component-based layouts
- The compositor can overlay effects triggered by detected gestures

**Relevance to Mafia:**
- Face detection / emotion analysis could run in the same Web Worker pattern
- Smelter could overlay visual effects (suspicion meters, role reveals)
- However, this is a nice-to-have, not critical path for the hackathon

---

## 7. Comparison: Deep Sea Stories vs Our Mafia Implementation

| Aspect | Deep Sea Stories | Our Mafia Game |
|--------|-----------------|----------------|
| **Audio transport** | Fishjam Agent (WebRTC SFU) | Direct WebSocket (raw PCM) |
| **Agent pattern** | Ghost peer via `createAgent()` | No agent -- manual WS bridge |
| **Audio to Gemini** | Via Fishjam SDK + GeminiIntegration | Direct WS to Gemini |
| **Audio from Gemini** | Agent track -> SFU -> all peers | WS binary -> client playback |
| **Multi-speaker** | VAD mutex (server-side) | No floor control |
| **Echo cancellation** | WebRTC built-in | Browser getUserMedia only |
| **Audio quality** | WebRTC jitter/loss handling | Raw PCM over WS (no recovery) |
| **Gemini SDK** | `@google/genai` via Fishjam integration | Raw WebSocket protocol |
| **Game state** | tRPC (type-safe RPC) | Custom WebSocket events |
| **Frontend** | Fishjam React SDK hooks | Custom React + Zustand |

---

## 8. Recommendations for Mafia Game

### CRITICAL: Adopt the Fishjam Agent Pattern

Our current audio architecture sends raw PCM over WebSocket, bypassing Fishjam entirely. This loses:
- WebRTC echo cancellation and noise suppression at the transport level
- Jitter buffering and packet loss recovery
- Per-peer audio separation (we mix everything client-side)
- The ability to do server-side VAD filtering

**Recommendation:** Switch to the Fishjam Agent pattern:

```typescript
// In FishjamService.ts or a new AgentService.ts:
import * as GeminiIntegration from '@fishjam-cloud/js-server-sdk/gemini';

async createGeminiAgent(roomId: string) {
  const { agent } = await this.client.createAgent(roomId, {
    subscribeMode: 'auto',
    output: GeminiIntegration.geminiInputAudioSettings,
  });

  const agentTrack = agent.createTrack(
    GeminiIntegration.geminiOutputAudioSettings
  );

  return { agent, agentTrack };
}
```

### HIGH PRIORITY: Implement VAD Floor Control

Without floor control, multiple players talking simultaneously creates gibberish for Gemini. The VAD mutex from Deep Sea Stories is the proven solution:

1. Install `node-vad` or similar VAD library
2. Create `AudioStreamingOrchestrator` class
3. Only forward the active speaker's audio
4. Release lock after silence threshold

### MEDIUM PRIORITY: Use the Fishjam Gemini Integration Package

Instead of our raw WebSocket implementation in `GeminiSession.ts`, use:
```typescript
import * as GeminiIntegration from '@fishjam-cloud/js-server-sdk/gemini';
const genAi = GeminiIntegration.createClient({ apiKey });
```
This handles base64 encoding/decoding, audio format matching, and interruption handling automatically.

### MEDIUM PRIORITY: Handle Interruptions

Deep Sea Stories properly handles when a player interrupts Gemini mid-speech:
```typescript
if (msg.serverContent?.interrupted) {
  agent.interruptTrack(agentTrack.id); // Clear buffered audio on SFU
}
```
Our current implementation does not handle this -- Gemini audio keeps playing even if interrupted.

### LOW PRIORITY: Adopt tRPC

Deep Sea Stories uses tRPC for type-safe backend communication. Our WebSocket event system works but lacks type safety for the RPC-like operations (creating rooms, adding peers). This is cosmetic for the hackathon.

### NOT NEEDED: Smelter/MediaPipe

While cool for visual effects, this is not in the critical path. Our face metrics feature already captures emotion data. The Smelter compositing could be a future enhancement for visual overlays.

---

## Source Code Structure Reference

### Deep Sea Stories Repository Layout
```
deep-sea-stories/
  packages/
    backend/
      src/
        agent/
          gemini/
            api.ts          # Gemini client wrapper
            session.ts      # Gemini session lifecycle
          api.ts            # Agent API layer
          session.ts        # Agent session management
        controllers/
          notifications.ts  # Push notifications
          peers.ts          # Peer management
          rooms.ts          # Room CRUD
          stories.ts        # Story/game content
          voice-agent.ts    # Voice agent controller
        domain/
          errors.ts         # Custom error types
        game/
          room.ts           # Game room logic
          session.ts        # Game session state
        prompts/
          client-tool-instructions.md
          instructions-template.md
          stories.json      # Story data
        service/
          audio-streaming-orchestrator.ts  # VAD + floor control
          notifier.ts       # Event notification
          room.ts           # Room service layer
        types/
          node-vad.d.ts     # VAD type declarations
        config.ts
        context.ts
        index.ts
        main.ts
        router.ts           # tRPC router
        schemas.ts
        trpc.ts
        types.ts
        utils.ts
    web/
      src/
        components/         # UI components
        contexts/           # React contexts
        hooks/              # Custom hooks (Fishjam, audio)
        views/              # Page views
        Layout.tsx
        main.tsx
    common/
      src/
        constants.ts        # Shared constants
        events.ts           # Event type definitions
        index.ts
        types.ts            # Shared TypeScript types
```

---

## Sources

- [Voice AI: How We Built a Multi-Speaker AI Agent using Gemini (Fishjam Blog)](https://fishjam.swmansion.com/blog/voice-ai-how-we-built-a-multi-speaker-ai-agent-using-gemini)
- [How Fishjam.io Built a Multi-Speaker AI Game using Gemini Live (DEV.to / Google AI)](https://dev.to/googleai/how-fishjamio-built-a-multi-speaker-ai-game-using-gemini-live-20md)
- [Gemini Live Integration Tutorial (Fishjam Docs)](https://fishjam.swmansion.com/docs/next/tutorials/gemini-live-integration)
- [Fishjam Agents Tutorial (Fishjam Docs)](https://fishjam.swmansion.com/docs/tutorials/agents)
- [Agent Internals (Fishjam Docs)](https://fishjam.swmansion.com/docs/explanation/agent-internals)
- [Backend Quick Start (Fishjam Docs)](https://fishjam.swmansion.com/docs/tutorials/backend-quick-start)
- [React/Web Quick Start (Fishjam Docs)](https://fishjam.swmansion.com/docs/tutorials/react-quick-start)
- [Real-Time Audio Transcription API (Fishjam Blog)](https://fishjam.swmansion.com/blog/real-time-audio-transcription-api-how-to-turn-speech-to-text-during-live-conferencing-f77e2ff3f4de)
- [Real-Time Gesture Recognition in Videoconferencing (Fishjam Blog)](https://fishjam.io/blog/real-time-gesture-recognition-in-videoconferencing-4711855a1a53)
- [Audio-only Conferences (Fishjam Docs)](https://fishjam.swmansion.com/docs/how-to/features/audio-only-calls)
- [Deep Sea Stories GitHub Repository](https://github.com/fishjam-cloud/examples/tree/main/deep-sea-stories)
- [Deep Sea Stories Live Demo](https://deepsea.fishjam.io/)
