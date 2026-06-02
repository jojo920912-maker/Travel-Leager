import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ── 啟動時自我診斷 ─────────────────────────────────────────────
if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] ❌ 缺少環境變數！請在 .env 設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY，然後重啟 npm run dev'
  )
} else if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  console.error(
    '[Supabase] ❌ .env 仍是範本佔位符，請填入真實的 Supabase URL 和 anon key，然後重啟 npm run dev'
  )
} else {
  console.info(`[Supabase] ✅ 已連線至 ${supabaseUrl.replace('https://', '').split('.')[0]}`)
}

// 使用 any 型別讓我們自行管理型別，不依賴 Supabase 自動產生的型別檔
export const supabase = createClient<any>(supabaseUrl, supabaseKey)
