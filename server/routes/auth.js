const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');

// Middleware para verificar autenticação
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.substring(7);
    
    // Verificar token com Supabase
    const { data: { user }, error } = await supabaseService.client.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno na autenticação' });
  }
};

// POST /api/auth/signup - Registrar novo usuário
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Registrar usuário
    const signUpResult = await supabaseService.signUp(email, password, {
      name: name || '',
      company: company || ''
    });

    if (!signUpResult.success) {
      return res.status(400).json({ error: signUpResult.error });
    }

    // Criar perfil do usuário
    if (signUpResult.data.user) {
      await supabaseService.createUserProfile(signUpResult.data.user.id, {
        name: name || '',
        company: company || '',
        email: email
      });
    }

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: signUpResult.data.user
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/auth/signin - Login do usuário
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const signInResult = await supabaseService.signIn(email, password);

    if (!signInResult.success) {
      return res.status(401).json({ error: signInResult.error });
    }

    // Buscar perfil do usuário
    const profileResult = await supabaseService.getUserProfile(signInResult.data.user.id);
    
    res.json({
      message: 'Login realizado com sucesso',
      user: signInResult.data.user,
      profile: profileResult.success ? profileResult.data : null,
      session: signInResult.data.session
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/auth/signout - Logout do usuário
router.post('/signout', requireAuth, async (req, res) => {
  try {
    const signOutResult = await supabaseService.signOut();
    
    if (signOutResult.success) {
      res.json({ message: 'Logout realizado com sucesso' });
    } else {
      res.status(400).json({ error: signOutResult.error });
    }
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/auth/me - Obter usuário atual
router.get('/me', requireAuth, async (req, res) => {
  try {
    const profileResult = await supabaseService.getUserProfile(req.user.id);
    
    res.json({
      user: req.user,
      profile: profileResult.success ? profileResult.data : null
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PUT /api/auth/profile - Atualizar perfil do usuário
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, company, phone, settings } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (settings !== undefined) updateData.settings = settings;

    const updateResult = await supabaseService.updateUserProfile(req.user.id, updateData);
    
    if (updateResult.success) {
      res.json({
        message: 'Perfil atualizado com sucesso',
        profile: updateResult.data
      });
    } else {
      res.status(400).json({ error: updateResult.error });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/auth/refresh - Renovar token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token é obrigatório' });
    }

    // Implementar renovação de token com Supabase
    // Por enquanto, retornar erro
    res.status(501).json({ error: 'Renovação de token não implementada ainda' });
    
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;