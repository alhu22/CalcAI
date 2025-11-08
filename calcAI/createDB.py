import sqlite3

conn = sqlite3.connect('db/db.db')
cursor = conn.cursor()

cursor.execute('''DROP TABLE IF EXISTS latestnutrition''')
cursor.execute('''
CREATE TABLE latestnutrition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calories INTEGER DEFAULT 0 NOT NULL,
    protein_g INTEGER DEFAULT 0 NOT NULL,
    carbs_g INTEGER DEFAULT 0 NOT NULL,
    fat_g INTEGER DEFAULT 0 NOT NULL
)
''')


cursor.execute('''DROP TABLE IF EXISTS users''')
cursor.execute('''
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    height_cm REAL NOT NULL,
    weight_kg REAL NOT NULL,
    activity_level TEXT NOT NULL,
    goal TEXT NOT NULL,
    dietary_preferences TEXT,
    training_frequency INTEGER NOT NULL,
    calories INTEGER DEFAULT 0 NOT NULL,
    protein_g INTEGER DEFAULT 0 NOT NULL,
    carbs_g INTEGER DEFAULT 0 NOT NULL,
    fat_g INTEGER DEFAULT 0 NOT NULL,
    calories_need INTEGER DEFAULT 0 NOT NULL,
    protein_need INTEGER DEFAULT 0 NOT NULL,
    carbs_need INTEGER DEFAULT 0 NOT NULL,
    fat_need INTEGER DEFAULT 0 NOT NULL,
    username TEXT,
    password TEXT
)
''')


# cursor.execute('''DROP TABLE IF EXISTS nutrition''')

conn.commit()
conn.close()