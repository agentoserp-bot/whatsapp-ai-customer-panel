import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutCallbacks, setLogoutCallbacks] = useState([]);

  // Registrar callback de logout (usado pelo WhatsAppContext)
  const registerLogoutCallback = useCallback((callback) => {
    setLogoutCallbacks(prev => [...prev, callback]);
    return () => {
      setLogoutCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Executar todos os callbacks de logout
  const executeLogoutCallbacks = useCallback(async () => {
    for (const callback of logoutCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('Erro ao executar callback de logout:', error);
      }
    }
  }, [logoutCallbacks]);

  // Verificar sessão atual
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('🔍 Verificando sessão do usuário...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📋 Sessão encontrada:', session);
        
        if (session?.user) {
          console.log('✅ Usuário autenticado:', session.user.email);
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email);
        } else {
          console.log('❌ Nenhum usuário autenticado');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
      } finally {
        console.log('🏁 Finalizando verificação de sessão');
        setLoading(false);
      }
    };

    checkUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Evento de autenticação:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Buscar perfil do usuário
  const fetchProfile = async (userId, userEmail = '') => {
    try {
      console.log('🔍 Buscando perfil do usuário:', userId);
      
      // Tentar buscar da tabela
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('⚠️ Erro ao buscar perfil:', error.message);
        
        // Se a tabela não existe, criar perfil temporário
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('📝 Criando perfil temporário...');
          const tempProfile = {
            id: userId,
            full_name: 'Usuário',
            email: userEmail || user?.email || '',
            role: 'user',
            created_at: new Date().toISOString(),
          };
          setProfile(tempProfile);
          return;
        }
        
        throw error;
      }

      if (data) {
        console.log('✅ Perfil encontrado:', data);
        setProfile(data);
      } else {
        console.log('📝 Perfil não encontrado, criando...');
        await createUserProfile(userId, userEmail);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      
      // Em caso de erro, criar perfil temporário
      console.log('📝 Criando perfil temporário devido ao erro...');
                const tempProfile = {
            id: userId,
            full_name: 'Usuário',
            email: userEmail || user?.email || '',
            role: 'user',
            created_at: new Date().toISOString(),
          };
      setProfile(tempProfile);
    }
  };

  // Criar perfil do usuário
  const createUserProfile = useCallback(async (userId, userEmail = '') => {
    try {
      console.log('📝 Tentando criar perfil na tabela...');
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            full_name: 'Usuário',
            email: userEmail || user?.email || '',
            role: 'user',
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.log('⚠️ Erro ao criar perfil na tabela:', error.message);
        
        // Se a tabela não existe, usar perfil temporário
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('📝 Usando perfil temporário...');
          const tempProfile = {
            id: userId,
            full_name: 'Usuário',
            email: userEmail || user?.email || '',
            role: 'user',
            created_at: new Date().toISOString(),
          };
          setProfile(tempProfile);
          return;
        }
        
        throw error;
      }

      console.log('✅ Perfil criado com sucesso:', data);
      setProfile(data);
    } catch (error) {
      console.error('❌ Erro ao criar perfil:', error);
      
      // Em caso de erro, usar perfil temporário
      console.log('📝 Usando perfil temporário devido ao erro...');
      const tempProfile = {
        id: userId,
        full_name: 'Usuário',
        email: userEmail || user?.email || '',
        role: 'user',
        created_at: new Date().toISOString(),
      };
      setProfile(tempProfile);
    }
  }, [user?.email]);

  // Cadastro
  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast.success('Conta criada com sucesso! Verifique seu email.');
      return data;
    } catch (error) {
      const message = error.message === 'User already registered'
        ? 'Este email já está cadastrado'
        : error.message;
      toast.error(message);
      throw error;
    }
  };

  // Login
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      return data;
    } catch (error) {
      const message = error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : error.message;
      toast.error(message);
      throw error;
    }
  };

  // Logout
  const signOut = async () => {
    try {
      // Executar todos os callbacks de logout
      await executeLogoutCallbacks();
      
      // Limpar dados locais
      setUser(null);
      setProfile(null);
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpar localStorage se necessário
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('whatsapp-sessions');
      localStorage.removeItem('user-preferences');
      
      // Limpar dados de sessão
      sessionStorage.clear();
      
      toast.success('Logout realizado com sucesso!');
      
      // Redirecionar para login após um pequeno delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
      
      // Mesmo com erro, limpar dados locais
      setUser(null);
      setProfile(null);
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Forçar redirecionamento
      window.location.href = '/login';
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast.success('Perfil atualizado com sucesso!');
      return data;
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  // Redefinir senha
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Email de redefinição enviado!');
    } catch (error) {
      toast.error('Erro ao enviar email de redefinição');
      throw error;
    }
  };

  // Verificar se é admin
  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    isAdmin,
    registerLogoutCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};