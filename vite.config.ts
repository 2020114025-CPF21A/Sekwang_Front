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
            'React','useState','useEffect','useContext','useReducer','useCallback','useMemo',
            'useRef','useImperativeHandle','useLayoutEffect','useDebugValue','useDeferredValue',
            'useId','useInsertionEffect','useSyncExternalStore','useTransition','startTransition',
            'lazy','memo','forwardRef','createContext','createElement','cloneElement','isValidElement',
          ],
        },
        {
          'react-router-dom': [
            'useNavigate','useLocation','useParams','useSearchParams','Link','NavLink','Navigate','Outlet',
          ],
        },
        { 'react-i18next': ['useTranslation','Trans'] },
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
    alias: { '@': resolve(__dirname, './src') },
  },
  server: {
    host: true,           // 0.0.0.0 바인딩
    port: 3000,
    strictPort: true,     // 3000 고정 실패 시 종료 (포트 튀는 것 방지)
    cors: true,
    // Vite가 생성하는 리소스 절대경로 기준(프록시 뒤에서 유용)
    origin: 'https://skchyouth.kr',
    // ALB(HTTPS) 뒤에서 HMR(WebSocket) 경로/포트 지정
    hmr: {
      host: 'skchyouth.kr',
      protocol: 'wss',
      clientPort: 443,
      // path: '/hmr', // 필요시 ALB 규칙에 맞춰 커스텀 가능
    },
    // 허용할 Host 화이트리스트
    allowedHosts: [
      'skchyouth.kr',
      'www.skchyouth.kr',
      '43.200.61.18',
      'localhost',
    ],
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: ['skchyouth.kr','www.skchyouth.kr','43.200.61.18','localhost'],
  },
})
