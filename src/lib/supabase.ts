import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] 缺少環境變數！請在 .env 中設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY'
  )
}

// 使用 any 型別讓我們自行管理型別，不依賴 Supabase 自動產生的型別檔
export const supabase = createClient<any>(supabaseUrl, supabaseKey)
