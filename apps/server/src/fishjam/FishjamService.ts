import { FishjamClient } from '@fishjam-cloud/js-server-sdk'

export class FishjamService {
  private client: FishjamClient

  constructor() {
    const fishjamId = process.env.FISHJAM_URL?.match(/\/\/([^.]+)/)?.[1]
    const managementToken = process.env.FISHJAM_MANAGEMENT_TOKEN

    if (!fishjamId || !managementToken) {
      throw new Error('FISHJAM_URL and FISHJAM_MANAGEMENT_TOKEN must be set')
    }

    this.client = new FishjamClient({
      fishjamId,
      managementToken,
    })
  }

  async createRoom(): Promise<string> {
    const room = await this.client.createRoom({
      roomType: 'conference',
      videoCodec: 'vp8',
    })
    console.log('Fishjam room created:', room.id)
    return room.id
  }

  async addPeer(roomId: string, metadata?: Record<string, unknown>): Promise<{ token: string; peerId: string }> {
    const { peer, peerToken } = await this.client.createPeer(roomId as any, {
      metadata,
    })
    console.log('Fishjam peer added:', peer.id)
    return { token: peerToken, peerId: peer.id }
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.client.deleteRoom(roomId as any)
  }

  async deletePeer(roomId: string, peerId: string): Promise<void> {
    await this.client.deletePeer(roomId as any, peerId as any)
  }
}
