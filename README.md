# BudGlio - Level Up Your Ledger 🚀

**BudGlio** is a modern, gamified finance tracker designed to make managing your money engaging and rewarding. By combining powerful financial tools with gamification elements like XP, badges, and rewards, BudGlio turns personal finance into a fun journey of growth.

![BudGlio Banner](/public/logo.jpg)

## ✨ Key Features

### 🎮 Gamification System
Turn financial discipline into a game!
- **XP & Leveling**: Earn Experience Points (XP) for every transaction you log and every budget goal you meet. Level up to unlock new features and themes.
- **Badges & Achievements**: Unlock unique badges like "Savings Star", "Streak Master", and "Budget Boss" by hitting milestones.
- **Streaks**: Maintain daily logging streaks to earn bonus XP and coins.

### 💰 Financial Management
Comprehensive tools to track every penny.
- **Income & Expense Tracking**: Easily log income sources and daily expenses with intuitive forms.
- **Smart Budgeting**: Set monthly budgets for specific categories (Food, Transport, etc.) and get visual alerts when you're nearing your limit.
- **Savings Goals**: Create savings pots for your dreams (e.g., "New Laptop", "Vacation") and track your progress.

### 📅 Subscription Manager
Never miss a payment again.
- **Recurring Payments**: Track all your subscriptions (Netflix, Spotify, Gym) in one place.
- **Billing Reminders**: Get notified before a payment is due.
- **Cost Analysis**: See exactly how much your subscriptions are costing you monthly and yearly.

### 🏆 Rewards & Shop
Spend your virtual earnings on real value.
- **Coin System**: Earn virtual coins for consistent tracking and good financial habits.
- **Theme Shop**: Use your coins to buy premium themes like *Cyberpunk*, *Ocean Breeze*, *Sunset Glow*, and more.
- **Redeem for Cash**: (Feature in progress) Redeem your hard-earned coins for real money via UPI or Bank Transfer.

### 📊 Analytics & Insights
Visualize your financial health.
- **Interactive Charts**: View monthly spending trends and income vs. expense comparisons.
- **Category Breakdown**: See exactly where your money goes with detailed pie charts.
- **Monthly Reports**: Get a summary of your financial performance at the end of each month.

### 🎨 Modern UI/UX
A beautiful experience on any device.
- **Responsive Design**: Fully optimized for Mobile, Tablet, and Desktop.
- **PWA Support**: Install BudGlio as a native app on your phone.
- **Dark Mode**: Seamless dark mode support for late-night budgeting.
- **Smooth Animations**: Powered by Framer Motion for a fluid user experience.

---

## 🛠️ Tech Stack

This project is built with a modern, robust technology stack:

- **Frontend Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Context API & [TanStack Query](https://tanstack.com/query/latest)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/budglio.git
    cd budglio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Start the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

---

## 📂 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── budget/        # Budget-related components
│   ├── charts/        # Recharts visualizations
│   ├── gamification/  # XP bar, badges, etc.
│   ├── layout/        # BottomNav, Header, etc.
│   ├── transactions/  # Transaction forms and lists
│   └── ui/            # shadcn/ui primitives
├── constants/          # Global constants (Themes, Currencies)
├── contexts/           # React Contexts (Auth, Expense, Settings)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Route pages (Dashboard, Analytics, Shop)
└── types/              # TypeScript type definitions
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

Built with ❤️ by Ruchith