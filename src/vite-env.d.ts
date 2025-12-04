/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // добавьте другие переменные окружения здесь
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

