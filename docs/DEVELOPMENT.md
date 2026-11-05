# Development

## Stack

React, TypeScript, Vite, Tailwind CSS, React Router, Supabase, and a PWA setup.

## Getting started

Requires Node.js and npm.

```
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with your own values. Never commit it.

The dev server runs at http://localhost:5173.

## Commands

```
npm run dev          # start the dev server
npm run build        # type-check and build
npm run preview      # preview the production build
npm run lint         # lint
npx tsc -b           # type-check
npm test             # run tests
npm run test:upload  # run upload validation tests
```

## Versioning

The release version is read from `package.json`. Change it there only.
