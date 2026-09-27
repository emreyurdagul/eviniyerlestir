# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Sunucu ve AI proxy

Üretimde `server/index.mjs` (bağımlılıksız Node 20) hem `dist/` içindeki SPA'yı servis eder hem de AI çağrılarını `POST /api/ai/v1/messages` üzerinden seçili sağlayıcıya iletir. İstemci tek bir (Anthropic Messages) biçimde konuşur; `server/providers.mjs` bunu sağlayıcının biçimine çevirir. API anahtarı tarayıcıya hiç gelmez.

| Ortam değişkeni | Varsayılan | Açıklama |
|---|---|---|
| `AI_PROVIDER` | `gemini` | `gemini`, `openai`, `anthropic`, `openrouter`, `deepseek`, `groq`, `ollama` |
| `AI_API_KEY` | — | Sağlayıcı anahtarı. Yoksa AI uç noktası 503 döner (`ollama` hariç). `anthropic` için `ANTHROPIC_API_KEY` de okunur |
| `AI_MODEL` | sağlayıcıya göre | Örn. `gemini-2.5-flash`, `gpt-4o-mini` |
| `AI_BASE_URL` | sağlayıcıya göre | OpenAI uyumlu uç nokta adresi |
| `AI_PRICE_IN_PER_M` / `AI_PRICE_OUT_PER_M` | sağlayıcıya göre | USD / 1M token, günlük bütçe hesabı için |
| `AI_RATE_PER_HOUR` | `20` | IP başı saatlik istek sınırı |
| `AI_DAILY_BUDGET_USD` | `1` | Günlük toplam harcama tavanı (UTC gününe göre) |
| `PORT` | `80` | Dinlenen port |

Fotoğraf analizi ve kroki okuma görsel destekli model ister (Gemini, OpenAI, Anthropic); `deepseek` ve `groq` varsayılanları yalnızca metin özelliklerinde çalışır.

Yerelde: `npm run build && PORT=8787 AI_API_KEY=... npm run serve` (anahtarsız deneme: `AI_PROVIDER=ollama`), geliştirirken ayrıca `npm run dev` (vite `/api`'yi 8787'ye yönlendirir).

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
