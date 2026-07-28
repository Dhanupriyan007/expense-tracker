import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error, pooling

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "expense_tracker")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))

db_pool = None

def init_pool():
    global db_pool
    if db_pool is None:
        try:
            db_pool = pooling.MySQLConnectionPool(
                pool_name="expense_tracker_pool",
                pool_size=POOL_SIZE,
                pool_reset_session=True,
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                port=DB_PORT
            )
            print(f"MySQL Connection Pool created with {POOL_SIZE} connections.")
        except Error as e:
            print(f"Notice: MySQL Pool creation deferred ({e}).")
            db_pool = None

init_pool()

def get_db_connection():
    """Return a pooled MySQL database connection if available."""
    global db_pool
    if db_pool is None:
        init_pool()

    if db_pool is not None:
        try:
            connection = db_pool.get_connection()
            if connection and connection.is_connected():
                return connection
        except Error as e:
            print(f"Pool checkout notice: {e}")

    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        return connection if connection.is_connected() else None
    except Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None

def init_db():
    """Initialize database and create schema tables."""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )

        cursor = connection.cursor()

        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
        cursor.execute(f"USE `{DB_NAME}`")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                google_id VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                profile_image TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                description VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                payment_method VARCHAR(100) NOT NULL,
                expense_date DATE NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category VARCHAR(100) NOT NULL,
                budget DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        connection.commit()
        cursor.close()
        connection.close()

        print("MySQL database initialized successfully.")
        init_pool()

    except Error as e:
        print(f"MySQL initialization failed: {e}")