# 🚀 Quick Start - Test Data Generator

## One-Time Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Service Key to .env
```env
SUPABASE_SERVICE_KEY=your_service_key_here
```

> Get from: Supabase Dashboard → Settings → API → `service_role` secret

## Running the Script

### Get Your User ID
Login to your app, then:
- **DevTools**: Application → Local Storage → `supabase.auth.token`
- **OR Supabase**: Dashboard → Authentication → Users

### Run Command
```bash
npm run generate-test-data YOUR_USER_ID
```

**Example:**
```bash
npm run generate-test-data a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## What Gets Generated

- ✅ **1000+ Transactions** (6 months of income & expenses)
- ✅ **6 Budgets** (monthly with category limits)
- ✅ **3-6 Savings Goals** (with progress)
- ✅ **4-8 Subscriptions** (Netflix, Spotify, etc.)
- ✅ **Gamification Profile** (XP, coins, badges)
- ✅ **User Settings** (configured)

## Expected Output

```text
🚀 Starting Test Data Generation
📌 User ID: a1b2...
📊 Generating transactions... ✅
💰 Generating budgets... ✅
🎯 Generating savings goals... ✅
🔄 Generating subscriptions... ✅
🎮 Generating gamification profile... ✅
⚙️  Updating user settings... ✅
🎉 Test Data Generation Complete!
```

## Verification

Login and check:
1. **Transactions** page → Should see 1000+ entries
2. **Budget** page → 6 monthly budgets
3. **Savings** page → 3-6 goals with progress
4. **Subscriptions** → 4-8 active subscriptions
5. **Gamification** → Level, coins, badges visible

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing credentials" | Add `SUPABASE_SERVICE_KEY` to `.env` |
| "User not found" | Verify user ID is correct |
| "RLS error" | Use Service Key, not anon key |
| Data not showing | Clear cache, refresh page |

## Need Help?

📖 **Full Documentation**: [`scripts/README-TEST-DATA.md`](./scripts/README-TEST-DATA.md)

---

**Time to generate**: ~30-60 seconds  
**Safe to re-run**: No (creates duplicates)
