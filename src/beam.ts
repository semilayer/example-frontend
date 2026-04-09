import { BeamClient } from '@semilayer/client'

/**
 * Single shared Beam client for the app.
 *
 * In a real project you'd run `semilayer generate` to produce a strongly
 * typed client (`beam.recipes.search(...)`). To keep this example dependency-
 * free and cloneable in under two minutes, we use the untyped `BeamClient`
 * directly and read the lens name from an env var.
 */
export const beam = new BeamClient({
  baseUrl: import.meta.env.VITE_SEMILAYER_URL ?? 'http://localhost:3001',
  apiKey: import.meta.env.VITE_SEMILAYER_KEY ?? '',
})

export const LENS = import.meta.env.VITE_SEMILAYER_LENS ?? 'recipes'
