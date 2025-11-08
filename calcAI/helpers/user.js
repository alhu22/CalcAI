const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open database connection (adjust path as needed)
const db = new sqlite3.Database(path.resolve(__dirname, '../db/db.db'));

/**
 * Fetch user info by user ID
 * @param {number} userId
 * @returns {Promise<object>} user info object
 */
function getUserById(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, name, age, gender, height_cm, weight_kg, activity_level, goal, dietary_preferences, training_frequency, calories, protein_g, carbs_g, fat_g, calories_need, protein_need, carbs_need, fat_need
      FROM users
      WHERE id = ?
    `;

    db.get(query, [userId], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

function calculateNutrition(user) {
  // 1. Calculate BMR using Mifflin-St Jeor
  const weight = user.weight_kg;
  const height = user.height_cm;
  const age = user.age;
  const gender = user.gender.toLowerCase();

  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    // fallback average if gender unknown
    bmr = 10 * weight + 6.25 * height - 5 * age;
  }

  // 2. Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9
  };

  const activityLevel = user.activity_level.toLowerCase();
  const activityMultiplier = activityMultipliers[activityLevel] || 1.55;

  let tdee = bmr * activityMultiplier;

  // 3. Adjust calories based on goal
  switch (user.goal) {
    case 'lose_fat':
      tdee *= 0.85; // 15% calorie deficit
      break;
    case 'build_muscle':
      tdee *= 1.15; // 15% surplus
      break;
    case 'maintain':
      // no change
      break;
    case 'endurance':
      tdee *= 1.1; // slight surplus for endurance training
      break;
    default:
      break;
  }

  // 4. Macronutrient ratios (percent of calories)
  // Protein: 1.8g per kg body weight (can a
  // djust per goal)
  // Fat: ~25% of calories
  // Carbs: remainder of calories

  const proteinPerKg = 1.8;
  const protein_g = weight * proteinPerKg;
  const proteinCalories = protein_g * 4;

  const fatCalories = tdee * 0.25;
  const fat_g = fatCalories / 9;

  const carbsCalories = tdee - (proteinCalories + fatCalories);
  const carbs_g = carbsCalories / 4;

  return {
    calories_need: Math.round(tdee),
    protein_need: Math.round(protein_g),
    fat_need: Math.round(fat_g),
    carbs_need: Math.round(carbs_g)
  };
}

function updateUserProfile(data, userId) {
  const {calories_need, protein_need, carbs_need, fat_need} = calculateNutrition(data);
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE users SET
        name = ?,
        age = ?,
        gender = ?,
        height_cm = ?,
        weight_kg = ?,
        activity_level = ?,
        goal = ?,
        dietary_preferences = ?,
        training_frequency = ?,
        calories = ?,
        protein_g = ?,
        carbs_g = ?,
        fat_g = ?,
        calories_need = ?,
        protein_need = ?,
        carbs_need = ?,
        fat_need = ?
      WHERE id = ?
    `;
    let params = [];
    // get current calories, protein, carbs, fat
    const currentQuery = `
      SELECT calories, protein_g, carbs_g, fat_g
      FROM users
      WHERE id = ?
    `;
    db.get(currentQuery, [userId], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (!row) {
        return reject(new Error('User not found'));
      }

      params = [
        data.name || null,
        data.age,
        data.gender,
        data.height_cm,
        data.weight_kg,
        data.activity_level,
        data.goal,
        data.dietary_preferences || null,
        data.training_frequency,
        row.calories, // keep current calories
        row.protein_g, // keep current protein
        row.carbs_g, // keep current carbs
        row.fat_g, // keep current fat
        calories_need,
        protein_need,
        carbs_need,
        fat_need,
        userId
      ];

      db.run(query, params, function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

function replacelatestNutrition(data, userId) {
  return new Promise((resolve, reject) => {
    const deleteSql = `
      DELETE FROM latestnutrition
      WHERE id = ?
    `;
    db.run(deleteSql, [userId], function (err) {
      if (err) {
        console.error('Failed to delete existing latest nutrition:', err);
        return reject(err);
      }

      const insertSql = `
        INSERT INTO latestnutrition (id, calories, protein_g, carbs_g, fat_g)
        VALUES (?, ?, ?, ?, ?)
      `;
      const params = [
        userId,
        parseInt(data["Calories"].replace(' kcal', '')) || 0,
        parseFloat(data["Protein"].replace(' g', '')) || 0,
        parseFloat(data["Carbohydrates"].replace(' g', '')) || 0,
        parseFloat(data["Fats"].replace(' g', '')) || 0
      ];

      db.run(insertSql, params, function (err) {
        if (err) {
          console.error('Failed to insert latest nutrition:', err);
          return reject(err);
        }
        resolve();
      });
    });
  });
}

function addNutrition(data, userId) {
  replacelatestNutrition(data, userId);
  return new Promise((resolve, reject) => {
    // Step 1: Get current nutrition values
    const selectSql = `
      SELECT calories, protein_g, carbs_g, fat_g
      FROM users
      WHERE id = ?
    `;

    db.get(selectSql, [userId], (err, row) => {
      if (err) {
        console.error('Failed to get current user nutrition:', err);
        return reject(err);
      }

      if (!row) {
        return reject(new Error('User not found'));
      }

      // Step 2: Subtract new data from existing values
      const params = [
        row.calories + parseInt(data["Calories"].replace(' kcal', '')),
        row.protein_g + parseFloat(data["Protein"].replace(' g', '')),
        row.carbs_g + parseFloat(data["Carbohydrates"].replace(' g', '')),
        row.fat_g + parseFloat(data["Fats"].replace(' g', '')),
        userId
      ];

      // Step 3: Update the database
      const updateSql = `
        UPDATE users
        SET calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?
        WHERE id = ?
      `;

      db.run(updateSql, params, function (err) {
        if (err) {
          console.error('Failed to update nutrition:', err);
          return reject(err);
        }

        resolve({ message: 'Nutrition updated', changes: this.changes });
      });
    });
  });
}

function createUser(userData) {
  return new Promise((resolve, reject) => {
    const sql = 
      `INSERT INTO users (
        name, age, gender, height_cm, weight_kg, activity_level,
        goal, dietary_preferences, training_frequency,
        calories, protein_g, carbs_g, fat_g, calories_need,
        protein_need, carbs_need, fat_need,
        username, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ;

    const params = [
      userData.fullname,
      27,      // default age
      "male", // default
      180,     // default height in cm
      80,      // default weight in kg
      "moderate", // default activity level
      "build_muscle", // default goal
      "none",  // default dietary preferences
      4, // default training frequency
      0,        // default calories
      0,      // default protein
      0,      // default carbs
      0,      // default fat
      2500,      // default calories
      100,    // default protein
      25,    // default carbs
      30,    // default fat
      userData.username,
      userData.password // For production: hash this!
    ];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Failed to create user:', err);
        return reject(err);
      }
      resolve({ message: 'User created', userId: this.lastID });
    });

    // create latest nutrition with values 0
    const latestSql = `
      INSERT INTO latestnutrition (id, calories, protein_g, carbs_g, fat_g)
      VALUES (?, 0, 0, 0, 0)
    `;
    db.run(latestSql, [this.lastID], function (err) {
      if (err) {
        console.error('Failed to create latest nutrition for new user:', err);
        // Not rejecting here since user creation succeeded
      }
    });
  });
}

function checkUser(credentials) {
  const { username, password } = credentials;
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM users
      WHERE username = ? AND password = ?
    `;
    db.get(sql, [username, password], (err, row) => {
      if (err) {
        console.error('Failed to check user:', err);
        return reject(err);
      }
      if (row) {
        resolve({ userData: row });
      } else {
        resolve(null); // No user found
      }
    });
  });
}

function getLatestNutrition(userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM latestnutrition
      WHERE id = ?
      ORDER BY id DESC
      LIMIT 1
    `;
    db.get(sql, [userId], (err, row) => {
      if (err) {
        console.error('Failed to fetch latest nutrition:', err);
        return reject(err);
      }
      resolve(row || null); // return the latest row or null if none
    });
  });
}


module.exports = {
  getUserById,
  updateUserProfile,
  addNutrition,
  createUser,
  checkUser,
  getLatestNutrition
};
