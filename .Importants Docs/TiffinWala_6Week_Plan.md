# 🍱 TiffinWala — 6 Week Development Plan

> Phase 1: Week 1–3.5 | Phase 2: Week 3.5–5.5 | Buffer + Polish: Week 6

---

## 📌 Ground Rules

- 1 day = 1 focused topic (don't jump ahead)
- End of each week = push to GitHub
- Sunday = revision + fix pending bugs (no new features)
- If you're stuck > 2 hours → skip, note it, come back later

---

## 🟢 PHASE 1 — Core Working App (Week 1 – Week 3.5)

---

### WEEK 1 — Project Setup + Auth

#### Day 1 — Project Initialization

- [✅] Init monorepo structure (client + server folders)
- [✅] Setup Vite + React + TypeScript (client)
- [✅] Setup Node + Express + TypeScript (server)
- [✅] Setup MongoDB connection + Mongoose
- [✅] Setup ESLint + Prettier + tsconfig
- [✅] Setup Tailwind CSS + shadcn/ui
- [✅] Create base folder structure (routes, controllers, models, middlewares, utils)
- [✅] Copy `api-error.ts`, `api-response.ts`, `async-handler.ts` from FitAI

#### Day 2 — Auth Models + Customer Register

- [✅] Create `User` base model (TypeScript interface + Mongoose schema)
- [✅] Create `Customer` model
- [✅] Create `Vendor` model
- [✅] Build Customer Register API (name, age, phone, email, password)
- [✅] Hash password with bcrypt
- [✅] Send Phone OTP (Twilio/Fast2SMS)
- [✅] Send Email OTP (Nodemailer)

#### Day 3 — Auth OTP Verify + Vendor Register

- [✅] Phone OTP verify endpoint
- [✅] Email OTP verify endpoint
- [✅] Build Vendor Register API
- [✅] Integrate Razorpay for ₹9999 registration fee
- [✅] On payment success → activate vendor account
- [✅] Store ₹9999 as `Wallet` in vendor doc

#### Day 4 — Login + JWT + Middleware

- [✅] Customer login (email/phone + password)
- [✅] Vendor login (email/phone + password + OTP)
- [✅] JWT generation + httpOnly cookie setup
- [✅] `auth.middleware.ts` — protect routes
- [✅] `role.middleware.ts` — vendor/customer role check
- [✅] `/api/auth/me` endpoint
- [✅] Logout endpoint (clear cookie)

#### Day 5 — Auth Frontend (Register + Login Pages)

- [✅] Setup Zustand `authStore.ts`
- [✅] Setup Axios instance with interceptors (`api.ts`)
- [✅] Build `RegisterCustomer.tsx` page (multi-step form)
- [✅] Build `RegisterVendor.tsx` page (multi-step + Razorpay)
- [✅] OTP input component (reusable)
- [✅] Build `Login.tsx` (role-aware)
- [✅] Protected route wrapper
- [✅] Redirect to correct dashboard based on role

#### Day 6 — Auth Polish + Testing

- [ ] Test all auth flows end to end
- [ ] Handle edge cases (expired OTP, wrong OTP, duplicate email/phone)
- [ ] Show proper error messages on frontend
- [ ] Mobile responsive auth pages

#### Day 7 (Sunday) — Revision

- [ ] Review all auth code
- [ ] Fix any pending bugs
- [ ] Push Week 1 to GitHub
- [ ] Note down anything unclear

---

### WEEK 2 — Vendor Features + Menu + Discovery

#### Day 8 — Vendor Profile + Menu Model

- [ ] `MenuItem` model (session, description, type, price, maxQuantity, date)
- [ ] Vendor profile API (GET + PUT — name, phone, email, deliveryRadius, location)
- [ ] Open/Close toggle API (`PUT /api/vendor/toggle-open`)
- [ ] Menu upload API (`POST /api/vendor/menu`)
- [ ] Auto-detect session from upload time (before 12PM = lunch, after = dinner)

#### Day 9 — Vendor Home Page (Frontend)

- [ ] Build Vendor layout + navbar with bell icon
- [ ] Build `VendorHome.tsx`
    - [ ] Open/Close toggle UI
    - [ ] Upload today's menu form
    - [ ] Today's orders list (empty state for now)
    - [ ] Accept / Reject buttons per order (wire up later)

#### Day 10 — Location + Vendor Discovery API

- [ ] Store customer location on register + update in profile
- [ ] Nearby vendors API (MongoDB geospatial query — `$near`)
- [ ] Search vendors API (by name/area)
- [ ] Add `2dsphere` index to vendor location field

#### Day 11 — Customer Home Page (Frontend)

- [ ] Build Customer layout + navbar with bell icon
- [ ] Build `CustomerHome.tsx`
    - [ ] Nearby vendors list (cards with name, rating, price, open/closed)
    - [ ] Search bar
    - [ ] My Vendors section (connected vendors on top)
    - [ ] Vendor detail modal (menu, description, tiffin/parcel, price)
    - [ ] "Connect" button for new vendors
    - [ ] "Order" button for connected vendors

#### Day 12 — Connection Request Flow

- [ ] `Connection` model
- [ ] `POST /api/connections/request` — customer sends request
- [ ] `PUT /api/connections/:id/accept` — vendor accepts
- [ ] `PUT /api/connections/:id/reject` — vendor rejects
- [ ] Vendor Request Page (`VendorRequests.tsx`)
- [ ] On accept → both users can see each other as connected

#### Day 13 — Friend Profiles

- [ ] `FriendProfile` embedded in Customer model
- [ ] Add / Edit / Remove friend profile APIs
- [ ] `ManageFriends.tsx` component in customer profile
- [ ] Profile selector component (reusable — used during booking)

#### Day 14 (Sunday) — Revision

- [ ] Test vendor discovery end to end
- [ ] Test connection request flow
- [ ] Push Week 2 to GitHub

---

### WEEK 3 — Orders + Payments + Subscriptions

#### Day 15 — Order Model + Place Order API

- [ ] `Order` model (profiles array, paymentMethod, note, status, customerLocation)
- [ ] `POST /api/orders` — place order
    - [ ] Validate quantity vs remaining stock
    - [ ] Store customer location at time of booking
    - [ ] Set status to `pending`
    - [ ] Deduct from `remainingQuantity` in MenuItem (reserve stock)

#### Day 16 — Order Accept/Reject + Delivery Flow

- [ ] `PUT /api/orders/:id/accept` — vendor accepts, deduct wallet or token
- [ ] `PUT /api/orders/:id/reject` — vendor rejects, refund reservation
- [ ] `PUT /api/orders/:id/delivered` — vendor marks delivered
- [ ] `PUT /api/orders/:id/received` — customer confirms received
- [ ] Wire Accept/Reject buttons on Vendor Home page
- [ ] Show order status on Customer Home

#### Day 17 — Wallet System

- [ ] Add `walletBalance` to Customer model
- [ ] `POST /api/payments/add-wallet` — Razorpay order creation
- [ ] Razorpay webhook — verify + credit wallet
- [ ] Wallet balance shown in navbar + checkout
- [ ] Deduct wallet on order accept

#### Day 18 — Subscription + Coupon System

- [ ] `Subscription` model (totalTokens, remainingTokens, expiryDate)
- [ ] Vendor creates subscription plan API
- [ ] `POST /api/subscriptions/buy` — customer buys plan, tokens credited
- [ ] Expiry = purchaseDate + (totalTokens × 2) days
- [ ] `POST /api/subscriptions/redeem` — redeem token per order
- [ ] My Subscriptions page (`CustomerSubscriptions.tsx`)
    - [ ] Token color indicator (🔴🟡🟢)
    - [ ] Expiry date display
- [ ] Vendor Subscription page (`VendorSubscriptions.tsx`)
    - [ ] Customer list + remaining tokens

#### Day 19 — Booking Flow UI (Full)

- [ ] Order modal / bottom sheet (mobile-friendly)
    - [ ] Tiffin selector
    - [ ] Quantity input
    - [ ] Friend profile split selector
    - [ ] Order note input
    - [ ] Payment method toggle (Wallet / Token)
    - [ ] Confirm button → API call
- [ ] Show pending order status on customer home
- [ ] Vendor home shows incoming order with Accept/Reject

#### Day 20 — Ratings

- [ ] `Rating` model
- [ ] `POST /api/ratings` — add rating (stars + optional review text)
- [ ] `GET /api/ratings/vendor/:vendorId` — get all ratings
- [ ] Update vendor's avg rating on every new rating
- [ ] Rating component on vendor card (stars display)
- [ ] Add rating button in customer's connected vendor section

#### Day 21 (Sunday) — Revision

- [ ] Test full booking flow end to end
- [ ] Test wallet + token payment
- [ ] Test subscription expiry logic
- [ ] Push Week 3 to GitHub

---

### WEEK 3.5 (Days 22–25) — Dashboards + Billing + Phase 1 Wrap

#### Day 22 — Customer Dashboard

- [ ] Dashboard API (`GET /api/customer/dashboard?filter=week|month`)
    - [ ] Total tiffins taken
    - [ ] Total amount spent
    - [ ] Per vendor breakdown
    - [ ] Per friend profile breakdown
- [ ] `CustomerDashboard.tsx`
    - [ ] Week/Month filter tabs
    - [ ] Stat cards
    - [ ] Vendor breakdown list
    - [ ] Friend profile splits table

#### Day 23 — Vendor Dashboard + Earnings Page

- [ ] Dashboard API (`GET /api/vendor/dashboard?filter=week|month`)
    - [ ] Total tiffins sold
    - [ ] Total revenue
    - [ ] Platform fee deducted
    - [ ] Net earnings
    - [ ] Customer-wise sales table
- [ ] `VendorDashboard.tsx`
- [ ] `VendorEarnings.tsx`
    - [ ] ₹9999 balance remaining
    - [ ] Monthly payslip list

#### Day 24 — Monthly Bill + Auto Email

- [ ] `MonthlyBill` model
- [ ] Bill generation logic (runs on month end via cron job — `node-cron`)
- [ ] Customer bill: tiffins per vendor per profile + total
- [ ] Vendor bill: tiffins per customer + revenue + fee deducted + net
- [ ] Nodemailer — send bill as HTML email
- [ ] PDF generation (`pdfkit` or `puppeteer`) — download from dashboard
- [ ] `GET /api/bills/monthly` + `GET /api/bills/monthly/pdf`

#### Day 25 — Basic Notifications + Phase 1 Polish

- [ ] `Notification` model
- [ ] Create notification utility function (reusable)
- [ ] Trigger notifications for: order confirmed/rejected, token low, expiry warning, due bill
- [ ] Bell icon with unread count in navbar
- [ ] Notification dropdown UI
- [ ] `PUT /api/notifications/:id/read`
- [ ] Full responsive check on all pages
- [ ] Fix any pending bugs from Week 1–3

---

> ✅ **PHASE 1 COMPLETE — App is fully usable end to end**

---

## 🔵 PHASE 2 — Enhanced Experience (Week 4 – Week 5.5)

---

### WEEK 4 — Real-Time Chat + History Pages

#### Day 26 — Socket.io Setup + Chat Backend

- [ ] Install + configure Socket.io on Express server
- [ ] `chat.socket.ts` — handle connect, disconnect, join room, send message
- [ ] Room ID = connectionId (vendor-customer pair)
- [ ] `Message` model (text, senderId, receiverId, isComplaint, complaintStatus)
- [ ] `GET /api/chat/:connectionId` — fetch chat history
- [ ] Socket.io client setup (`socket.ts` in frontend utils)

#### Day 27 — Chat Frontend

- [ ] `ChatPage.tsx` — list of conversations (vendor or customer side)
- [ ] `ChatWindow.tsx` — real-time message UI
    - [ ] Send message
    - [ ] Message bubbles (sent/received)
    - [ ] Scroll to bottom on new message
    - [ ] Unread count badge on conversation list

#### Day 28 — Complaint Flow in Chat

- [ ] "Mark as Complaint" button on customer side message
- [ ] Complaint tag shown on message (`Raised`)
- [ ] Vendor can change status → `Acknowledged` → `Resolved`
- [ ] `PUT /api/chat/complaint/:id/status`
- [ ] Color coded complaint status tags in chat UI
- [ ] Notification triggered on complaint status change

#### Day 29 — History Pages

- [ ] `GET /api/customer/history` — paginated order history
- [ ] `GET /api/vendor/history` — paginated order history
- [ ] `CustomerHistory.tsx` — order cards with date, vendor, profiles, amount, status
- [ ] `VendorHistory.tsx` — order cards with customer, quantity, amount, status
- [ ] Date range filter on both

#### Day 30 — Notification Refinements

- [ ] Real-time notifications via Socket.io (not just on page load)
- [ ] Token expiry cron job (`token-expiry.job.ts`) — runs daily, checks expiry in 3 days
- [ ] Due bill notification when vendor ₹9999 balance hits 0
- [ ] Vendor due bill payment flow (`POST /api/payments/vendor-fee`)
- [ ] Notification for new chat message (bell icon)

#### Day 31 — Vendor Subscription Management

- [ ] Full `VendorSubscriptions.tsx` polish
    - [ ] Customer list with token count + color indicator
    - [ ] Expiry date per customer
    - [ ] Search/filter customers
- [ ] Vendor can create multiple subscription plan types
- [ ] Customer sees all available plans per vendor before buying

#### Day 32 (Sunday) — Revision

- [ ] Test chat end to end
- [ ] Test complaint flow
- [ ] Test history pages
- [ ] Push Week 4 to GitHub

---

### WEEK 5 — Map View + PWA + Polish

#### Day 33 — Vendor Location Map View

- [ ] Integrate Leaflet.js (free, no API key needed)
- [ ] On order accepted → vendor sees customer pin on map
- [ ] Customer location stored at booking time (already in Order model)
- [ ] Simple map modal on vendor home per order

#### Day 34 — Profile Pages Polish

- [ ] `CustomerProfile.tsx` — full implementation
    - [ ] Change name, password
    - [ ] Change phone (OTP verify new number)
    - [ ] Change email (OTP verify new email)
    - [ ] Manage friend profiles
- [ ] `VendorProfile.tsx` — full implementation
    - [ ] Same fields
    - [ ] Set delivery zone radius

#### Day 35 — PWA Setup

- [ ] Add `vite-plugin-pwa`
- [ ] Configure `manifest.json` (app name, icons, theme color)
- [ ] Service worker for offline caching (static assets)
- [ ] "Add to Home Screen" prompt
- [ ] Test on mobile browser

#### Day 36 — UI/UX Polish Pass 1

- [ ] Go through every page — check spacing, typography, colors
- [ ] Empty states for all lists (no vendors nearby, no orders, no messages)
- [ ] Loading skeletons for all data-fetching components
- [ ] Error boundary setup

#### Day 37 — UI/UX Polish Pass 2

- [ ] Mobile responsiveness audit (test on 375px, 390px, 414px)
- [ ] Touch targets (buttons min 44px)
- [ ] Form validation messages (all forms)
- [ ] Toast notifications for all actions (success/error)

#### Day 38 (Sunday) — Revision

- [ ] Full app walkthrough as customer
- [ ] Full app walkthrough as vendor
- [ ] Note all bugs
- [ ] Push Week 5 to GitHub

---

### WEEK 5.5 (Days 39–42) — Testing + Bug Fixes

#### Day 39 — Backend Testing

- [ ] Test all API endpoints (Postman/Thunder Client)
- [ ] Edge cases: insufficient wallet, expired token, duplicate OTP, etc.
- [ ] Check all Mongoose queries for efficiency
- [ ] Add missing indexes (phone, email, location, vendorId, customerId)

#### Day 40 — Frontend Testing

- [ ] Test all user flows (register → order → receive)
- [ ] Test subscription → token redeem → expiry
- [ ] Test chat → complaint → resolve
- [ ] Test monthly bill generation + email

#### Day 41 — Performance

- [ ] Lazy load routes (React.lazy + Suspense)
- [ ] Optimize images (Cloudinary transformations)
- [ ] Paginate all list APIs (orders, messages, vendors)
- [ ] Debounce search input

#### Day 42 — Deployment

- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Setup environment variables
- [ ] Test production build
- [ ] Fix any prod-only bugs

---

> ✅ **PHASE 2 COMPLETE**

---

## 🟡 WEEK 6 — Buffer + Final Polish

#### Day 43–44 — Leftover Bug Fixes

- [ ] Fix anything from testing week
- [ ] Handle all console errors/warnings
- [ ] Final responsive check

#### Day 45–46 — README + Documentation

- [ ] Write proper GitHub README
    - [ ] Project description
    - [ ] Tech stack badges
    - [ ] Screenshots
    - [ ] Setup instructions (local dev)
    - [ ] API documentation link
    - [ ] Live demo link
- [ ] Add JSDoc comments to complex functions
- [ ] TypeScript strict mode check (fix any `any` types)

#### Day 47–48 — Portfolio Prep

- [ ] Record a 2-3 min demo video (Loom)
- [ ] Write LinkedIn post about the project
- [ ] Add to resume under projects section
- [ ] Deploy final version + share link

---

## 📊 Summary

| Week     | Focus                                             | Phase   |
| -------- | ------------------------------------------------- | ------- |
| Week 1   | Setup + Auth (Customer + Vendor + OTP + ₹9999)    | Phase 1 |
| Week 2   | Vendor Features + Menu + Discovery + Connections  | Phase 1 |
| Week 3   | Orders + Wallet + Subscriptions + Ratings         | Phase 1 |
| Week 3.5 | Dashboards + Billing + Notifications              | Phase 1 |
| Week 4   | Chat + Complaints + History + Notification Polish | Phase 2 |
| Week 5   | Map + PWA + UI Polish + Mobile Audit              | Phase 2 |
| Week 5.5 | Testing + Bug Fixes + Deployment                  | Phase 2 |
| Week 6   | Buffer + README + Portfolio Prep                  | Polish  |

---

## 🔧 Daily Dev Checklist

- [ ] Pull latest from GitHub before starting
- [ ] Write TypeScript interfaces before writing logic
- [ ] Test API in Postman before wiring frontend
- [ ] Commit after every feature (not end of day)
- [ ] Message: `feat: add order accept flow` not `update`

---

> **Start Date:** \***\*\_\_\*\*** | **Target End Date:** \***\*\_\_\*\*** (42 working days)
> Built by Kushal | TiffinWala | MERN + TypeScript
