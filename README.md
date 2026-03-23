# CreativeCache Backend

Digital subscription store backend built with Node.js, Express, TypeScript, and MongoDB.

## Prerequisites
- Node.js (v18+)
- npm
- MongoDB (Atlas or local)

## Installation

```sh
git clone https://github.com/bijoyshariar/retrogroom-subscription-store-backend.git
cd retrogroom-subscription-store-backend
npm install
cp .env.example .env
# Fill in .env values
npm run dev
```

## Project Structure

```
├── server.ts                  # Entry point
├── src/
│   ├── config.ts              # Environment config
│   ├── dbConnection.ts        # MongoDB connection
│   └── middlewares/
│       ├── authMiddleware.ts   # JWT auth
│       ├── isAdmin.ts         # Admin check
│       └── globalErrorHandler.ts
├── services/
│   ├── user/                  # Auth, profile, cart, wishlist, OTP, reviews
│   ├── product/               # Products, variants, tags, categories
│   ├── order/                 # Orders, credentials, renewals, subscriptions
│   ├── collection/            # Product collections
│   ├── coupon/                # Coupons (fixed/percentage)
│   ├── ticket/                # Support tickets
│   └── refund/                # Refund requests
```

## API Routes

### Auth & User — `/api/user`
- `POST /register` — Register (userName, email, password, mobile?, whatsappNumber?)
- `POST /login` — Login
- `POST /admin` — Admin login
- `GET /refresh-token` — Refresh access token
- `POST /logout` — Logout
- `PUT /update-user` — Update profile
- `PUT /update-address` — Update address
- `PUT /update-password` — Change password
- `POST /forgot-password-token` — Request reset
- `PUT /reset-password/:token` — Reset password
- `POST /send-otp` — Send OTP (SMS/EMAIL)
- `POST /verify-otp` — Verify OTP
- `GET /all` — Get all users (admin)
- Cart: `add-cart`, `remove-cartitem`, `add-cart-quantity-increase`, `add-cart-quantity-decrease`
- Wishlist: `add-wishlist`, `remove-wishlist`, `get-wishlist`
- `POST /review` — Add rating/comment

### Products — `/api/product`
- `GET /` — All products
- `GET /:slug` — By slug
- `GET /tag/:tag` — By tag
- `GET /category/:category` — By category
- `GET /collection/:collectionName` — By collection
- `POST /createProduct` — Create (admin)
- `PUT /:id` — Update
- `PUT /stock-update/:id` — Update stock (admin)
- `DELETE /:id` — Delete (admin)

### Orders — `/api/order`
- `POST /create` — Create order
- `GET /user-order` — My orders
- `GET /my-subscriptions` — My subscriptions with credentials
- `POST /renew` — Request renewal
- `GET /all-orders` — All orders (admin)
- `PUT /status-update/:id` — Update status (admin)
- `PUT /assign-credentials/:id` — Assign credentials (admin)
- `PUT /mark-active/:id` — Mark active (admin)
- `PUT /mark-expired/:id` — Mark expired (admin)

### Coupons — `/api/coupon`
- `POST /validate` — Validate coupon
- `POST /create` — Create (admin)
- `GET /all` — All coupons (admin)
- `PUT /:id` — Update (admin)
- `DELETE /:id` — Delete (admin)

### Tickets — `/api/ticket`
- `POST /create` — Create ticket
- `GET /my-tickets` — My tickets
- `GET /:id` — Ticket detail
- `POST /:id/reply` — Customer reply
- `GET /admin/all` — All tickets (admin)
- `POST /admin/:id/reply` — Admin reply
- `PUT /admin/:id/status` — Update status (admin)

### Refunds — `/api/refund`
- `POST /request` — Request refund
- `GET /my-refunds` — My refunds
- `GET /admin/all` — All refunds (admin)
- `PUT /admin/:id` — Process refund (admin)

### Health — `/api/health`
- `GET /` — Health check (for uptime monitoring)

## Environment Variables
See `.env.example` for all required variables.

## Scripts
- `npm run dev` — Development server with nodemon
- `npm run build` — Compile TypeScript
- `npm start` — Start production server
- `npm run format` — Format code with Prettier

## License
ISC
