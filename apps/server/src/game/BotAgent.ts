import type { Role } from '@mafia-ai/types'

const log = (name: string, ...args: unknown[]) => console.log(`[Bot:${name}]`, ...args)

const PERSONALITIES: Record<string, { trait: string; style: string }> = {
  paranoid: {
    trait: 'extremely paranoid and suspicious of everyone',
    style: 'Speak nervously. Use short bursts. Question everything. "Wait... why did YOU say that? Something feels off..."',
  },
  analytical: {
    trait: 'calm, logical, and analytical',
    style: 'Speak measured and precise. Use deduction. "Based on the evidence, the probability points to..."',
  },
  dramatic: {
    trait: 'emotional, dramatic, and expressive',
    style: 'Speak with passion. Gasp. Exclaim. "Oh my GOD! I can\'t believe this is happening! We HAVE to do something!"',
  },
}

export class BotAgent {
  private name: string
  private role: Role
  private personality: { trait: string; style: string }
  private apiKey: string
  private memory: string[] = []

  constructor(name: string, role: Role, personalityKey: string, apiKey: string) {
    this.name = name
    this.role = role
    this.personality = PERSONALITIES[personalityKey] || PERSONALITIES.paranoid
    this.apiKey = apiKey
    log(name, `Created: ${role}, ${personalityKey}`)
  }

  addMemory(event: string) {
    this.memory.push(event)
    // Keep last 20 events
    if (this.memory.length > 20) this.memory.shift()
  }

  async generateResponse(context: string): Promise<string> {
    const prompt = this.buildPrompt(context)
    log(this.name, `Thinking about: "${context.slice(0, 80)}..."`)

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 100,
              temperature: 0.9,
            },
          }),
        }
      )

      const data = await res.json() as any
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const clean = text.trim().replace(/^["']|["']$/g, '')
      log(this.name, `Says: "${clean}"`)
      return clean
    } catch (err) {
      log(this.name, 'API error:', err)
      return `I... I don't know what to say right now.`
    }
  }

  async chooseTarget(alivePlayers: string[], context: string): Promise<string> {
    const prompt = `You are ${this.name} in a Mafia game. Your role is ${this.role}.
${this.personality.trait}

Game context: ${context}
Recent events: ${this.memory.slice(-5).join('. ')}

Alive players (choose one): ${alivePlayers.join(', ')}

Reply with ONLY a player name. Nothing else.`

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0.5 },
          }),
        }
      )

      const data = await res.json() as any
      const name = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
      // Find best match
      const match = alivePlayers.find((p) => name.toLowerCase().includes(p.toLowerCase()))
      log(this.name, `Chooses: ${match || alivePlayers[0]}`)
      return match || alivePlayers[0]
    } catch {
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
    }
  }

  private buildPrompt(context: string): string {
    const roleHint = this.role === 'mafia'
      ? 'You ARE mafia. Deflect suspicion subtly. Never admit it. Accuse others.'
      : 'You are innocent. Try to find the mafia. Be suspicious of others.'

    return `You are ${this.name}, a player in a Mafia party game.
Personality: ${this.personality.trait}
Speaking style: ${this.personality.style}
${roleHint}

Recent events: ${this.memory.slice(-5).join('. ')}
Current situation: ${context}

Respond in character as ${this.name}. 2-3 sentences max. Be natural, emotional, opinionated.
Do NOT mention game mechanics. Speak like a real person in a heated discussion.
Do NOT start with your name. Just speak directly.`
  }
}
