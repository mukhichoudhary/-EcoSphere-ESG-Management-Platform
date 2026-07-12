# 🌿 EcoSphere – ESG Management Platform

A full-stack web application for managing Environmental, Social, and Governance (ESG) metrics, gamification, challenges, and reporting within an organization.

---

## 📁 Project Structure

```
ecosphere/
├── backend/
│   ├── server.js          # Express server entry point
│   ├── db.js              # SQLite database setup & queries
│   └── routes/
│       ├── auth.js        # Authentication (login/register)
│       ├── esg.js         # ESG data & emissions tracking
│       ├── challenges.js  # Sustainability challenges
│       ├── gamification.js# Points & leaderboard
│       ├── badges.js      # Badge system
│       ├── rewards.js     # Rewards management
│       ├── notifications.js# User notifications
│       ├── settings.js    # User/app settings
│       ├── departments.js # Department management
│       ├── categories.js  # ESG categories
│       └── emission_factors.js # Emission factor data
├── frontend/
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── dashboard.html     # Main dashboard
│   ├── environmental.html # Environmental metrics
│   ├── governance.html    # Governance tracking
│   ├── gamification.html  # Challenges & leaderboard
│   ├── social.html        # Social features
│   ├── reports.html       # ESG reports
│   └── settings.html      # Settings page
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm

The server will start at **http://localhost:3000**.

---

## 🛠️ Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Backend  | Node.js + Express   |
| Database | SQLite (via sqlite3)|
| Auth     | bcryptjs            |
| Frontend | HTML, CSS, Vanilla JS |

---

## ✨ Features

- 📊 **ESG Dashboard** – Track environmental, social, and governance KPIs
- 🌍 **Environmental Tracking** – Log emissions, energy, and resource usage
- 🏆 **Gamification** – Points, badges, challenges, and leaderboards
- 🎁 **Rewards** – Redeem points for sustainability rewards
- 📄 **Reports** – Generate and view ESG reports
- 🔔 **Notifications** – Real-time user notifications
- ⚙️ **Settings** – User profile and app preferences

---
