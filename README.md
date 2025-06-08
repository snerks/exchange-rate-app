# Exchange Rate App

A modern, mobile-friendly currency exchange rate app built with React, Vite, TypeScript, and Material UI.

## Features

- Live exchange rates from the European Central Bank (ECB)
- No API key required
- Fallback to local XML data if remote fetch fails
- Light/Dark mode toggle
- Mobile-first responsive design
- Select any base and target currency
- Table of all exchange rates for the selected base currency
- Error and data source feedback to the user

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm

### Installation

```sh
npm install
```

### Development

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```

### Deploy to GitHub Pages

```sh
npm run deploy
```

## Project Structure

- `src/` — Main source code
- `data/eurofxref-daily.xml` — Local fallback for ECB rates
- `vite.config.ts` — Vite configuration (includes proxy for ECB XML)

## Notes

- The app uses a Vite dev server proxy to fetch ECB XML data and avoid CORS issues.
- If the remote fetch fails or returns invalid data, the app falls back to the local XML file.
- The app is fully responsive and works well on mobile devices.

## License

MIT
