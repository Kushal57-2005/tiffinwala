# 🍱 TiffinWala — Product Requirements Document (PRD)

> A full-stack MERN + TypeScript tiffin management platform connecting vendors and customers across India.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Entities & Roles](#3-entities--roles)
4. [Auth Flow](#4-auth-flow)
5. [Customer Features](#5-customer-features)
6. [Vendor Features](#6-vendor-features)
7. [Payment Flow](#7-payment-flow)
8. [Booking Flow](#8-booking-flow)
9. [Subscription & Coupon System](#9-subscription--coupon-system)
10. [Real-Time Chat](#10-real-time-chat)
11. [Notification System](#11-notification-system)
12. [Monthly Billing](#12-monthly-billing)
13. [Data Models (TypeScript Interfaces)](#13-data-models-typescript-interfaces)
14. [API Endpoints](#14-api-endpoints)
15. [Phase Split](#15-phase-split)
16. [Folder Structure](#16-folder-structure)

---

## 1. Project Overview

**TiffinWala** is a dual-sided tiffin management platform where:

- **Vendors** manage their daily tiffin operations — menu, orders, deliveries, subscriptions, and earnings.
- **Customers** discover nearby vendors, order tiffins, manage subscriptions, split tiffins across friend profiles, and track monthly spending.

### Key Differentiators

- Multi-profile per customer account (roommate/friend splits under one login)
- Direct tiffin ordering — no connection/approval step, customer requests any vendor instantly
- Coupon-based subscription system (use when you want, no forced daily deduction)
- Dual monthly tally dashboard for both vendor and customer
- Real-time chat between vendor and customer (unlocked on first order request)
- Auto monthly bill email + PDF summary

---

## 2. Tech Stack

| Layer            | Technology                           |
| ---------------- | ------------------------------------ |
| Frontend         | React + Vite + TypeScript            |
| Styling          | Tailwind CSS + shadcn/ui             |
| State Management | Zustand                              |
| Backend          | Node.js + Express + TypeScript       |
| Database         | MongoDB + Mongoose                   |
| Real-Time        | Socket.io                            |
| Auth             | JWT + OTP (phone + email)            |
| Payment          | Razorpay (or Stripe)                 |
| Email            | Nodemailer                           |
| File Storage     | Cloudinary                           |
| Deployment       | Vercel (frontend) + Render (backend) |

> Responsive first — built mobile-ready for future React Native conversion.

---

## 3. Entities & Roles

### 3.1 Customer

- Can have multiple **friend profiles** under one account
- Can directly request a tiffin order from any vendor — no connection/approval step needed to order
- Can additionally request a **"Monthly Billing" connection** with a vendor (vendor must accept) — unlocks pay-later option for that vendor's orders
- Can order via wallet money or subscription tokens (immediate payment), or — if connected — add the bill to monthly dues
- Has monthly dashboard + bill summary

### 3.2 Vendor

- Manages daily tiffin sessions (Lunch / Dinner)
- Accepts/rejects customer orders
- Has delivery zone, quantity limits, open/close toggle
- Has earnings dashboard + platform fee deduction from ₹9999 balance

---

## 4. Auth Flow

### 4.1 Customer Registration

```
First Name → Last Name → Age
→ Phone Number → OTP Verify (SMS)
→ Email → OTP Verify (Email)
→ Set Location
→ Account Active ✅
```

### 4.2 Vendor Registration

```
First Name → Last Name → Age
→ Phone Number → OTP Verify (SMS)
→ Email → OTP Verify (Email)
→ Pay ₹9999 Registration Fee (Razorpay)
→ Platform holds ₹9999 as fee balance
→ Account Active ✅
```

### 4.3 Login

| Role     | Method                                     |
| -------- | ------------------------------------------ |
| Customer | Email/Phone + Password                     |
| Vendor   | Email/Phone + Password + OTP (every login) |

- Role auto-detected from DB on login
- JWT token stored in httpOnly cookie
- Redirect to respective dashboard based on role

### 4.4 Platform Fee Logic

- Every month, platform calculates 10% of vendor's total sales
- This 10% is deducted from vendor's ₹9999 balance
- When balance reaches ₹0 → vendor gets notification to pay next cycle
- Example: Vendor earns ₹8000 in month 1 → ₹800 deducted → balance = ₹8199

---

## 5. Customer Features

### 5.1 Home Page

- Nearby vendors list (based on customer location)
- Search vendors by name/area
- **My Vendors** section (vendors customer has ordered from at least once — shown first)
- Each vendor card shows:
  - Name, rating, avg price, open/closed status
  - Today's menu with tiffin description (tiffin / parcel mentioned by vendor)
  - "Order" button — directly request a tiffin from any vendor (first-time or repeat)

### 5.2 Ordering

- Select tiffin → choose quantity
- Split across friend profiles (eg. 1 for Siddesh, 1 for Pranav)
- Add order note (eg. "less spicy", "extra roti")
- Choose payment:
  - **Wallet** or **Subscription Token** (immediate deduction), OR
  - **Add to Monthly Bill** — only shown if customer has an accepted "Monthly Billing" connection with this vendor; no deduction now, amount added to pending dues
- Confirm → Request sent to vendor

### 5.3 History Page

- All previous orders with date, vendor, profiles, amount, status
- Filter by date range

### 5.4 My Subscriptions Page

- All active subscriptions per vendor
- Remaining tokens with color indicator:
  - 🔴 Red → Low tokens (≤3)
  - 🟡 Yellow → Normal
  - 🟢 Green → Good stock
- Expiry date shown per subscription

### 5.5 Dashboard

- **Filter:** Week / Month
- **Cards:**
  - Total tiffins taken
  - Total amount spent
  - Bill per vendor (breakdown)
  - Profile splits (Siddesh ate X tiffins worth ₹Y, Pranav ate...)
  - **Pending Dues** — per connected vendor, amount added to "Monthly Bill" not yet paid, with a **"Pay Now"** button (pays from wallet immediately, reduces pendingDue)
- Monthly bill PDF download button
- Auto email sent every month end (includes any pendingDue settled that month)

### 5.6 Profile

- Manage friend profiles (add / edit / remove)
- Change name, password, phone (OTP verify), email (OTP verify)

### 5.7 Messaging Page

- Real-time chat unlocked with a vendor as soon as customer sends a tiffin request (order placed) — no separate connection step needed
- Raise complaints inside chat
- Complaint status tracked: Raised → Acknowledged → Resolved

### 5.8 Notifications (Bell Icon)

- Tiffin request accepted/rejected
- Tiffin delivered (vendor marked)
- Token count low alert
- Token expiry warning (3 days before)
- New message from vendor

---

## 6. Vendor Features

### 6.1 Home Page

- **Open/Close Toggle** — mark yourself unavailable for the day
- **Today's Sessions** — Lunch / Dinner (auto-detected by upload time)
- Upload today's tiffin menu:
  - Description (mentions tiffin/parcel, price, quantity limit)
  - Max quantity per session
- List of today's incoming **tiffin order requests** (this is the only "request" in the app — customers order directly, no prior connection needed)
- Accept / Reject each order

### 6.2 History Page

- All previous orders with customer name, profile, quantity, amount, date
- Filter by date range

### 6.3 Order Requests Page

- Full list of incoming tiffin order requests (pending / accepted / rejected)
- Accept → order confirmed, customer notified, chat unlocked with that customer
  - If order's payment mode is "Monthly Bill" → add amount to that customer's `pendingDue` under this vendor's connection
- Reject → request dismissed, customer notified

### 6.3a My Customers Page (Credit Connections)

- Incoming "Monthly Billing" connection requests from customers — Accept / Reject
- List of accepted connections with each customer's current `pendingDue`
- Vendor can see at a glance which customers owe how much this month

### 6.4 Subscription Page

- List of all subscribed customers
- Per customer: subscription plan, tokens remaining, expiry date
- Color coded same as customer side

### 6.5 Dashboard

- **Filter:** Week / Month
- **Cards:**
  - Total tiffins sold
  - Total revenue
  - Platform fee deducted (from ₹9999 balance)
  - Net earnings
- **Customer-wise Sales Table:**
  - Customer name | Tiffins taken | Amount | This month
- Monthly bill PDF download
- Auto email sent every month end

### 6.6 Earnings Summary Page

- This month earned
- Platform fee deducted
- ₹9999 balance remaining
- Net in hand
- Historical monthly payslips

### 6.7 Profile

- Change name, password, phone (OTP), email (OTP)
- Set delivery zone (radius in km from vendor location)

### 6.8 Notifications (Bell Icon)

- New tiffin order request received
- Due bill payment reminder (when ₹9999 balance hits 0)
- New message from customer

---

## 7. Payment Flow

### 7.1 Customer Wallet

- Customer manually adds money to wallet (Razorpay)
- No autopay / auto-deduction
- Wallet balance shown on home and checkout
- Per order: wallet balance deducted on vendor acceptance

### 7.2 Subscription Purchase

- Customer buys a subscription plan from a vendor
- Payment via wallet
- Coupons/tokens credited to customer's account for that vendor

### 7.2a Monthly Billing (Credit) System

- Customer sends a "Monthly Billing" connection request to a vendor → vendor accepts/rejects
- Once accepted, at checkout customer can choose **"Add to Monthly Bill"** instead of paying immediately
- Order amount is added to `pendingDue` on that connection (no wallet/token deduction at order time)
- Customer can pay off `pendingDue` anytime via **"Pay Now"** button (deducts from wallet)
- At month-end, any remaining `pendingDue` is auto-settled from wallet as part of the monthly bill, then reset to ₹0
- If wallet balance is insufficient at month-end → `pendingDue` carries forward, customer notified

### 7.3 Vendor Platform Fee

- ₹9999 held by platform at registration
- Each month: 10% of total sales auto-deducted from balance
- Vendor notified when balance runs low / hits ₹0
- Vendor pays next cycle manually via notification CTA

---

## 8. Booking Flow

```
Customer browses vendors on home page (location/search)
→ Selects any vendor (no prior connection needed)
→ Views today's menu
→ Selects tiffin + quantity
→ Splits across friend profiles
→ Adds optional note
→ Chooses payment:
   - Wallet / Token (immediate), OR
   - "Add to Monthly Bill" (only if Monthly Billing connection accepted with this vendor)
→ Confirms → Request sent to Vendor
   → Chat with this vendor unlocks immediately (even before accept)
→ Vendor sees request on home page / Order Requests page
→ Vendor Accepts / Rejects
→ If Accepted:
   - Customer notified "Tiffin Confirmed ✅"
   - If Wallet/Token → deducted now
   - If Monthly Bill → added to pendingDue
   - Vendor added to customer's "My Vendors"
→ Vendor marks "Delivered"
→ Customer confirms "Received"
→ Order closed ✅
```

---

## 9. Subscription & Coupon System

### How it works

- Vendor creates a subscription plan (eg. 20 tiffins for ₹1800)
- Customer buys the plan → gets 20 tokens for that vendor
- Each time customer wants a tiffin → redeems 1 token
- No forced daily deduction — customer uses tokens whenever they want

### Expiry Logic

- If plan is for N tokens → expiry = N × 2 days from purchase date
- Example: 20 token plan → expires in 40 days
- 3 days before expiry → customer gets notification to renew
- After expiry → remaining tokens become invalid

### Token Display

- 🔴 Red: ≤3 tokens remaining
- 🟡 Yellow: 4–8 tokens
- 🟢 Green: 9+ tokens

---

## 10. Real-Time Chat

- Built with **Socket.io**
- Unlocked between a customer and vendor as soon as the customer sends a tiffin order request to that vendor (no separate connection/approval needed)
- Features:
  - Text messages
  - Complaint flow inside chat (customer types complaint → vendor responds)
  - Complaint status tag: `Raised` → `Acknowledged` → `Resolved`
- Message stored in MongoDB for history
- Unread message count shown on bell + messaging icon

---

## 11. Notification System

### Customer Notifications

| Event                | Trigger                |
| -------------------- | ---------------------- |
| Tiffin Confirmed     | Vendor accepts order   |
| Tiffin Rejected      | Vendor rejects order   |
| Tiffin Delivered     | Vendor marks delivered |
| Token Low            | Tokens drop to ≤3      |
| Token Expiry Warning | 3 days before expiry   |
| New Message          | Vendor sends message   |

### Vendor Notifications

| Event             | Trigger                |
| ----------------- | ---------------------- |
| New Order Request | Customer places order  |
| Due Bill Reminder | ₹9999 balance hits ₹0  |
| New Message       | Customer sends message |

---

## 12. Monthly Billing

- Every month end → system auto-generates bill for both vendor and customer
- **Customer bill contains:**
  - Total tiffins taken (per vendor, per profile)
  - Total amount spent
  - Profile-wise split
- **Vendor bill contains:**
  - Total tiffins sold
  - Total revenue
  - Platform fee deducted
  - Net earnings
- Bill available as PDF in dashboard
- Auto sent to registered email

---

## 13. Data Models (TypeScript Interfaces)

```typescript
// User (shared base)
interface IUser {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  email: string;
  passwordHash: string;
  role: "customer" | "vendor";
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

// Customer
interface ICustomer extends IUser {
  location: { lat: number; lng: number; address: string };
  walletBalance: number;
  friendProfiles: IFriendProfile[];
  myVendors: ObjectId[]; // auto-added when first order is placed with a vendor
}

// Friend Profile
interface IFriendProfile {
  _id: ObjectId;
  name: string;
  createdAt: Date;
}

// Vendor
interface IVendor extends IUser {
  businessName: string;
  location: { lat: number; lng: number; address: string };
  deliveryRadiusKm: number;
  isOpen: boolean;
  platformFeeBalance: number; // starts at 9999
  rating: number;
  totalRatings: number;
}

// Menu Item (daily upload)
interface IMenuItem {
  _id: ObjectId;
  vendorId: ObjectId;
  session: "lunch" | "dinner";
  description: string;
  type: "tiffin" | "parcel";
  price: number;
  maxQuantity: number;
  remainingQuantity: number;
  date: Date;
  createdAt: Date;
}

// Order
interface IOrder {
  _id: ObjectId;
  customerId: ObjectId;
  vendorId: ObjectId;
  menuItemId: ObjectId;
  profiles: { profileId: ObjectId; quantity: number }[];
  totalQuantity: number;
  totalAmount: number;
  paymentMethod: "wallet" | "token" | "monthly"; // "monthly" = added to pendingDue
  isSettled: boolean; // true once paid (immediately for wallet/token, later for monthly)
  note?: string;
  status: "pending" | "accepted" | "rejected" | "delivered" | "received";
  customerLocation: { lat: number; lng: number };
  createdAt: Date;
}

// Connection (Monthly Billing / Credit relationship)
interface IConnection {
  _id: ObjectId;
  customerId: ObjectId;
  vendorId: ObjectId;
  status: "pending" | "accepted" | "rejected";
  pendingDue: number; // accumulated unpaid "Add to Monthly Bill" orders
  createdAt: Date;
}

// Subscription
interface ISubscription {
  _id: ObjectId;
  customerId: ObjectId;
  vendorId: ObjectId;
  planName: string;
  totalTokens: number;
  remainingTokens: number;
  purchaseDate: Date;
  expiryDate: Date; // purchaseDate + (totalTokens * 2) days
  isActive: boolean;
}

// Message
interface IMessage {
  _id: ObjectId;
  senderId: ObjectId;
  receiverId: ObjectId;
  customerId: ObjectId; // the customer side of this chat pair
  vendorId: ObjectId;   // the vendor side of this chat pair
  text: string;
  complaintStatus?: "raised" | "acknowledged" | "resolved";
  isComplaint: boolean;
  createdAt: Date;
}

// Rating
interface IRating {
  _id: ObjectId;
  customerId: ObjectId;
  vendorId: ObjectId;
  stars: number; // 1-5
  review?: string;
  createdAt: Date;
}

// Notification
interface INotification {
  _id: ObjectId;
  userId: ObjectId;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Monthly Bill
interface IMonthlyBill {
  _id: ObjectId;
  userId: ObjectId;
  role: "customer" | "vendor";
  month: number;
  year: number;
  data: object; // full bill JSON
  emailSent: boolean;
  createdAt: Date;
}
```

---

## 14. API Endpoints

### Auth

```
POST   /api/auth/register/customer
POST   /api/auth/register/vendor
POST   /api/auth/verify-phone-otp
POST   /api/auth/verify-email-otp
POST   /api/auth/login/customer
POST   /api/auth/login/vendor
POST   /api/auth/logout
GET    /api/auth/me
```

### Customer

```
GET    /api/customer/vendors/nearby        # home page vendors
GET    /api/customer/vendors/search        # search
GET    /api/customer/my-vendors            # vendors customer has ordered from
GET    /api/customer/history               # order history
GET    /api/customer/subscriptions         # my subscriptions
GET    /api/customer/dashboard             # stats with filter
POST   /api/customer/profiles              # add friend profile
PUT    /api/customer/profiles/:id          # edit friend profile
DELETE /api/customer/profiles/:id          # remove friend profile
```

### Vendor

```
GET    /api/vendor/dashboard               # stats with filter
GET    /api/vendor/history                 # order history
GET    /api/vendor/subscriptions           # customer tokens
GET    /api/vendor/earnings                # earnings summary
POST   /api/vendor/menu                    # upload today's menu
PUT    /api/vendor/toggle-open             # open/close toggle
```

### Orders

```
POST   /api/orders                         # place order
PUT    /api/orders/:id/accept              # vendor accepts
PUT    /api/orders/:id/reject              # vendor rejects
PUT    /api/orders/:id/delivered           # vendor marks delivered
PUT    /api/orders/:id/received            # customer confirms received
```

### Connections (Monthly Billing / Credit)

```
POST   /api/connections/request            # customer requests monthly billing with a vendor
PUT    /api/connections/:id/accept         # vendor accepts
PUT    /api/connections/:id/reject         # vendor rejects
GET    /api/connections/my                 # customer: list of accepted connections + pendingDue
GET    /api/connections/customers          # vendor: list of connected customers + their pendingDue
POST   /api/connections/:id/pay-due        # customer pays off pendingDue now (from wallet)
```

### Subscriptions

```
POST   /api/subscriptions/buy              # customer buys plan
POST   /api/subscriptions/redeem           # redeem token for order
```

### Payments

```
POST   /api/payments/add-wallet            # add money to wallet
POST   /api/payments/vendor-fee            # vendor pays due bill
POST   /api/payments/razorpay-webhook      # payment webhook
```

### Chat

```
GET    /api/chat/:vendorId                 # fetch chat history with a vendor (customer side)
                                            # or with a customer (vendor side)
POST   /api/chat/complaint                 # mark message as complaint
PUT    /api/chat/complaint/:id/status      # update complaint status
```

### Ratings

```
POST   /api/ratings                        # add rating
GET    /api/ratings/vendor/:vendorId       # vendor ratings
```

### Notifications

```
GET    /api/notifications                  # get all
PUT    /api/notifications/:id/read         # mark read
PUT    /api/notifications/read-all         # mark all read
```

### Bills

```
GET    /api/bills/monthly                  # get monthly bill
GET    /api/bills/monthly/pdf              # download PDF
```

---

## 15. Phase Split

### ✅ Phase 1 — Core Working App

> After Phase 1, the app is fully usable end to end.

- [ ] Auth — Customer + Vendor (OTP, JWT, ₹9999 payment)
- [ ] Vendor discovery (location-based + search)
- [ ] Menu upload by vendor (open/close toggle, quantity limit, sessions)
- [ ] Booking flow (quantity + friend profile split + order notes + request → accept → confirm)
- [ ] Wallet payment + token-based payment
- [ ] Monthly Billing (Credit) connections — request/accept, "Add to Monthly Bill" option, pendingDue + Pay Now
- [ ] Delivery confirmation (vendor delivered + customer received)
- [ ] Subscription + coupon system + token color indicator
- [ ] Basic notification bell (order confirmed, request accepted, token low, expiry warning)
- [ ] Customer dashboard (week/month filter, total bill, vendor wise, friend splits)
- [ ] Vendor dashboard (sales, customer table, earnings summary)
- [ ] Monthly bill auto email + bill in dashboard
- [ ] Ratings + text review
- [ ] Profile management (both)
- [ ] Responsive UI (mobile-ready)

### 🚀 Phase 2 — Enhanced Experience

- [ ] Real-time chat (Socket.io) with complaint flow inside chat
- [ ] Vendor "Order Requests" page (full accept/reject flow)
- [ ] Vendor subscription management page (customer token tracking)
- [ ] History page (both vendor + customer)
- [ ] Vendor earnings detailed page
- [ ] Due bill notification + payment flow for vendor
- [ ] Token expiry notification refinement
- [ ] Vendor delivery location map view
- [ ] Performance optimization + PWA ready (for mobile app conversion)

---

## 16. Folder Structure

```
tiffinwala/
├── client/                         # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── customer/
│   │   │   └── vendor/
│   │   ├── pages/
│   │   │   ├── customer/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── History.tsx
│   │   │   │   ├── Subscriptions.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Chat.tsx
│   │   │   │   └── Profile.tsx
│   │   │   ├── vendor/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── History.tsx
│   │   │   │   ├── OrderRequests.tsx
│   │   │   │   ├── MyCustomers.tsx
│   │   │   │   ├── Subscriptions.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Earnings.tsx
│   │   │   │   └── Profile.tsx
│   │   │   └── auth/
│   │   │       ├── Login.tsx
│   │   │       ├── RegisterCustomer.tsx
│   │   │       └── RegisterVendor.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── orderStore.ts
│   │   │   └── notificationStore.ts
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   └── App.tsx
│
├── server/                         # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Customer.ts
│   │   │   ├── Vendor.ts
│   │   │   ├── MenuItem.ts
│   │   │   ├── Order.ts
│   │   │   ├── Connection.ts
│   │   │   ├── Subscription.ts
│   │   │   ├── Message.ts
│   │   │   ├── Rating.ts
│   │   │   ├── Notification.ts
│   │   │   └── MonthlyBill.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── async-handler.ts
│   │   ├── utils/
│   │   │   ├── api-error.ts
│   │   │   ├── api-response.ts
│   │   │   ├── otp.ts
│   │   │   ├── email.ts
│   │   │   └── bill-generator.ts
│   │   ├── socket/
│   │   │   └── chat.socket.ts
│   │   ├── jobs/
│   │   │   ├── monthly-bill.job.ts
│   │   │   └── token-expiry.job.ts
│   │   ├── db/
│   │   │   └── db.ts
│   │   ├── app.ts
│   │   └── index.ts               (entry point)
---

> **Built with ❤️ by Kushal** | TypeScript Learning Project | MERN Stack
```
