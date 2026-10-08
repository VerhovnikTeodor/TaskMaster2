const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repo = require('../data/repository');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Registracija uporabnika
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Vsa polja so obvezna' });
    }

    const existingUser = await repo.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Uporabnik s tem e-poštnim naslovom že obstaja' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await repo.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

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
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri registraciji' });
  }
});

// Prijava uporabnika
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email in geslo sta obvezna' });
    }

    const user = await repo.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Neveljavni prijavni podatki' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Neveljavni prijavni podatki' });
    }

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
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri prijavi' });
  }
});

// Pridobi trenutnega uporabnika
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await repo.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju uporabnika' });
  }
});

// Seznam vseh uporabnikov (za dropdown pri dodajanju članov)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await repo.listUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju uporabnikov' });
  }
});

module.exports = router;
