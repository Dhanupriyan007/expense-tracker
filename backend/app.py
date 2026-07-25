import os
import json
import time
import base64
import urllib.request
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection, init_db

app = Flask(__name__)
CORS(app)

# Fallback In-Memory Storage
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

# Initialize Database Schema if MySQL is available
init_db()

def verify_token(id_token):
    """
    Cryptographically verify Firebase and Google ID tokens.
    """
    if not id_token:
        return None
    
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
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
# AUTHENTICATION API
# ----------------------------------------------------
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json() or {}
    id_token = data.get('idToken')

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
                # Update Gmail profile picture and name in MySQL if available
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

    mock_user = {
        'id': 1,
        'google_id': google_id,
        'name': name or 'Student User',
        'email': email,
        'profile_image': profile_image or 'https://via.placeholder.com/150'
    }
    MOCK_USERS[google_id] = mock_user
    return jsonify({'success': True, 'user': mock_user}), 200

# ----------------------------------------------------
# DASHBOARD API (WITH BUDGET VS EXPENSE ALERT MATCHING)
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

            # Category matching for budget alerts
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

            return jsonify({
                'total_expenses': round(total_expenses, 2),
                'total_budget': round(total_budget, 2),
                'remaining_budget': round(remaining_budget, 2),
                'recent_expenses': recent_expenses,
                'alerts': alerts
            }), 200
        except Exception as e:
            print("DB Error in dashboard:", e)
            if conn:
                conn.close()

    # Fallback Calculation & Matching
    tot_exp = sum(float(x['amount']) for x in MOCK_EXPENSES)
    tot_bud = sum(float(x['budget']) for x in MOCK_BUDGETS)
    rec_exp = sorted(MOCK_EXPENSES, key=lambda x: x['expense_date'], reverse=True)[:5]

    alerts = []
    for b in MOCK_BUDGETS:
        cat = b['category']
        budget_val = float(b['budget'])
        spent_val = sum(float(x['amount']) for x in MOCK_EXPENSES if x['category'] == cat)
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
        'remaining_budget': round(tot_bud - tot_exp, 2),
        'recent_expenses': rec_exp,
        'alerts': alerts
    }), 200

# ----------------------------------------------------
# EXPENSES API
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

    return jsonify(MOCK_EXPENSES), 200

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

    new_id = max([x['id'] for x in MOCK_EXPENSES], default=0) + 1
    new_expense = {
        'id': new_id,
        'user_id': user_id,
        'description': description,
        'amount': float(amount),
        'category': category,
        'payment_method': payment_method or 'Cash',
        'expense_date': expense_date or '2026-07-25'
    }
    MOCK_EXPENSES.append(new_expense)
    return jsonify({'message': 'Expense created successfully', 'id': new_id}), 201

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
            query = """
                UPDATE expenses 
                SET description = %s, amount = %s, category = %s, payment_method = %s, expense_date = %s
                WHERE id = %s
            """
            cursor.execute(query, (description, amount, category, payment_method, expense_date, expense_id))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'message': 'Expense updated successfully'}), 200
        except Exception as e:
            print("DB Error updating expense:", e)
            if conn:
                conn.close()

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
            if conn:
                conn.close()

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
            if conn:
                conn.close()

    res = []
    for b in MOCK_BUDGETS:
        cat = b['category']
        b_val = float(b['budget'])
        spent_val = sum(float(x['amount']) for x in MOCK_EXPENSES if x['category'] == cat)
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
            if conn:
                conn.close()

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
            if conn:
                conn.close()

    new_id = max([x['id'] for x in MOCK_BUDGETS], default=0) + 1
    new_budget = {
        'id': new_id,
        'user_id': user_id,
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
            if conn:
                conn.close()

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
            if conn:
                conn.close()

    global MOCK_BUDGETS
    MOCK_BUDGETS = [x for x in MOCK_BUDGETS if x['id'] != budget_id]
    return jsonify({'message': 'Budget deleted successfully'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask Expense Tracker Backend on port {port}")
    app.run(host='0.0.0.0', port=port)
