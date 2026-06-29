# SmartERP — TallyPrime-Inspired Cloud ERP System

SmartERP is a modern, web-based Enterprise Resource Planning (ERP) platform designed for accounting, inventory management, billing, and financial reporting. Inspired by the interface and conventions of **TallyPrime**, it focuses on a keyboard-first workflow that allows users to navigate the system without a mouse.

---

##  Technology Stack

### Frontend:
* **Next.js 16** (App Router & Turbopack)
* **React 19**
* **TypeScript**
* **Tailwind CSS** (for styling)
* **Axios** (API integration)
* **Lucide React** (icons)

### Backend:
* **Java 17**
* **Spring Boot 3**
* **Spring Data JPA** (Hibernate)
* **PostgreSQL** (default production database)
* **H2 Database** (in-memory database fallback for easy local runs)
* **Lombok** (boiled-plate code reducer)

---

##  Core Features

1. **Keyboard-Only Navigation**: Fully supports standard TallyPrime shortcuts:
   * `F1` = Select Company
   * `F2` = Date/Period configuration
   * `F3` = Company Information
   * `F4` = Floating Calculator Popover
   * `F5`/`F6`/`F7` = Payment, Receipt, and Journal Vouchers
   * `F8`/`F9` = Sales and Purchase Vouchers
   * `F10`/`F11` = Credit Note and Debit Note Vouchers
   * `Alt + L` = Ledgers Master
   * `Alt + S` = Stock Items Master
   * `Ctrl + H` = Return to Gateway Dashboard
   * `Ctrl + Q` = Logout
   * `Ctrl + K` = Command Palette Search
   * `Esc` = Go Back / Close Modal
2. **Masters Management**: Detailed Customer and Supplier ledger registries, and stock inventory master registry.
3. **Dynamic Vouchers Registry**: Automated voucher numbering, double-entry balance adjustment, and live quantity calculations.
4. **Live Financial Reports**:
   * **Balance Sheet** (Assets vs Liabilities)
   * **Profit & Loss** (Revenues vs COGS)
   * **Trial Balance** (Double-entry check)
   * **GST Filing Reports** (Output vs Input GST)
   * **Stock Summary**
5. **Interactive Search Command Palette (`Ctrl+K`)**: Fuzzy search and instantly jump to any section.

---

##  How to Run the Project Locally

### 1. Start the Backend (Port 8080)
To run the backend instantly without setting up PostgreSQL, you can use the built-in H2 fallback profile:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

### 2. Start the Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

