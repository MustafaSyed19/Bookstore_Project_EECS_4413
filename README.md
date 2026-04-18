# BookNest — Online Bookstore

A full-stack bookstore built with React, Express.js, and AWS RDS.

---

## Source Code

> **Repository:** [https://github.com/MustafaSyed19/Bookstore_Project_EECS_4413/tree/Tu_branch](https://github.com/MustafaSyed19/Bookstore_Project_EECS_4413/tree/Tu_branch)

```bash
git clone https://github.com/MustafaSyed19/Bookstore_Project_EECS_4413.git
```

Or download as a ZIP from the repository page (Code → Download ZIP).

---

## Live Deployment

The app is fully deployed and publicly accessible — no local setup required.

> **Live URL:** https://bookstore-project-eecs-4413-mg1520odx.vercel.app/

---

## Running Locally (Front End Only)

> **You do not need to run the back end locally.** The front-end client is pre-configured to call the live backend API hosted on Railway (`https://bookstore-project-eecs-4413-production.up.railway.app/api`). This is hardcoded in `client/src/api/api.js`. All API requests — authentication, products, cart, orders, and admin — go to that deployed server, which connects to the AWS RDS MySQL database. There is no local server or database needed.

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (included with Node.js)

### Steps

```bash
cd client
npm install
npm run dev
```

Open the localhost URL printed in the terminal.

---

## Admin Account

| Field    | Value         |
|----------|---------------|
| Email    | ak@gmail.com  |
| Password | 1234567       |
