'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const CHANNEL_NAME = 'renovo-query-sync'

type SyncMessage = {
  type: 'invalidate'
  queryKeys: readonly (readonly unknown[])[]
}

let broadcastChannel: BroadcastChannel | null = null

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
  }
  return broadcastChannel
}

export function broadcastInvalidation(queryKeys: readonly (readonly unknown[])[]) {
  const channel = getChannel()
  if (!channel) return
  const message: SyncMessage = { type: 'invalidate', queryKeys }
  channel.postMessage(message)
}

export function useCrossTabSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = getChannel()
    if (!channel) return

    function handleMessage(event: MessageEvent) {
      const data = event.data as SyncMessage
      if (data?.type === 'invalidate' && Array.isArray(data.queryKeys)) {
        for (const key of data.queryKeys) {
          queryClient.invalidateQueries({ queryKey: key as unknown[] })
        }
      }
    }

    channel.addEventListener('message', handleMessage)
    return () => channel.removeEventListener('message', handleMessage)
  }, [queryClient])
}
