const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes/index');
const os = require('os');
const session = require('express-session');

app.use(session({
  secret: 'your_super_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // <== this is REQUIRED for JSON POST bodies
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/', routes);

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        iface.address.startsWith('192.168.')
      ) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}


const ip = getLocalIp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://${ip}:${PORT}`);
});