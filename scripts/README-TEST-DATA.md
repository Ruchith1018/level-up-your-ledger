# Test Data Generator - 6 Months of Data

This script generates 6 months of comprehensive test data for your expense tracking application, including transactions, budgets, savings goals, subscriptions, and gamification data.

## 📋 What Gets Generated

### 🔢 Transactions (1000+)
- **Income**: Monthly salary + random freelance income
- **Expenses**: 2-5 daily transactions across multiple categories
- Realistic amounts based on category
- Varied merchants and payment methods
- Covers 6 months of daily activity

### 💰 Budgets (6)
- One budget per month for 6 months
- Total monthly budget: ₹40,000 - ₹60,000
- Category-wise limits for all expense categories
- Random surplus actions (rollover/saved/ignored)

### 🎯 Savings Goals (3-6)
- Pre-defined goals: Emergency Fund, Vacation, Laptop, Car, Wedding, Investment
- Random progress (0-70% of target)
- Realistic target amounts
- Deadline dates in the future

### 🔄 Subscriptions (4-8)
- Popular services: Netflix, Amazon Prime, Spotify, YouTube Premium, etc.
- Monthly/Yearly billing cycles
- Realistic amounts
- 80% active subscriptions

### 🎮 Gamification Profile
- Level 5-15 with appropriate XP
- 500-5,000 coins
- 0-30 day streak
- Earned badges
- Activity history (50 entries)
- Claimed task records

### ⚙️ User Settings
- Currency: INR
- Locale: en-IN
- Onboarding completed
- Tutorial completed
- Random premium pack status

## 🚀 Setup & Installation

### Prerequisites
1. Node.js installed
2. Supabase project set up
3. Service key access

### Environment Variables
Add these to your `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

⚠️ **Important**: You need the **Service Key** (not anon key) for this script. Find it in:
- Supabase Dashboard → Settings → API → `service_role` key

### Install Dependencies
```bash
npm install tsx @supabase/supabase-js dayjs
```

## 📝 Usage

### Step 1: Get Your User ID
Login to your application and get your user ID from:
- Browser DevTools → Application → Local Storage → `supabase.auth.token`
- Or from Supabase Dashboard → Authentication → Users

### Step 2: Run the Script
```bash
npx tsx scripts/generate-test-data.ts <your-user-id>
```

**Example:**
```bash
npx tsx scripts/generate-test-data.ts a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Step 3: Verify Data
Login to your application and check:
- ✅ Transactions page shows 6 months of data
- ✅ Budget page shows monthly budgets
- ✅ Savings page shows goals with progress
- ✅ Subscriptions page shows active subscriptions
- ✅ Gamification shows level, XP, coins, and badges

## 📊 Sample Output

```
🚀 Starting Test Data Generation

📌 User ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

══════════════════════════════════════════════════

📊 Generating transactions...
  📝 Inserting 1247 transactions...
  ✅ Inserted batch 1 (100 transactions)
  ✅ Inserted batch 2 (100 transactions)
  ...
  ✅ Inserted batch 13 (47 transactions)
✅ Transactions generated successfully!

💰 Generating budgets...
  ✅ Inserted 6 budgets
✅ Budgets generated successfully!

🎯 Generating savings goals...
  ✅ Inserted 4 savings goals
✅ Savings goals generated successfully!

🔄 Generating subscriptions...
  ✅ Inserted 6 subscriptions
✅ Subscriptions generated successfully!

🎮 Generating gamification profile...
  ✅ Gamification profile created (Level 12, 2847 coins, 15 day streak)
✅ Gamification profile generated successfully!

⚙️  Updating user settings...
  ✅ User settings updated
✅ User settings updated successfully!

══════════════════════════════════════════════════

🎉 Test Data Generation Complete!

Summary:
  ✅ ~1000+ transactions (6 months)
  ✅ 6 monthly budgets
  ✅ 3-6 savings goals
  ✅ 4-8 subscriptions
  ✅ Gamification profile with progress
  ✅ User settings configured

💡 You can now login and test the application!
```

## 🔧 Customization

### Adjust Date Range
Modify the `MONTHS_OF_DATA` in the script:
```typescript
const startDate = dayjs().subtract(6, 'month'); // Change 6 to any number
```

### Modify Categories
Edit the `CATEGORIES` object:
```typescript
const CATEGORIES = {
  expense: ['Your', 'Custom', 'Categories'],
  income: ['Your', 'Income', 'Sources']
};
```

### Change Currency
Update in the script and database:
```typescript
currency: 'USD', // Change from 'INR'
```

### Adjust Transaction Volume
Modify daily transaction counts:
```typescript
const numExpenses = isWeekend ? randomInt(5, 10) : randomInt(3, 7); // Increase ranges
```

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
- Ensure `.env` file exists with both variables
- Check that `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set

### Error: "User not found"
- Verify the user ID is correct
- Check user exists in Supabase Authentication

### Error: "RLS policy violation"
- Ensure you're using the Service Key (not anon key)
- Check RLS policies allow inserts for the user

### Data Not Showing in App
- Clear browser cache and localStorage
- Refresh the page
- Check browser console for errors

## ⚠️ Important Notes

1. **Service Key Security**: Never commit `.env` file with service key to version control
2. **Data Deletion**: This script doesn't delete existing data. Clear manually if needed:
   ```sql
   DELETE FROM transactions WHERE user_id = 'your-user-id';
   DELETE FROM budgets WHERE user_id = 'your-user-id';
   -- Repeat for other tables
   ```
3. **Run Once**: Running multiple times will create duplicate data
4. **Performance**: Generating 1000+ transactions may take 30-60 seconds

## 📚 Data Structure

### Transaction Fields
- `id`: UUID
- `user_id`: UUID (your user)
- `type`: 'income' | 'expense'
- `amount`: Number
- `currency`: String ('INR')
- `category`: String
- `merchant`: String
- `payment_method`: String
- `date`: ISO Date String
- `notes`: String
- `created_at`: ISO DateTime

### Budget Fields
- `id`: UUID
- `user_id`: UUID
- `period`: 'monthly'
- `month`: 'YYYY-MM'
- `total`: Number
- `category_limits`: JSON Object
- `rollover`: Boolean
- `surplus_action`: 'rollover' | 'saved' | 'ignored'
- `created_at`: ISO DateTime

### Savings Goal Fields
- `id`: UUID
- `user_id`: UUID
- `name`: String
- `target_amount`: Number
- `current_amount`: Number
- `color`: Hex Color
- `icon`: Emoji
- `deadline`: ISO Date
- `is_completed`: Boolean
- `created_at`: ISO DateTime

### Subscription Fields
- `id`: UUID
- `user_id`: UUID
- `title`: String
- `amount`: Number
- `billing_date`: ISO Date
- `interval`: 'monthly' | 'yearly'
- `payment_method`: String
- `reminder_days_before`: Number
- `active`: Boolean
- `category`: String
- `created_at`: ISO DateTime

## 🎯 Next Steps

After generating test data:

1. **Test Dashboard**: Check if charts and analytics display correctly
2. **Test Filtering**: Try date range filters and category filters
3. **Test Export**: Export data to CSV/PDF
4. **Test Gamification**: Check if XP, coins, and badges display
5. **Test Budget Tracking**: Verify budget calculations are accurate
6. **Test Subscriptions**: Check upcoming payment reminders
7. **Performance Testing**: Test app performance with large dataset

## 📧 Support

If you encounter issues:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify all prerequisites are met
3. Check Supabase logs in Dashboard
4. Review browser console for errors

---

**Happy Testing! 🚀**
