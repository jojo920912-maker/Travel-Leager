# 旅途記帳

一個以旅行為核心的個人記帳 Web App，支援日常記帳、旅行分帳、月預算管理等功能。

**技術棧：** Vue 3 + TypeScript + Pinia + Supabase

---

## 功能總覽

| 模組 | 功能 |
|------|------|
| **記帳** | 新增 / 編輯 / 刪除日常支出，依分類、付款方式篩選 |
| **旅行** | 建立旅行、管理成員、旅行內分帳（支援多人分攤） |
| **預算** | 月預算設定，分別追蹤「日常」與「旅行」兩個面向的花費進度 |
| **帳號** | 本地帳號註冊 / 登入（密碼明文儲存，僅供開發示範） |

### 支出分類
餐飲、交通、住宿、購物、娛樂、醫療、其他

### 付款方式
現金、信用卡、金融卡、行動支付、轉帳、其他

---

## 測試帳號

可直接使用以下帳號登入體驗，無需自行註冊：

| 欄位 | 值 |
|------|-----|
| 帳號 | `test` |
| 密碼 | `test1234` |

帳號內已預載示範資料：

**旅行分帳：**
- **東京五日遊**（已完成）— 5 位成員（JoJo / Mimi / Alice / Joe / Kevin）、8 筆支出、含部分分攤與個人費用；月預算 ¥245,000，實際花費 ¥242,600（近超標）
- **京都賞楓之旅**（即將到來）— 4 位成員（Chloe / Ryan / Lily / David）、7 筆支出、含 1 人缺席的不等人數分攤；月預算 ¥110,000，實際花費 ¥102,900（94%）
- **沖繩海島度假**（計畫中）— 5 位成員（Emma / Liam / Sophia / Noah / Ava）、6 筆支出、含潛水課程3人分攤；月預算 ¥220,000，實際花費 ¥216,500（98%）

**日常月預算（2026年）：**
- **4 月**：月預算 NT$45,000（日常 NT$32,000 / 旅行 NT$13,000），日常已花 NT$25,840（81%）
- **5 月**：月預算 NT$52,000（日常 NT$38,000 / 旅行 NT$14,000），日常已花 NT$35,419（93%）
- **6 月**：月預算 NT$48,000（日常 NT$35,000 / 旅行 NT$13,000），日常已花 NT$14,499（41%，月中進度）

---

## 技術架構

```
Vue 3 (Composition API, <script setup>)
├── 狀態管理  Pinia（auth / expense / trip / budget）
├── 路由      Vue Router（含登入守衛）
├── UI        Lucide Vue（圖示）、自定義 CSS 變數主題
└── 後端      Supabase（PostgreSQL + REST API）
```

---

## 本地開發

### 1. 建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com) 建立新專案
2. 進入 **SQL Editor**，貼上 `supabase-schema.sql` 的內容並執行
3. 前往 **Project Settings → API** 複製 `URL` 與 `anon key`

### 2. 設定環境變數

複製範本並填入憑證：

```bash
cp .env.example .env
```

`.env` 內容：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 安裝依賴並啟動

```bash
npm install
npm run dev
```

瀏覽器開啟 [http://localhost:5173](http://localhost:5173)

---

## 資料庫結構

| 資料表 | 說明 |
|--------|------|
| `users` | 帳號（username / password / displayName） |
| `expenses` | 日常支出 |
| `trips` | 旅行 |
| `members` | 旅行成員 |
| `tripExpenses` | 旅行內支出（含分攤 `splitAmong[]`） |
| `budgets` | 月預算（含 `dailyBudget` / `tripBudget` / `categories` JSON） |

> 詳細欄位定義請參考 `supabase-schema.sql`

---

## 專案結構

```
src/
├── lib/
│   └── supabase.ts          # Supabase client
├── services/
│   └── api.ts               # 所有資料庫操作（6 個 API 模組）
├── stores/                  # Pinia stores
│   ├── auth.ts
│   ├── expense.ts
│   ├── trip.ts
│   └── budget.ts
├── views/                   # 頁面
│   ├── AuthView.vue
│   ├── ExpenseView.vue
│   ├── TripView.vue
│   ├── TripDetailView.vue
│   ├── BudgetView.vue
│   └── HomeView.vue
├── components/
│   ├── expense/             # ExpenseCard、ExpenseForm
│   ├── trip/                # TripCard、TripForm、TripExpenseForm、MemberManager、SplitSummary
│   └── ui/                  # BaseModal、AppToast
├── composables/
│   ├── useToast.ts
│   └── useKeyboard.ts
├── router/index.ts
└── types/index.ts           # 所有 TypeScript 型別與常數
```

---

## 注意事項

- **RLS 已停用**：目前資料庫關閉 Row Level Security，適合本地開發。正式部署前請在 Supabase 設定細粒度存取政策。
- **密碼未加密**：使用者密碼以明文儲存，正式環境請改用 Supabase Auth 或 bcrypt 雜湊。
- `.env` 已列入 `.gitignore`，請勿將真實憑證提交至版控。
