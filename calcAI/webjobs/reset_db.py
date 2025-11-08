import sqlite3
import os

def reset_daily_nutrition():

    db_path = '/home/site/wwwroot/db/db.db'  # Adjust path if needed
    conn = sqlite3.connect(db_path)


    try:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE users
            SET calories = 0, protein_g = 0, carbs_g = 0, fat_g = 0;
        """)

        conn.commit()

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    reset_daily_nutrition()
