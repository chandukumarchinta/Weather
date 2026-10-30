# database.py
# pyrefly: ignore[missing-import]
import mysql.connector
from mysql.connector import Error
from config import Config

def init_db():
    """Ensure database and favorites table exist upon application startup."""
    try:
        conn = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}`")
        cursor.execute(f"USE `{Config.MYSQL_DB}`")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                city VARCHAR(100) NOT NULL,
                country VARCHAR(10) NOT NULL,
                nickname VARCHAR(100) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_city_country UNIQUE (city, country)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)
        conn.commit()

        # Seed initial favorites if empty to match overview screenshot
        cursor.execute("SELECT COUNT(*) FROM favorites")
        count = cursor.fetchone()[0]
        if count == 0:
            initial_data = [
                ("Vijayawada", "IN", "My City"),
                ("Hyderabad", "IN", None),
                ("Bengaluru", "IN", None),
                ("New Delhi", "IN", None),
                ("Mumbai", "IN", None)
            ]
            cursor.executemany("INSERT INTO favorites (city, country, nickname) VALUES (%s, %s, %s)", initial_data)
            conn.commit()
        cursor.close()
        conn.close()
    except Error as e:
        print(f"Database initialization error: {e}")

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None