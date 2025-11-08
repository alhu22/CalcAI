const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImageKit = require("imagekit");
const { getUserById, checkUser, updateUserProfile,addNutrition, createUser, getLatestNutrition } = require('../helpers/user');
const fetch = require('node-fetch'); // Install with: npm install node-fetch
const { render } = require('ejs');
const path = require('path');

const fs = require('fs');


const endpoint = "https://openairesourcefirst.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-12-01-preview";
const apiKey = "ChISMFCwOIJLzxKslNVVm2Cm3ESE21HlsKikodBOVkPSGcekGfWoJQQJ99BDACfhMk5XJ3w3AAABACOG2pdA";

const imagekit = new ImageKit({
    publicKey: "public_vIIUYDN3TgSfgAxlE+gUi/cjQXE=",
    privateKey: "private_NeC2inSMuF5vP84h7YMV7vPGTbw=", // Replace with your actual private key
    urlEndpoint: "https://ik.imagekit.io/fxjzsfork"
});

const headers = {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Replace with your site URL
        "X-Title": "NutritionGPT"                // Replace with your app/site name
      };

// const upload = multer({ storage: multer.memoryStorage() });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // or custom name
  }
});

const upload = multer({ storage });

router.post('/nutrition', upload.single('image'), async (req, res) => {
  const type = req.body.type;
  let prompt;
  if (type == 'nutrition') {
    prompt = `
      You are a nutrition expert. Analyze this image and return only the nutritional breakdown in this **exact format**, with **single number** for each nutrition not range, no extra words:

      Calories:        x kcal
      Protein:         x g
      Carbohydrates:   x g  
      Fats:            x g
      Fiber:           x g
      Sugar:           x g
    `;
  }else {
    prompt = `
      Analyze this image and return only the body fat percentage, for a male in this **exact format**, no extra words:

      Fat:        x %
    `;
  }

  // const file = new File([blob], Date.now() + '-captured.jpg', { type: 'image/jpeg' });

  try {
    const fileInfo = req.file;

    if (!fileInfo) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const imagePath = fileInfo.path;
    const imageBuffer = fs.readFileSync(imagePath);

    // Upload image to ImageKit
    const result = await new Promise((resolve, reject) => {
      imagekit.upload({
        file: imageBuffer,
        fileName: fileInfo.originalname,
      }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });


    const imageUrl = result.url;

    // Send to OpenRouter
    // const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    //   method: "POST",
    //   headers: headers,
    //   body: JSON.stringify({
    //     model: "meta-llama/llama-4-scout:free",
    //     messages: [
    //       {
    //         role: "user",
    //         content: [
    //           {
    //             type: "text",
    //             text: prompt
    //           },
    //           {
    //             type: "image_url",
    //             image_url: {
    //               url: imageUrl
    //             }
    //           }
    //         ]
    //       }
    //     ]
    //   })
    // });
    // const data = await response.json();
    // const answer = data.choices?.[0]?.message?.content || "No response from model.";
    // const answer =`Calories:        500 kcal
    //                     Protein:         30 g
    //                     Carbohydrates:   60 g
    //                     Fats:            20 g
    //                     Fiber:           5 g
    //                     Sugar:           10 g`;

    

    
    const requestBody = {
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageUrl
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1000
            };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    let answer = data.choices[0].message.content;
    answer = answer.slice(answer.indexOf("Calories:"));
    if (!answer.trim().startsWith("Calories:")) {
      console.error("Invalid response from model:", answer);
      return res.status(500).json({ error: "Invalid response from model", details: answer });
    }
    const dataDict = answer
        .trim()
        .split('\n')
        .map(line => line.split(':'))
        .reduce((acc, [key, ...rest]) => {
          acc[key.trim()] = rest.join(':').trim();
          return acc;
        }, {});
    
    if (type == 'nutrition'){
      const userId = req.session.userId;
      await addNutrition(dataDict, userId);
    }
    res.json({ imageUrl, data: dataDict, userId: req.session.userId });


  } catch (error) {
    console.error("Error in image-chat route:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.post('/scanner', async (req, res) => {
  const { barcode } = req.body;

  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 1) {
    // Save nutrition data in DB or session here
    req.session.nutrition = data.product.nutriments;  // example
  } else {
    req.session.notFoundprod = 'product not found';
  }

  res.redirect('/');
});



router.get('/', async (req, res) => {

  // Check if user is logged in
  if (req.session.userId) {
    const user = await getUserById(req.session.userId);
    req.session.notFoundprod = null;  // clear after reading

    const data = await getLatestNutrition(req.session.userId);

    const userId = req.session.userId || "";
    return res.render('pages/home', { userData: user, userId: userId, data: data });
  }
  // Fetch user data
  res.redirect('/signin'); // Redirect to signin if not logged in
  
});

router.get('/nutrition', (req, res) => {
  const imageUrl = req.query.imageUrl || '';
  const data = req.query.data || '';
  res.render('pages/nutrition', {imageUrl: imageUrl, 
    data:data
  });
});

router.post('/profile/update', async (req, res) => {
  const userId = res.req.session.userId;
  await updateUserProfile(req.body, userId);
  const user = await getUserById(1);
  res.redirect('/');
  
});

router.get('/profile', async (req, res) => {
  try {
    const userId = req.session.userId; // Get user ID from session

    if (!userId) {
      return res.status(401).send('Unauthorized: Please log in');
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('pages/profile', { user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).send('Internal server error');
  }
});

router.post('/signup', async (req, res) => {
  try {
    const data = req.body;
    const newUser = await createUser(data);
    req.session.userId = newUser.userId; // Store user ID in session
    res.redirect('/');
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
  
});

router.get('/signup', (req, res) => {
  res.render('pages/signUpp');
});

router.post('/signin', async (req, res) => {
  try {
    const user = await checkUser(req.body); // Assuming this function checks credentials

    if (user) {
      req.session.userId = user.userData.id; // Store user ID in session
      const data = await getLatestNutrition(user.userData.id);
      res.render('pages/home', { userData: user.userData, userId: user.userData.id, data: data });
    } else {
      res.redirect('/signup');
    }
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

router.get('/signin', (req, res) => {
  res.render('pages/signin');
});


module.exports = router;
