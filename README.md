# Student Expense Tracker Web Application

A clean, simple, full-stack Expense Tracker application designed for college projects.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router v6, Firebase Authentication (Google Sign-In)
- **Backend**: Python Flask, `mysql-connector-python`, Flask-CORS
- **Database**: MySQL

---

## Folder Structure

```
expense-tracker/
├── backend/
│   ├── app.py           # Main Flask API routes
│   ├── db.py            # MySQL database connection helper
│   ├── schema.sql       # Database table creation script
│   └── requirements.txt # Python dependencies
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx       # Layout header & React Router configuration
        ├── firebase.js   # Google Authentication setup
        └── pages/
            ├── Login.jsx        # Google Sign-In page
            ├── Dashboard.jsx    # Overview metrics & recent expenses
            ├── Expenses.jsx     # Expenses table view
            ├── ExpenseForm.jsx  # Add and Edit expense form page
            ├── Budgets.jsx      # Category budgets list view
            └── BudgetForm.jsx   # Add and Edit budget form page
```

---

## Setup & Running Instructions

### 1. Database Setup (MySQL)
Run the SQL script located in `backend/schema.sql` in your MySQL Workbench, phpMyAdmin, or MySQL CLI:

```sql
CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    profile_image TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### 2. Backend Setup (Flask API)

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```

2. (Optional) Create environment variables or edit `db.py` to match your MySQL password:
   - `DB_HOST`: `localhost`
   - `DB_USER`: `root`
   - `DB_PASSWORD`: `your_password`
   - `DB_NAME`: `expense_tracker`

3. Install requirements & start server:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```
   The Flask API will run on `http://127.0.0.1:5000`.

---

### 3. Frontend Setup (React + Vite)

1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies & start dev server:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Features
- **Google Sign-In & Logout** (with Firebase + demo mode fallback)
- **Dashboard**: Total Expenses, Total Budget, Remaining Budget, and Recent Expenses table.
- **Expenses**: View list, Add expense, Edit expense, Delete expense.
- **Budgets**: View list, Add category budget, Edit budget, Delete budget.
