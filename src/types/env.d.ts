/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE: 'development' | 'production'
  readonly VITE_API_URL: string
  readonly VITE_API_URL_FALLBACKS: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_KEY: string
  readonly VITE_API_VERSION: string
  readonly VITE_DEMO_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_MODE__: string;
declare const __DEMO_MODE__: boolean;
