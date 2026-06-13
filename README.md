# 🍱 TiffinWala

> A full-stack MERN + TypeScript tiffin management platform connecting vendors and customers across India.

---

## 👨‍💻 Author

**Kushal Kishor Waykole**
GitHub: https://github.com/kushal57-2005

---

## 🚀 Overview

**TiffinWala** is a real-world full-stack application that connects:

* 🧑‍🍳 **Vendors** → Manage menu, orders, subscriptions, and earnings
* 🧑‍💻 **Customers** → Discover vendors, order meals, and track expenses

It solves the problem of **daily meal management** for students and working professionals.

---

## ✨ Key Features

### 👤 Customer Features

* Location-based vendor discovery
* Order tiffins with **multi-profile splitting**
* Wallet + Subscription (token) payment system
* Monthly dashboard with bill PDF
* Real-time chat with vendors
* Token expiry & low balance alerts

### 🧑‍🍳 Vendor Features

* Upload daily menu (Lunch/Dinner)
* Accept/Reject orders
* Manage customer subscriptions
* Earnings dashboard with analytics
* Platform fee tracking system

### ⚡ Advanced Features

* 🔄 Real-time chat (Socket.io)
* 🎟️ Token-based subscription system
* 📊 Monthly billing system (PDF + Email)
* 🔔 Notification system
* 👥 Multi-profile support (unique feature)

---

## 🛠️ Tech Stack

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Frontend  | React + Vite + TypeScript      |
| Styling   | Tailwind CSS                   |
| State     | Zustand                        |
| Backend   | Node.js + Express + TypeScript |
| Database  | MongoDB + Mongoose             |
| Real-Time | Socket.io                      |
| Auth      | JWT + OTP                      |
| Payment   | Razorpay                       |
| Storage   | Cloudinary                     |

---

## 📂 Project Structure

```
tiffinwala/
├── client/     # Frontend (React + TypeScript)
├── server/     # Backend (Node.js + Express)
```

---

## 🔐 Authentication

* OTP verification (Phone + Email)
* JWT authentication (httpOnly cookies)
* Role-based login system

---

## 💳 Payment System

* Wallet-based payment system
* Subscription token system
* Vendor platform fee:

  * ₹9999 initial balance
  * 10% monthly deduction

---

## 🔄 Booking Flow

```
Customer → Select Vendor → Choose Tiffin  
→ Split Profiles → Payment  
→ Vendor Accepts → Delivery → Completed  
```

---

## 🎟️ Subscription System

* Buy tiffin plans (tokens)
* Use anytime (no forced daily usage)
* Expiry = Tokens × 2 days

### Token Indicators

* 🔴 Low (≤3)
* 🟡 Medium
* 🟢 Good

---

## 📊 Dashboards

### Customer Dashboard

* Total spending
* Vendor-wise breakdown
* Profile-wise consumption
* Monthly bill PDF

### Vendor Dashboard

* Total revenue
* Platform fee deducted
* Net earnings
* Customer-wise analytics

---

## ⚙️ Environment Setup

Create a `.env` file inside the `server/` folder:

```
PORT=5000
MONGO_URL=your_mongodb_connection_string

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
OTP_EXPIRES_IN=600000

SMTP_USER=your_email
SMTP_PASS=your_password

FAST2SMS_API_KEY=your_api_key

RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

CLIENT_URL=frontenn_url
```

---

## 🏁 Getting Started

```bash
# Clone repository
git clone https://github.com/kushal57-2005/tiffinwala.git

# Install dependencies
cd client && npm install
cd ../server && npm install

# Run project
npm run dev
```

---

## ⭐ Why This Project?

* Real-world business logic
* Payment + subscription system
* Multi-role architecture
* Strong portfolio project for placements

---
