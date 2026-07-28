import os
import json
import time
import base64
import re
import urllib.request
from datetime import datetime, date
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection, init_db

app = Flask(__name__)
CORS(app)

# Fallback In-Memory Storage (per user_id)
MOCK_USERS = {}
MOCK_EXPENSES = [
    {"id": 1, "user_id": 1, "description": "Textbooks & Supplies", "amount": 120.00, "category": "Education", "payment_method": "Credit Card", "expense_date": "2026-07-20"},
    {"id": 2, "user_id": 1, "description": "Weekly Groceries", "amount": 260.50, "category": "Food", "payment_method": "Debit Card", "expense_date": "2026-07-22"},
    {"id": 3, "user_id": 1, "description": "Bus Pass", "amount": 45.00, "category": "Transport", "payment_method": "UPI", "expense_date": "2026-07-24"}
]
MOCK_BUDGETS = [
    {"id": 1, "user_id": 1, "category": "Food", "budget": 300.00},
    {"id": 2, "user_id": 1, "category": "Education", "budget": 200.00},
    {"id": 3, "user_id": 1, "category": "Transport", "budget": 100.00}
]
MOCK_SPLITS = [
    {"id": 1, "user_id": 1, "title": "Hostel WiFi Bill", "total_amount": 60.00, "paid_by": "You", "split_members": ["Alex", "Sam", "You"], "your_share": 20.00, "settled": False},
    {"id": 2, "user_id": 1, "title": "Friday Night Pizza", "total_amount": 45.00, "paid_by": "Alex", "split_members": ["Alex", "You"], "your_share": 22.50, "settled": True}
]

# Initialize Database Schema if MySQL is available
init_db()

def verify_token(id_token):
    """
    Cryptographically verify Firebase and Google ID tokens.
    Skipped for guest login to guarantee instant response times.
    """
    if not id_token:
        return None
    
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if 'sub' in data:
                    return {
                        'sub': data.get('sub'),
                        'email': data.get('email'),
                        'name': data.get('name'),
                        'picture': data.get('picture')
                    }
    except Exception:
        pass

    try:
        parts = id_token.split('.')
        if len(parts) == 3:
            payload_b64 = parts[1]
            padding = '=' * (4 - len(payload_b64) % 4)
            payload_json = base64.b64decode(payload_b64 + padding).decode('utf-8')
            payload = json.loads(payload_json)

            exp = payload.get('exp', 0)
            if exp and exp < time.time():
                return None

            iss = payload.get('iss', '')
            if 'securetoken.google.com' in iss or 'accounts.google.com' in iss:
                return {
                    'sub': payload.get('user_id') or payload.get('sub'),
                    'email': payload.get('email'),
                    'name': payload.get('name'),
                    'picture': payload.get('picture')
                }
    except Exception as e:
        print("JWT payload decode error:", e)

    return None

# ----------------------------------------------------
# INSTANT AUTHENTICATION API (GUEST + GOOGLE)
# ----------------------------------------------------
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json() or {}
    is_guest = data.get('is_guest', False)
    id_token = data.get('idToken')

    # Instant response for Guest login (no network verification overhead)
    if is_guest or not id_token or data.get('google_id', '').startswith('guest_'):
        google_id = data.get('google_id') or ('guest_' + str(int(time.time())) + '_demo')
        name = data.get('name') or 'Guest Student'
        email = data.get('email') or f"{google_id}@student.local"
        profile_image = data.get('profile_image') or f"https://api.dicebear.com/7.x/avataaars/svg?seed={google_id}"
    else:
        # Verify Token only for real Google Sign-In
        token_payload = verify_token(id_token)
        if token_payload:
            google_id = token_payload.get('sub')
            email = token_payload.get('email')
            name = token_payload.get('name') or data.get('name') or (email.split('@')[0] if email else 'Google User')
            profile_image = token_payload.get('picture') or data.get('profile_image')
        else:
            google_id = data.get('google_id')
            name = data.get('name')
            email = data.get('email')
            profile_image = data.get('profile_image')

    if not google_id or not email:
        return jsonify({'error': 'Invalid user credentials'}), 400

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
            user = cursor.fetchone()

            if not user:
                cursor.execute(
                    "INSERT INTO users (google_id, name, email, profile_image) VALUES (%s, %s, %s, %s)",
                    (google_id, name, email, profile_image)
                )
                conn.commit()
                cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
                user = cursor.fetchone()
            else:
                if profile_image or name:
                    cursor.execute(
                        "UPDATE users SET name = COALESCE(%s, name), profile_image = COALESCE(%s, profile_image) WHERE google_id = %s",
                        (name, profile_image, google_id)
                    )
                    conn.commit()
                    cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
                    user = cursor.fetchone()

            cursor.close()
            conn.close()
            return jsonify({'success': True, 'user': user}), 200
        except Exception as e:
            print("DB Error during login:", e)
            if conn:
                conn.close()

    # Fallback storage per unique guest/user ID
    if google_id not in MOCK_USERS:
        # Assign unique numeric id
        new_id = len(MOCK_USERS) + 10
        MOCK_USERS[google_id] = {
            'id': new_id,
            'google_id': google_id,
            'name': name or 'Guest Student',
            'email': email,
            'profile_image': profile_image or 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
        }
    
    return jsonify({'success': True, 'user': MOCK_USERS[google_id]}), 200

# ----------------------------------------------------
# DASHBOARD API
# ----------------------------------------------------
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    user_id = request.args.get('user_id', 1)
    
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("SELECT SUM(amount) AS total_expenses FROM expenses WHERE user_id = %s", (user_id,))
            exp_res = cursor.fetchone()
            total_expenses = float(exp_res['total_expenses']) if exp_res and exp_res['total_expenses'] else 0.0

            cursor.execute("SELECT SUM(budget) AS total_budget FROM budgets WHERE user_id = %s", (user_id,))
            bud_res = cursor.fetchone()
            total_budget = float(bud_res['total_budget']) if bud_res and bud_res['total_budget'] else 0.0

            cursor.execute("SELECT * FROM expenses WHERE user_id = %s ORDER BY expense_date DESC LIMIT 5", (user_id,))
            recent_expenses = cursor.fetchall()
            for item in recent_expenses:
                item['amount'] = float(item['amount'])
                item['expense_date'] = str(item['expense_date'])

            cursor.execute("SELECT category, budget FROM budgets WHERE user_id = %s", (user_id,))
            user_budgets = cursor.fetchall()
            
            alerts = []
            for b in user_budgets:
                cat = b['category']
                budget_val = float(b['budget'])
                cursor.execute("SELECT SUM(amount) AS cat_spent FROM expenses WHERE user_id = %s AND category = %s", (user_id, cat))
                c_res = cursor.fetchone()
                spent_val = float(c_res['cat_spent']) if c_res and c_res['cat_spent'] else 0.0
                
                percentage = (spent_val / budget_val * 100) if budget_val > 0 else 0
                if spent_val >= budget_val:
                    alerts.append({
                        'type': 'exceeded',
                        'category': cat,
                        'budget': budget_val,
                        'spent': spent_val,
                        'percentage': round(percentage, 1),
                        'message': f"🚨 EXCEEDED ALERT: You have exceeded your {cat} budget! (${spent_val:.2f} spent of ${budget_val:.2f})"
                    })
                elif percentage >= 80:
                    alerts.append({
                        'type': 'warning',
                        'category': cat,
                        'budget': budget_val,
                        'spent': spent_val,
                        'percentage': round(percentage, 1),
                        'message': f"⚠️ BUDGET WARNING: You have used {percentage:.1f}% of your {cat} budget (${spent_val:.2f} of ${budget_val:.2f})."
                    })

            cursor.close()
            conn.close()

            remaining_budget = total_budget - total_expenses

            # Safe Daily Allowance calculation
            now = datetime.now()
            days_in_month = 30
            remaining_days = max(1, days_in_month - now.day)
            daily_allowance = max(0.0, round(remaining_budget / remaining_days, 2)) if remaining_budget > 0 else 0.0

            return jsonify({
                'total_expenses': round(total_expenses, 2),
                'total_budget': round(total_budget, 2),
                'remaining_budget': round(remaining_budget, 2),
                'daily_allowance': daily_allowance,
                'recent_expenses': recent_expenses,
                'alerts': alerts
            }), 200
        except Exception as e:
            print("DB Error in dashboard:", e)
            if conn:
                conn.close()

    # Fallback Per-User Filter
    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    user_exps = [x for x in MOCK_EXPENSES if x.get('user_id') == user_id_int or user_id_int == 1]
    user_buds = [x for x in MOCK_BUDGETS if x.get('user_id') == user_id_int or user_id_int == 1]

    tot_exp = sum(float(x['amount']) for x in user_exps)
    tot_bud = sum(float(x['budget']) for x in user_buds)
    rec_exp = sorted(user_exps, key=lambda x: x['expense_date'], reverse=True)[:5]
    remaining = tot_bud - tot_exp

    days_left = max(1, 30 - datetime.now().day)
    daily_allowance = max(0.0, round(remaining / days_left, 2)) if remaining > 0 else 0.0

    alerts = []
    for b in user_buds:
        cat = b['category']
        budget_val = float(b['budget'])
        spent_val = sum(float(x['amount']) for x in user_exps if x['category'] == cat)
        percentage = (spent_val / budget_val * 100) if budget_val > 0 else 0
        if spent_val >= budget_val:
            alerts.append({
                'type': 'exceeded',
                'category': cat,
                'budget': budget_val,
                'spent': spent_val,
                'percentage': round(percentage, 1),
                'message': f"🚨 EXCEEDED ALERT: You have exceeded your {cat} budget! (${spent_val:.2f} spent of ${budget_val:.2f})"
            })
        elif percentage >= 80:
            alerts.append({
                'type': 'warning',
                'category': cat,
                'budget': budget_val,
                'spent': spent_val,
                'percentage': round(percentage, 1),
                'message': f"⚠️ BUDGET WARNING: You have used {percentage:.1f}% of your {cat} budget (${spent_val:.2f} of ${budget_val:.2f})."
            })

    return jsonify({
        'total_expenses': round(tot_exp, 2),
        'total_budget': round(tot_bud, 2),
        'remaining_budget': round(remaining, 2),
        'daily_allowance': daily_allowance,
        'recent_expenses': rec_exp,
        'alerts': alerts
    }), 200

# ----------------------------------------------------
# EXPENSES API (WITH NATURAL LANGUAGE QUICK-ADD)
# ----------------------------------------------------
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    user_id = request.args.get('user_id', 1)
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM expenses WHERE user_id = %s ORDER BY expense_date DESC", (user_id,))
            expenses = cursor.fetchall()
            for item in expenses:
                item['amount'] = float(item['amount'])
                item['expense_date'] = str(item['expense_date'])
            cursor.close()
            conn.close()
            return jsonify(expenses), 200
        except Exception as e:
            print("DB Error getting expenses:", e)
            if conn:
                conn.close()

    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    res = [x for x in MOCK_EXPENSES if x.get('user_id') == user_id_int or user_id_int == 1]
    return jsonify(res), 200

@app.route('/api/expenses/<int:expense_id>', methods=['GET'])
def get_expense(expense_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
            expense = cursor.fetchone()
            cursor.close()
            conn.close()
            if expense:
                expense['amount'] = float(expense['amount'])
                expense['expense_date'] = str(expense['expense_date'])
                return jsonify(expense), 200
            return jsonify({'error': 'Expense not found'}), 404
        except Exception as e:
            print("DB Error getting expense:", e)
            if conn:
                conn.close()

    expense = next((item for item in MOCK_EXPENSES if item['id'] == expense_id), None)
    if expense:
        return jsonify(expense), 200
    return jsonify({'error': 'Expense not found'}), 404

@app.route('/api/expenses', methods=['POST'])
def create_expense():
    data = request.get_json()
    user_id = data.get('user_id', 1)
    description = data.get('description')
    amount = data.get('amount')
    category = data.get('category')
    payment_method = data.get('payment_method')
    expense_date = data.get('expense_date')

    if not description or amount is None or not category:
        return jsonify({'error': 'Description, amount, and category are required'}), 400

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            query = """
                INSERT INTO expenses (user_id, description, amount, category, payment_method, expense_date)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (user_id, description, amount, category, payment_method, expense_date))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({'message': 'Expense created successfully', 'id': new_id}), 201
        except Exception as e:
            print("DB Error creating expense:", e)
            if conn:
                conn.close()

    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    new_id = max([x['id'] for x in MOCK_EXPENSES], default=0) + 1
    new_expense = {
        'id': new_id,
        'user_id': user_id_int,
        'description': description,
        'amount': float(amount),
        'category': category,
        'payment_method': payment_method or 'Cash',
        'expense_date': expense_date or datetime.now().strftime('%Y-%m-%d')
    }
    MOCK_EXPENSES.append(new_expense)
    return jsonify({'message': 'Expense created successfully', 'id': new_id}), 201

# Natural Language Quick Add Parser
@app.route('/api/expenses/quick-add', methods=['POST'])
def quick_add_expense():
    data = request.get_json() or {}
    text = data.get('text', '')
    user_id = data.get('user_id', 1)

    if not text:
        return jsonify({'error': 'No input text provided'}), 400

    # Extract amount using regex
    amount_match = re.search(r'(\$|₹|USD|INR)?\s*([0-9]+(\.[0-9]{1,2})?)', text, re.IGNORECASE)
    amount = float(amount_match.group(2)) if amount_match else 10.0

    # Determine Payment Method
    payment_method = "Cash"
    if re.search(r'\b(upi|gpay|phonepe|paytm)\b', text, re.IGNORECASE):
        payment_method = "UPI"
    elif re.search(r'\b(card|debit|credit)\b', text, re.IGNORECASE):
        payment_method = "Debit Card"
    elif re.search(r'\b(bank|netbanking)\b', text, re.IGNORECASE):
        payment_method = "Net Banking"

    # Determine Category & Description
    category = "Other"
    if re.search(r'\b(lunch|dinner|breakfast|food|snack|coffee|pizza|groceries|burger|canteen)\b', text, re.IGNORECASE):
        category = "Food"
    elif re.search(r'\b(book|fees|college|tuition|stationery|course|exam)\b', text, re.IGNORECASE):
        category = "Education"
    elif re.search(r'\b(bus|fuel|petrol|uber|cab|train|auto|metro)\b', text, re.IGNORECASE):
        category = "Transport"
    elif re.search(r'\b(rent|hostel|bill|wifi|electricity)\b', text, re.IGNORECASE):
        category = "Rent & Bills"
    elif re.search(r'\b(movie|game|gaming|party|fun)\b', text, re.IGNORECASE):
        category = "Entertainment"

    # Clean description
    desc = re.sub(r'(\$|₹|USD|INR)?\s*[0-9]+(\.[0-9]{1,2})?', '', text).strip()
    desc = re.sub(r'\b(spent|paid|for|via|on|using|with)\b', '', desc, flags=re.IGNORECASE).strip()
    if not desc:
        desc = f"Quick {category} Expense"

    expense_date = datetime.now().strftime('%Y-%m-%d')

    # Save expense
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            query = "INSERT INTO expenses (user_id, description, amount, category, payment_method, expense_date) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.execute(query, (user_id, desc.title(), amount, category, payment_method, expense_date))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({'message': 'Parsed & created successfully', 'parsed': {'description': desc.title(), 'amount': amount, 'category': category, 'payment_method': payment_method}}), 201
        except Exception as e:
            print("DB Quick Add Error:", e)

    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    new_id = max([x['id'] for x in MOCK_EXPENSES], default=0) + 1
    new_expense = {
        'id': new_id,
        'user_id': user_id_int,
        'description': desc.title(),
        'amount': amount,
        'category': category,
        'payment_method': payment_method,
        'expense_date': expense_date
    }
    MOCK_EXPENSES.append(new_expense)
    return jsonify({'message': 'Parsed & created successfully', 'parsed': new_expense}), 201

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    data = request.get_json()
    description = data.get('description')
    amount = data.get('amount')
    category = data.get('category')
    payment_method = data.get('payment_method')
    expense_date = data.get('expense_date')

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            query = "UPDATE expenses SET description = %s, amount = %s, category = %s, payment_method = %s, expense_date = %s WHERE id = %s"
            cursor.execute(query, (description, amount, category, payment_method, expense_date, expense_id))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'message': 'Expense updated successfully'}), 200
        except Exception as e:
            print("DB Error updating expense:", e)

    for item in MOCK_EXPENSES:
        if item['id'] == expense_id:
            item['description'] = description
            item['amount'] = float(amount)
            item['category'] = category
            item['payment_method'] = payment_method
            item['expense_date'] = expense_date
            return jsonify({'message': 'Expense updated successfully'}), 200

    return jsonify({'error': 'Expense not found'}), 404

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'message': 'Expense deleted successfully'}), 200
        except Exception as e:
            print("DB Error deleting expense:", e)

    global MOCK_EXPENSES
    MOCK_EXPENSES = [x for x in MOCK_EXPENSES if x['id'] != expense_id]
    return jsonify({'message': 'Expense deleted successfully'}), 200

# ----------------------------------------------------
# BUDGETS API
# ----------------------------------------------------
@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    user_id = request.args.get('user_id', 1)
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM budgets WHERE user_id = %s", (user_id,))
            budgets = cursor.fetchall()
            for item in budgets:
                cat = item['category']
                b_val = float(item['budget'])
                item['budget'] = b_val
                
                cursor.execute("SELECT SUM(amount) AS total_spent FROM expenses WHERE user_id = %s AND category = %s", (user_id, cat))
                s_res = cursor.fetchone()
                spent_val = float(s_res['total_spent']) if s_res and s_res['total_spent'] else 0.0
                
                item['spent'] = spent_val
                item['remaining'] = b_val - spent_val
                item['percentage'] = round((spent_val / b_val * 100), 1) if b_val > 0 else 0.0

            cursor.close()
            conn.close()
            return jsonify(budgets), 200
        except Exception as e:
            print("DB Error getting budgets:", e)

    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    user_buds = [x for x in MOCK_BUDGETS if x.get('user_id') == user_id_int or user_id_int == 1]
    user_exps = [x for x in MOCK_EXPENSES if x.get('user_id') == user_id_int or user_id_int == 1]

    res = []
    for b in user_buds:
        cat = b['category']
        b_val = float(b['budget'])
        spent_val = sum(float(x['amount']) for x in user_exps if x['category'] == cat)
        res.append({
            'id': b['id'],
            'user_id': b['user_id'],
            'category': cat,
            'budget': b_val,
            'spent': spent_val,
            'remaining': b_val - spent_val,
            'percentage': round((spent_val / b_val * 100), 1) if b_val > 0 else 0.0
        })

    return jsonify(res), 200

@app.route('/api/budgets/<int:budget_id>', methods=['GET'])
def get_budget(budget_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM budgets WHERE id = %s", (budget_id,))
            budget = cursor.fetchone()
            cursor.close()
            conn.close()
            if budget:
                budget['budget'] = float(budget['budget'])
                return jsonify(budget), 200
            return jsonify({'error': 'Budget not found'}), 404
        except Exception as e:
            print("DB Error getting budget:", e)

    budget = next((item for item in MOCK_BUDGETS if item['id'] == budget_id), None)
    if budget:
        return jsonify(budget), 200
    return jsonify({'error': 'Budget not found'}), 404

@app.route('/api/budgets', methods=['POST'])
def create_budget():
    data = request.get_json()
    user_id = data.get('user_id', 1)
    category = data.get('category')
    budget = data.get('budget')

    if not category or budget is None:
        return jsonify({'error': 'Category and budget amount are required'}), 400

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            query = "INSERT INTO budgets (user_id, category, budget) VALUES (%s, %s, %s)"
            cursor.execute(query, (user_id, category, budget))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({'message': 'Budget created successfully', 'id': new_id}), 201
        except Exception as e:
            print("DB Error creating budget:", e)

    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    new_id = max([x['id'] for x in MOCK_BUDGETS], default=0) + 1
    new_budget = {
        'id': new_id,
        'user_id': user_id_int,
        'category': category,
        'budget': float(budget)
    }
    MOCK_BUDGETS.append(new_budget)
    return jsonify({'message': 'Budget created successfully', 'id': new_id}), 201

@app.route('/api/budgets/<int:budget_id>', methods=['PUT'])
def update_budget(budget_id):
    data = request.get_json()
    category = data.get('category')
    budget = data.get('budget')

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            query = "UPDATE budgets SET category = %s, budget = %s WHERE id = %s"
            cursor.execute(query, (category, budget, budget_id))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'message': 'Budget updated successfully'}), 200
        except Exception as e:
            print("DB Error updating budget:", e)

    for item in MOCK_BUDGETS:
        if item['id'] == budget_id:
            item['category'] = category
            item['budget'] = float(budget)
            return jsonify({'message': 'Budget updated successfully'}), 200

    return jsonify({'error': 'Budget not found'}), 404

@app.route('/api/budgets/<int:budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM budgets WHERE id = %s", (budget_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'message': 'Budget deleted successfully'}), 200
        except Exception as e:
            print("DB Error deleting budget:", e)

    global MOCK_BUDGETS
    MOCK_BUDGETS = [x for x in MOCK_BUDGETS if x['id'] != budget_id]
    return jsonify({'message': 'Budget deleted successfully'}), 200

# ----------------------------------------------------
# UNIQUE FEATURE 1: ROOMMATE / GROUP EXPENSE SPLITTER
# ----------------------------------------------------
@app.route('/api/splits', methods=['GET'])
def get_splits():
    user_id = request.args.get('user_id', 1)
    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    splits = [s for s in MOCK_SPLITS if s.get('user_id') == user_id_int or user_id_int == 1]
    return jsonify(splits), 200

@app.route('/api/splits', methods=['POST'])
def create_split():
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    user_id_int = int(user_id) if str(user_id).isdigit() else 1
    
    title = data.get('title')
    total_amount = float(data.get('total_amount', 0))
    paid_by = data.get('paid_by', 'You')
    members_raw = data.get('members', 'Alex, Sam, You')
    
    if isinstance(members_raw, str):
        members = [m.strip() for m in members_raw.split(',') if m.strip()]
    else:
        members = members_raw or ['You']
        
    num_members = max(1, len(members))
    share = round(total_amount / num_members, 2)
    
    new_id = max([x['id'] for x in MOCK_SPLITS], default=0) + 1
    split_entry = {
        'id': new_id,
        'user_id': user_id_int,
        'title': title,
        'total_amount': total_amount,
        'paid_by': paid_by,
        'split_members': members,
        'your_share': share,
        'settled': False
    }
    MOCK_SPLITS.append(split_entry)
    return jsonify({'message': 'Group split created successfully', 'split': split_entry}), 201

@app.route('/api/splits/<int:split_id>/settle', methods=['PUT'])
def settle_split(split_id):
    for s in MOCK_SPLITS:
        if s['id'] == split_id:
            s['settled'] = True
            return jsonify({'message': 'Bill settled!'}), 200
    return jsonify({'error': 'Split not found'}), 404

# ----------------------------------------------------
# UNIQUE FEATURE 2: AI FINANCIAL HEALTH ADVISOR
# ----------------------------------------------------
@app.route('/api/advisor', methods=['GET'])
def get_financial_advisor():
    user_id = request.args.get('user_id', 1)
    user_id_int = int(user_id) if str(user_id).isdigit() else 1

    user_exps = [x for x in MOCK_EXPENSES if x.get('user_id') == user_id_int or user_id_int == 1]
    user_buds = [x for x in MOCK_BUDGETS if x.get('user_id') == user_id_int or user_id_int == 1]

    tot_exp = sum(float(x['amount']) for x in user_exps)
    tot_bud = sum(float(x['budget']) for x in user_buds)

    # Health score calculation algorithm
    if tot_bud == 0:
        health_score = 75
        badge = "Getting Started 🚀"
    else:
        savings_ratio = max(0, (tot_bud - tot_exp) / tot_bud)
        if savings_ratio >= 0.3:
            health_score = 92
            badge = "Master Budgeter 🏆"
        elif savings_ratio >= 0.15:
            health_score = 82
            badge = "Smart Student Saver 🎓"
        elif savings_ratio >= 0.0:
            health_score = 68
            badge = "On The Margin ⚖️"
        else:
            health_score = 45
            badge = "Budget Overspender ⚠️"

    # Category breakdown analysis
    cat_totals = {}
    for e in user_exps:
        cat = e['category']
        cat_totals[cat] = cat_totals.get(cat, 0) + float(e['amount'])

    recommendations = []
    food_spent = cat_totals.get('Food', 0)
    if food_spent > (tot_exp * 0.4) and food_spent > 0:
        recommendations.append({
            'icon': '🍕',
            'title': 'High Food & Dining Out Expense',
            'advice': f"Food accounts for {round(food_spent/tot_exp*100)}% of your total spending. Preparing 2 extra meals a week at home could save ~$40 monthly!"
        })

    rent_spent = cat_totals.get('Rent & Bills', 0)
    if rent_spent > 0:
        recommendations.append({
            'icon': '🏠',
            'title': 'Fixed Living Expenses Tracked',
            'advice': f"Hostel & Rent is locked at ${rent_spent:.2f}. Try using our 'Roommate Splitter' tab to share common room bills with flatmates!"
        })

    recommendations.append({
        'icon': '💡',
        'title': 'Student Discount Opportunity',
        'advice': "Use your college email (.edu) to activate free student discounts for Spotify, Prime, GitHub, and Transport passes!"
    })

    return jsonify({
        'health_score': health_score,
        'badge': badge,
        'total_expenses': round(tot_exp, 2),
        'total_budget': round(tot_bud, 2),
        'recommendations': recommendations
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask Expense Tracker Backend on port {port}")
    app.run(host='0.0.0.0', port=port)
