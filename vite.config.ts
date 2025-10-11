// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'

const base = process.env.BASE_PATH || '/'
const isPreview = process.env.IS_PREVIEW ? true : false

export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        {
          react: [
            'React',
            'useState',
            'useEffect',
            'useContext',
            'useReducer',
            'useCallback',
            'useMemo',
            'useRef',
            'useImperativeHandle',
            'useLayoutEffect',
            'useDebugValue',
            'useDeferredValue',
            'useId',
            'useInsertionEffect',
            'useSyncExternalStore',
            'useTransition',
            'startTransition',
            'lazy',
            'memo',
            'forwardRef',
            'createContext',
            'createElement',
            'cloneElement',
            'isValidElement',
          ],
        },
        {
          'react-router-dom': [
            'useNavigate',
            'useLocation',
            'useParams',
            'useSearchParams',
            'Link',
            'NavLink',
            'Navigate',
            'Outlet',
          ],
        },
        {
          'react-i18next': ['useTranslation', 'Trans'],
        },
      ],
      dts: true,
    }),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,              // 0.0.0.0 바인딩
    port: 3000,
    cors: true,
    // 🔐 여기 추가: 허용할 호스트들
    allowedHosts: [
      'skchyouth.kr',
      'www.skchyouth.kr',
      // 필요하면 퍼블릭 IP도 허용
      '43.200.61.18',
      // 로컬/도메인 변형 추가 가능
      'localhost',
    ],
  },
  // vite preview 사용 시에도 동일 정책 적용
  preview: {
    host: true,
    port: 3000,
    allowedHosts: [
      'skchyouth.kr',
      'www.skchyouth.kr',
      '43.200.61.18',
      'localhost',
    ],
  },
})
