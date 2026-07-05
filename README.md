# SmartERP — Billing, Inventory & Accounting System

> A TallyPrime-inspired ERP system built with **Spring Boot + Next.js + PostgreSQL**

---

## 📌 Introduction

**SmartERP** is a full-stack, browser-based accounting and inventory management system. It allows businesses to:

- Manage **Ledgers** (Customers, Suppliers, Bank & Cash)
- Manage **Stock Items** (Products with HSN codes, GST rates)
- Create **Sales Vouchers** (Customer invoices with auto-GST)
- Create **Purchase Vouchers** (Supplier bills with auto-GST)
- **Print** professional formatted invoices
- **Manage Companies** — create and switch between companies
- Navigate using **TallyPrime-style keyboard shortcuts** (F1–F11)

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.3, Spring Data JPA, Hibernate |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Database | PostgreSQL (prod) / H2 in-memory (dev) |
| Build | Maven (backend), npm (frontend) |
| API Docs | Swagger UI (/swagger-ui.html) |

---

## 🗂️ Project Structure

`
TallyPrime/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/smarterp/
│       ├── config/       → CorsConfig.java
│       ├── controller/   → Auth, Company, Ledger, StockItem, Voucher
│       ├── dto/          → Request/Response DTOs
│       ├── entity/       → JPA Entities
│       ├── repository/   → Spring Data JPA Repositories
│       ├── service/      → Business Logic
│       └── util/         → HashUtils (SHA-256 passwords)
└── frontend/
    ├── app/
    │   ├── page.tsx               ← Dashboard
    │   ├── login/                 ← Login page
    │   ├── ledgers/               ← Ledger Management
    │   ├── stock-items/           ← Stock Items
    │   └── vouchers/sales|purchase
    ├── components/layout/
    │   ├── AuthWrapper.tsx
    │   └── RightShortcutPanel.tsx
    └── lib/
        ├── api.ts
        └── types.ts
`

---

## 🚀 Run Commands

### Backend (H2 — no DB install needed)
`ash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
`
Runs at: http://localhost:8080
Swagger: http://localhost:8080/swagger-ui.html

### Backend (PostgreSQL)
`ash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/smarterp
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=yourpassword
cd backend && mvn spring-boot:run
`

### Frontend
`ash
cd frontend
npm install
npm run dev
`
Runs at: http://localhost:3000

---

## ☁️ Deployment on Railway

**Why Railway?**
- Free managed PostgreSQL
- Auto-deploy from GitHub (push to main = instant deploy)
- Environment variables UI
- Free subdomain

### Steps
1. Go to railway.app → New Project → Deploy from GitHub
2. Backend service: Root Dir = backend, add PostgreSQL plugin
3. Backend env vars:
   - SPRING_DATASOURCE_URL = ${{Postgres.DATABASE_URL}}
   - SPRING_DATASOURCE_USERNAME = ${{Postgres.PGUSER}}
   - SPRING_DATASOURCE_PASSWORD = ${{Postgres.PGPASSWORD}}
   - app.cors.allowed-origins = https://your-frontend.up.railway.app
4. Frontend service: Root Dir = frontend
5. Frontend env vars:
   - NEXT_PUBLIC_API_URL = https://your-backend.up.railway.app

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| Password Hashing | SHA-256 via HashUtils.java |
| Route Protection | AuthWrapper.tsx redirects to login |
| CORS | Only configured origin allowed (CorsConfig.java) |
| Input Validation | @Valid + @NotBlank on all backend DTOs |
| Error Handling | Global @ControllerAdvice — no stack traces |

**Production recommendations:**
- Replace SHA-256 with BCrypt
- Add Spring Security + JWT tokens
- Enable HTTPS (Railway handles this automatically)

---

## 📡 REST API Reference

Base URL: http://localhost:8080/api

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/login | Login |
| POST | /auth/register | Register |
| GET/POST | /ledgers | List / Create ledger |
| PUT/DELETE | /ledgers/{id} | Update / Delete ledger |
| GET/POST | /stock-items | List / Create stock item |
| PUT/DELETE | /stock-items/{id} | Update / Delete |
| GET/POST | /vouchers | List / Create voucher |
| GET/POST | /companies | List / Create company |

---

## 👤 Default Login

`
Email:    admin@smarterp.com
Password: admin123
`

---

## 🌿 Environment Variables

### Backend
| Variable | Default |
|---|---|
| SPRING_DATASOURCE_URL | jdbc:postgresql://localhost:5432/smarterp |
| SPRING_DATASOURCE_USERNAME | postgres |
| SPRING_DATASOURCE_PASSWORD | postgres |
| PORT | 8080 |
| app.cors.allowed-origins | http://localhost:3000 |

### Frontend
| Variable | Default |
|---|---|
| NEXT_PUBLIC_API_URL | http://localhost:8080 |
