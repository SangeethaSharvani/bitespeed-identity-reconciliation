# Bitespeed Identity Reconciliation Backend

## Overview

This service implements the Bitespeed Identity Reconciliation task.

It exposes a single endpoint `/identify` that links customer contact records based on shared email or phone number.

The system:

- Creates a primary contact for new users
- Creates secondary contacts when new information is found
- Merges multiple primaries correctly (oldest remains primary)
- Returns consolidated contact details
- Uses transaction-safe database operations

---

## Hosted Endpoint

Base URL:

https://bitespeed-identity-reconciliation-bydr.onrender.com

Identify Endpoint:

POST https://bitespeed-identity-reconciliation-bydr.onrender.com/identify

---

## Request Format

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

At least one of `email` or `phoneNumber` must be provided.

---

## Response Format

```json
{
  "contact": {
    "primaryContactId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}
```

---

## Example

### Request

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

### Response

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [2]
  }
}
```

---

## Tech Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL (Render Hosted)
- Transaction-based identity reconciliation logic

---

## How to Run Locally

```bash
npm install
npx prisma migrate dev
npm run dev
```

---

## Deployment

Hosted on Render using PostgreSQL for persistent storage.

## Now run:

git add README.md
git commit -m "Fix README formatting"
git push
