# 📚 BookNest — Online Bookstore

A full-stack bookstore built with React, Express.js, and MySQL.

## Setup

### 1. Environment Variables

Create a `.env` file inside the `server/` folder:


If you need the AWS creds please reachout to any of the team members we did not feel safe sharing them in a public repo
```
DB_HOST=your_aws_rds_endpoint
DB_USER=admin
DB_PASSWORD=EECS4413
DB_NAME=bookstore
JWT_SECRET=any_random_string
PORT=3000
```

### 2. Terminal 1 — Back End

```
cd ./server
npm install
node server.js
```

### 3. Terminal 2 — Front End

```
cd ./client
npm install
npm run dev
```

Open localhost link in FrontEnd terminal
