# 🎸 GigLog

Concert tracker for friend groups. Log concerts, plan upcoming shows, chat with your crew, write reviews, and view stats & maps.

## Features

- **Concert log** — Add concerts with artist, date, venue, city, country and status
- **Calendar** — Monthly view of all upcoming and past concerts
- **Want to see** — Wishlist of planned concerts sorted by date
- **Friends per concert** — Track who in the group is going
- **Group chat** — Real-time message thread on each concert page
- **Shared notepad** — One shared note per concert, editable by anyone
- **Reviews** — Personal star ratings and written reviews after attending
- **Setlist** — Manually build the setlist song by song
- **Spotify link** — Attach a Spotify playlist to each concert
- **Stats** — Total concerts, concerts per year chart, most seen artists
- **Map** — World map with pins on cities where concerts were attended

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — auth + database + realtime
- [React Router](https://reactrouter.com/)
- [Recharts](https://recharts.org/) — stats charts
- [react-simple-maps](https://www.react-simple-maps.io/) — concert map

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/concertapp.git
cd concertapp
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Set up environment variables

Create a `.env` file in the root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the database

Run the SQL migration in your Supabase project (SQL Editor):

```
supabase/migrations/001_initial.sql
```

### 5. Start the dev server

```bash
npm run dev
```

## Deployment

The app is deployed to GitHub Pages via GitHub Actions on every push to `main`.

Add your Supabase credentials as repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then enable GitHub Pages in repo Settings → Pages → Source: **GitHub Actions**.
