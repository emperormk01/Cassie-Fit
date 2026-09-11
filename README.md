# Cassie Fit

> **Live:** [https://cassiefit.auxlo.xyz/](https://cassiefit.auxlo.xyz/)

A nutrition tracking app built around a cat named Cassie who'll help you figure out what you're eating, what you should be eating, and why that pizza you had last night probably wasn't the best idea.

Cassie lives in your phone, talks to you about your meals, and remembers what you like and don't like. She's not going to judge you for eating cereal for dinner — she's just going to suggest something slightly better next time.

## What it does

- **Talk to Cassie** — ask her about nutrition, get meal ideas, or just vent about your eating habits. She uses Groq AI to actually understand what you're saying and give useful answers.
- **Log your food** — scan barcodes, snap photos of your meals, search a food database, or manually type stuff in. It tracks calories, protein, carbs, and fat.
- **See your stats** — daily breakdowns, macros, and progress toward your goals. She keeps track of everything so you don't have to.
- **Get a plan** — set up your targets and schedule, adjust them whenever you want. There's a "feel good" mode too if you don't want the aggressive tracking.
- **Learn about yourself** — Cassie remembers your favorites, dislikes, cultural food background, cooking skill level, budget, and even your sleep and stress patterns. She gets to know you over time.
- **Premium stuff** — unlock more features with a subscription through Lemon Squeezy and Flutterwave.

## Stack

- Vite 5 + React 18 + TypeScript
- Tailwind CSS (dark mode included, because nobody likes squinting at their phone at night)
- Groq AI for the chat brain
- Supabase for auth, database, and real-time sync
- Lemon Squeezy + Flutterwave for payments
- Upstash Redis for caching
- Google sign-in (because nobody wants to fill out another form)

## Running it locally

```bash
bun install
bun run dev
```

You'll need a Supabase project and some environment variables set up. Check the code for what's required — the secrets aren't going to be in here.

## Author

Emperor M.K
emperormk01@gmail.com
