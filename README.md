# Monito Monita

A free monito monita (Secret Santa) draw. Add everyone's names, send each person
their private link (or pass one phone around), and everyone draws who they'll give
a gift to. Nobody gets their own name, and no name is drawn twice.

**Live:** https://monito-monita-ph.vercel.app

## How it works

1. **Create a draw.** Group name, names (3–50), budget (₱300 by default) and the
   exchange date (next New Year's Day by default).
2. **Share.** The organizer page has a **Send link** button per person. On a phone
   it opens the share sheet (Messenger, Viber…); on a computer it copies the message.
3. **Draw.** Each person opens their link, adds a wishlist if they like, and taps
   **Bumunot!** Their gift-giver sees the wishlist, including later edits.
4. **Or pass the phone.** Everyone draws on one device. After each reveal there's a
   QR code to keep the result on your own phone, then **Hide & pass the phone**.

## Fair and secret

- **Pairs are made up front.** Drawing names one by one can leave the last person
  with only their own name. So the app pairs everyone when the draw is created (a
  random shuffle, repeated until nobody lands on themselves), and each draw just
  reveals that person's pair. See [`shared/draw.ts`](shared/draw.ts).
- **Nobody sees the full list,** not even the organizer. The organizer page only
  shows who has drawn.
- **Secrets live in the URL fragment** (`/p/<draw>#<token>`). Browsers never send
  the part after `#` to the server, so it stays out of logs; the page sends it in a
  header instead.
- **Tokens are hashed.** The server stores only SHA-256 hashes of the organizer key
  and of each person's token. Person tokens are an HMAC of the organizer key, so the
  organizer page can rebuild everyone's links without the server keeping them.
- **Peeking leaves a trace.** Each person's page shows when they first drew.

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3) with server routes on Vercel, Tailwind CSS v4
- [Vercel Blob](https://vercel.com/docs/vercel-blob) (private store) for draws and
  wishlists, one JSON file per draw and per person. Without `BLOB_READ_WRITE_TOKEN`
  the same files go to `.data/` locally.
- Vitest for the draw and validation rules

## Run it

```bash
npm install
npm run dev      # http://localhost:3000, stores data in .data/
npm test
npm run typecheck
npm run build
```

To deploy: create a private Blob store on Vercel, connect it to the project (that
sets `BLOB_READ_WRITE_TOKEN`) and deploy. Everything fits Vercel's free Hobby plan.
