# BookNest the Online Bookstore

A full stack bookstore built with React, Express.js, and AWS RDS.

---

## Source Code & SQL Scripts

> **Link to repository:** [https://github.com/MustafaSyed19/Bookstore_Project_EECS_4413/tree/Tu_branch](https://github.com/MustafaSyed19/Bookstore_Project_EECS_4413.git)

To download the source code, clone the repository:

```bash
git clone -b tu-branch (https://github.com/MustafaSyed19/Bookstore_Project_EECS_4413.git)
```

Or download it as a ZIP from the repository's main page (Code -> Download ZIP).

---

## Running the Project

### Online Deployment

> **Live URL:** (https://bookstore-project-eecs-4413-mg1520odx.vercel.app/)
> 
## Running on Localhost

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### 1. Environment Variables

Create a `.env` file inside the `server/` folder with the following contents:

```
DB_HOST=your_aws_rds_endpoint
DB_USER=admin
DB_PASSWORD=EECS4413
DB_NAME=bookstore
JWT_SECRET=any_random_string
PORT=3000
```

> For AWS credentials, please reach out to a team member they were not included in the public repository for security reasons.

### 2. Terminal 1 — Back End

```bash
cd ./server
npm install
node server.js
```

### 3. Terminal 2 — Front End

```bash
cd ./client
npm install
npm run dev
```

Open the localhost link printed in the front-end terminal.

---

## Admin Account Credentials

| Field    | Value              |
|----------|--------------------|
| User ID  | ak@gmail.com |
| Password | 1234567      |

---
