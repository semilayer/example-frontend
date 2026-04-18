import { BeamClient } from '@semilayer/client'

/**
 * Single shared Beam client for the app. `main.tsx` hands it to
 * `<SemiLayerProvider>` so every hook in the tree reuses the same
 * connection (and the same WebSocket, when streaming kicks in).
 *
 * In a real project you'd run `semilayer generate` to produce a strongly
 * typed client (`beam.recipes.search(...)`) — but hooks work against the
 * untyped `BeamClient` too, and that keeps this example cloneable in
 * under two minutes.
 */
export const beam = new BeamClient({
  baseUrl: import.meta.env.VITE_SEMILAYER_URL ?? 'http://localhost:3001',
  apiKey: import.meta.env.VITE_SEMILAYER_KEY ?? '',
})

export const LENS = import.meta.env.VITE_SEMILAYER_LENS ?? 'recipes'
