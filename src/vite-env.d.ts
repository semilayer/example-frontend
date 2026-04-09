/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEMILAYER_URL?: string
  readonly VITE_SEMILAYER_KEY?: string
  readonly VITE_SEMILAYER_LENS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
