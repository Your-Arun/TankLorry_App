# 🛢️ Tank Lorry Smart Manager
### Node.js + Express + MongoDB + Expo React Native

---

## 📁 Project Structure

```
TankLorryApp/
├── backend/                  ← Node.js + Express + MongoDB API
│   ├── server.js             ← Entry point
│   ├── config/db.js          ← MongoDB connection
│   ├── models/StockEntry.js  ← Mongoose schema
│   ├── controllers/stockController.js
│   ├── routes/stockRoutes.js
│   ├── utils/decisionEngine.js
│   ├── middleware/errorHandler.js
│   ├── .env.example          ← Copy to .env and fill in
│   └── package.json
│
└── frontend/                 ← Expo React Native app
    ├── App.js
    ├── api/
    │   ├── apiConfig.js      ← ⚠️ Set your server IP here
    │   └── stockApi.js
    ├── context/AppContext.js
    ├── utils/decisionEngine.js
    ├── screens/
    │   ├── DashboardScreen.js
    │   ├── DailyEntryScreen.js
    │   └── HistoryScreen.js
    ├── components/
    │   ├── TankGauge.js
    │   ├── IndentCard.js
    │   └── StatCard.js
    └── package.json
```

---

## 🚀 Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
# For local MongoDB:
MONGO_URI=mongodb://localhost:27017/tanklorry

# For MongoDB Atlas (free cloud DB):
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/tanklorry

PORT=5000
```

### 3. Start the server

**Development (auto-restart on changes):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs at: `http://localhost:5000`

---

## 🌐 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Health check |
| POST | `/api/stock` | Save new entry |
| GET | `/api/stock/latest` | Get latest entry |
| GET | `/api/stock/history?page=1&limit=20` | Paginated history |
| DELETE | `/api/stock/:id` | Delete entry |

### POST /api/stock — Request Body
```json
{
  "tank1": 8000,
  "tank2": 2500,
  "avgSale": 2000
}
```

### POST /api/stock — Response
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "tank1": 8000,
    "tank2": 2500,
    "avgSale": 2000,
    "totalStock": 10500,
    "suggestedIndent": "No Indent",
    "isEmergency": false,
    "reason": "Weekday: 5.3 days stock left. No indent needed.",
    "daysLeft": 5.25,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## 📱 Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. ⚠️ Set your server URL
Edit `frontend/api/apiConfig.js`:

```js
// Android Emulator (default):
const BASE_URL = 'http://10.0.2.2:5000/api';

// Real Android device (use your PC's local IP):
const BASE_URL = 'http://192.168.1.XXX:5000/api';

// iOS Simulator:
const BASE_URL = 'http://localhost:5000/api';

// Deployed server:
const BASE_URL = 'https://your-server.com/api';
```

### 3. Start the app
```bash
npx expo start
```

---

## 📦 Build Android APK (EAS)

```bash
cd frontend

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK (preview profile)
eas build --platform android --profile preview
```

---

## 🗄️ MongoDB Atlas (Free Cloud DB)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free account
2. Create a free M0 cluster
3. Add a database user (username + password)
4. Whitelist your IP (or use 0.0.0.0/0 for all IPs)
5. Click **Connect** → **Connect your application** → copy the connection string
6. Paste into `.env`:
   ```
   MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/tanklorry
   ```

---

## 🧠 Decision Engine Logic

| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Tank 1 < 2000L OR Tank 2 < 600L | Emergency indent (12 or 14 KL) |
| 2 | Sunday | No Indent – Depot Closed |
| 3 | Saturday + stock < 3000L + space ≥ 14000L | 14 KL |
| 3 | Saturday + stock < 6000L + space ≥ 12000L | 12 KL |
| 4 | Weekday + daysLeft < 1.5 + space ≥ 14000L | 14 KL |
| 4 | Weekday + daysLeft < 3 + space ≥ 12000L | 12 KL |
| 5 | Default | No Indent |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo React Native (JS) |
| State | React Context API |
| HTTP Client | Axios |
| Navigation | React Navigation v6 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | None (Phase 1) |
| Build | EAS (Expo Application Services) |
