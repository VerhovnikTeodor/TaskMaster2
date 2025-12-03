const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { users } = require('../data/store');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Registracija uporabnika
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validacija
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Vsa polja so obvezna' });
    }

    // Preveri če uporabnik že obstaja
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Uporabnik s tem e-poštnim naslovom že obstaja' });
    }

    // Hash gesla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ustvari novega uporabnika
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Ustvari JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Uporabnik uspešno registriran',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Napaka pri registraciji' });
  }
});

// Prijava uporabnika
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validacija
    if (!email || !password) {
      return res.status(400).json({ error: 'Email in geslo sta obvezna' });
    }

    // Najdi uporabnika
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Neveljavni prijavni podatki' });
    }

    // Preveri geslo
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Neveljavni prijavni podatki' });
    }

    // Ustvari JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Prijava uspešna',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Napaka pri prijavi' });
  }
});

// Pridobi trenutnega uporabnika
router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Uporabnik ne obstaja' });
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  });
});

module.exports = router;
