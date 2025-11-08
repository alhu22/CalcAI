import os

# Project structure definition
project_structure = {
    "my-app": {
        "public": {
            "css": {},
            "js": {},
            "images": {}
        },
        "routes": {
            "index.js": """\
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Home Page' });
});

module.exports = router;
"""
        },
        "views": {
            "partials": {
                "header.ejs": """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><%= title %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
""",
                "footer.ejs": """\
</body>
</html>
"""
            },
            "pages": {
                "home.ejs": """\
<%- include('../partials/header') %>

<h1><%= title %></h1>
<p>Welcome to your EJS-powered app!</p>

<%- include('../partials/footer') %>
"""
            },
            "layout.ejs": ""  # Optional layout file
        },
        "app.js": """\
const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes/index');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
""",
        "package.json": """\
{
  "name": "my-ejs-app",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
""",
        "README.md": "# My EJS App\n\nA simple Node.js + EJS project."
    }
}

# Function to recursively create folders and files
def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):  # It's a folder
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:  # It's a file
            with open(path, "w") as f:
                f.write(content)

# Create project
create_structure(".", project_structure)
print("✅ Project structure created successfully.")
