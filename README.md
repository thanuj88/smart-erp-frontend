# POSBright

**Retail POS, inventory, and installment credit in one store.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![i18next](https://img.shields.io/badge/i18n-EN%20SI%20ES%20IT%20FR%20DE-0A7EA4)](https://www.i18next.com/)
[![Repo](https://img.shields.io/badge/API-smart--erp--backend-181717?logo=github)](https://github.com/thanuj88/smart-erp-backend)

POSBright is the storefront for shops that sell **cash and credit**. Cashiers stay on a fast till. Owners get stock, collections, and profit views that tellers never see.

Pair this UI with [`smart-erp-backend`](https://github.com/thanuj88/smart-erp-backend).

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

Typical demo path on Bright Mart:

1. Owner opens **Customers** and finds installment people by phone.
2. Teller signs in to **POS**, types a local number, and sees the member name.
3. If that member has overdue payments, a warning appears **before** checkout.
4. Teller login has no Customers menu and no profit widgets.

---

## Stack

- **React 18** + Create React App
- **Bootstrap 5.3** and Bootstrap Icons
- **i18next** for chrome text (names, phones, and IDs stay as entered)
- **Axios** against `/api` on the backend

```
frontend/src
├── pages/          POS, dashboard, inventory, customers, reports
├── components/     Layout, sidebar, receipts, dialogs
├── locales/        en, si, es, it, fr, de
├── services/       API client
└── contexts/       Auth, theme, tenant settings
```

---

## Quick start

You need **Node.js 18+** and a running API on port `5000`.

```bash
git clone https://github.com/thanuj88/smart-erp-frontend.git
cd smart-erp-frontend
npm install
```

Create `.env` if you are not using the default API:

```
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

Demo store (after a fresh backend seed):

| Role | Email | Password |
| --- | --- | --- |
| Tenant admin | `admin@brightmart.local` | `admin123` |
| Teller | `teller@brightmart.local` | `teller123` |
| Manager | `manager@brightmart.local` | `manager123` |
| Accountant | `accountant@brightmart.local` | `accountant123` |

---

## Related

- API and DynamoDB Local: [thanuj88/smart-erp-backend](https://github.com/thanuj88/smart-erp-backend)
- Product: **POSBright** · store inventory and point of sale

<p align="center"><sub>Built for shops that sell on cash and on terms.</sub></p>
