# Mafia AI — Progress

_Based on CONVENTIONS.md. Nothing verified yet — test each step before checking off._

---

## Step 1 — Lobby

- ☐ Players join room (WebSocket `join_room`)
- ☐ `+ Add Voice Agent` button adds a voice agent to the Fishjam room
- ☐ `Start Game` button disabled until 4 players present
- ☐ Players can talk to each other in lobby (mic live)
- ☐ Timer: not shown
- ☐ Narrator: silent

---

## Step 2 — Role Assignment (`role_assignment`)

- ☐ Roles assigned: `Math.floor(n/4)` mafia, 1 detective, 1 doctor, rest civilian
- ☐ Each player receives their role privately
- ☐ Mic auto-muted on entry, auto-unmuted on exit
- ☐ Delay ~3s (dev) / ~5s (prod) before narrator begins
- ☐ Timer: not shown
- ☐ Narrator: silent

---

## Step 3 — Narrator speaks (transition → Night)

- ☐ `phase_changed` night → `isNarratorSpeaking = true` → timer FROZEN
- ☐ Narrator speaks: announces night, town falls asleep (2–3 sentences)
- ☐ `turnComplete` fires → `isNarratorSpeaking = false` → timer starts
- ☐ Safety fallback: timer unfreezes after 15s if `turnComplete` never fires
- ☐ Players cannot talk (mic muted or blocked)

---

## Step 4 — Night (`night`)

- ☐ Timer starts ONLY after narrator finishes (not on `phase_changed`)
- ☐ Timer duration: 45s dev / 90s prod
- ☐ NightPanel shows correct action per role (mafia: kill, detective: investigate, doctor: save, civilian: wait)
- ☐ No player can target themselves
- ☐ After selecting target: confirmation shown
- ☐ `checkAllNightActionsComplete()` resolves night early if all special roles acted
- ☐ Timer fallback: `resolveNight()` after 45s/90s if not all acted

---

## Step 5 — Night resolution + Narrator speaks (→ Day or Game Over)

- ☐ `resolveNight()` applies mafia kill (majority vote, random on tie)
- ☐ Doctor blocks kill if same target chosen
- ☐ Detective gets investigation result (even if target killed same turn)
- ☐ Win condition checked: mafia ≥ civilians → Game Over
- ☐ Narrator speaks AFTER resolution (knows the result)
- ☐ Timer FROZEN while narrator speaks
- ☐ If game continues: narrator announces kill or save (2–3 sentences) → Day
- ☐ If mafia wins: narrator announces → Game Over

---

## Step 6 — Day (`day`)

- ☐ Timer starts ONLY after narrator finishes
- ☐ Timer duration: 80s dev / 120s prod
- ☐ Players discuss freely (mic live)
- ☐ Narrator silent during discussion
- ☐ If silence > 5s: narrator drops a suspicion hint
- ☐ Timer expires → voting starts automatically

---

## Step 7 — Narrator speaks (transition → Voting)

- ☐ Timer FROZEN while narrator speaks
- ☐ Narrator announces voting, calls each player by name
- ☐ Players cannot talk (mic muted or blocked)
- ☐ `turnComplete` → timer starts

---

## Step 8 — Voting (`voting`)

- ☐ Timer starts ONLY after narrator finishes
- ☐ Timer duration: 40s dev / 60s prod
- ☐ Players vote by clicking a player tile
- ☐ Players can talk during voting
- ☐ All votes cast → `resolveVotes()` immediately
- ☐ Timer expires → `resolveVotes()` automatically
- ☐ Tie → random among tied players

---

## Step 9 — Elimination resolution + Narrator speaks (→ Night or Game Over)

- ☐ `resolveVotes()` eliminates player (or nobody if no votes)
- ☐ Win condition checked: mafia ≥ civilians OR all mafia dead
- ☐ Narrator speaks AFTER resolution
- ☐ Timer FROZEN while narrator speaks
- ☐ If game continues: narrator announces elimination + night intro → Night
- ☐ If game over: narrator announces → Game Over
- ☐ Eliminated player shown with gray tile in VideoGrid

---

## Step 10 — Game Over (`game_over`)

- ☐ Narrator announces winner dramatically
- ☐ Timer: not shown
- ☐ Narrator responds if players speak to them

---

## Audio / Tech invariants

- ☐ GameMaster bridge only forwards audio from human peers (whitelist)
- ☐ VoiceAgent bridge only forwards audio from human peers (whitelist)
- ☐ No 1008 Policy Violation during normal gameplay
- ☐ `turnComplete` fires reliably after each narrator speech
- ☐ Narrator never interrupted mid-sentence by a server timeout
