# POSBright

**Retail POS, inventory, and installment credit in one store.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![i18next](https://img.shields.io/badge/i18n-EN%20SI%20ES%20IT%20FR%20DE-0A7EA4)](https://www.i18next.com/)
[![Repo](https://img.shields.io/badge/API-smart--erp--backend-181717?logo=github)](https://github.com/thanuj88/smart-erp-backend)

POSBright is the storefront for shops that sell **cash and credit**. Cashiers stay on a fast till. Owners get stock, collections, and profit views that tellers never see.

Pair this UI with [`smart-erp-backend`](https://github.com/thanuj88/smart-erp-backend). The phone app in the same product family talks to that same API.

---

## Highlights

| POS register | Back office | Multi-tenant |
| --- | --- | --- |
| Compact product grid, no paging on the till | Inventory, categories, promotions | Store branding and currency |
| Cash checkout in a few taps | Sales reports without leaking margin | EN, SI, ES, IT, FR, DE |
| Member lookup by **local phone** | Customer list with open plans | Owner, manager, accountant, teller |
| Overdue warning before billing | Installment plans and collections | Dark and light theme |

Cash walk-ins stay unnamed. Named members are registered in **Customers** and matched at the register by phone (no country code).

---

## Screens

| Area | Routes |
| --- | --- |
| Sign-in | Login, register, email verify, forgot and reset password |
| Till | `/sell` — product grid, member lookup, cash and installment checkout, receipt |
| Shop | Dashboard, inventory, categories, promotions, sales reports |
| People | Users, customers, installment plans, installment payments |
| Store | Settings (branding, receipt, currency) |
| Platform | Tenants, plans, roles, capabilities, users, reports (super admin) |

A teller lands on the till. A tenant owner lands on the dashboard. A super admin lands on the platform console.

---

## Stack

- **React 18** + Create React App (`react-scripts` 5)
- **React Router 6**
- **Bootstrap 5.3** and Bootstrap Icons
- **i18next** for chrome text (names, phones, and IDs stay as entered)
- **Axios** against `/api` on the backend

```
src
├── pages/          POS, dashboard, inventory, customers, reports, platform
├── components/     Layout, sidebar, receipts, dialogs
├── locales/        en, si, es, it, fr, de
├── services/       API client
├── contexts/       Auth, theme, tenant settings
└── utils/          Money, phone, receipt, promotions
```

---

## Quick start

You need **Node.js 18+** and a running API on port `5000`. See the backend README to start DynamoDB Local and the API first.

```bash
git clone https://github.com/thanuj88/smart-erp-frontend.git
cd smart-erp-frontend
npm install
copy .env.example .env
npm start
```

On macOS or Linux, use `cp .env.example .env`.

The app opens at [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Purpose |
| --- | --- |
| `REACT_APP_API_URL` | API base, default `http://localhost:5000/api` |
| `REACT_APP_RECAPTCHA_SITE_KEY` | reCAPTCHA v2 site key. Leave empty in local development |

### Demo store

After a fresh backend seed:

| Role | Email | Password |
| --- | --- | --- |
| Tenant admin | `admin@brightmart.local` | `admin123` |
| Teller | `teller@brightmart.local` | `teller123` |
| Manager | `manager@brightmart.local` | `manager123` |
| Accountant | `accountant@brightmart.local` | `accountant123` |

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Development server on port 3000 |
| `npm run build` | Production build in `build/` |
| `npm test` | Jest via Create React App |

---

## Related

- API and DynamoDB Local: [thanuj88/smart-erp-backend](https://github.com/thanuj88/smart-erp-backend)
- Product: **POSBright** · store inventory and point of sale

<p align="center"><sub>Built for shops that sell on cash and on terms.</sub></p>
