import axios from 'axios';

const api = axios.create({
  baseURL: 'https://201.75.89.242:3000/api', // Substitua pelo IP do seu backend
});

// Cadastro de usuário
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/usuarios/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Erro ao cadastrar usuário';
  }
};

// Login de usuário
export const loginUser = async (cpf) => {
  try {
    const response = await api.post('/usuarios/login', { cpf });
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Erro ao realizar login';
  }
};

// Geração de QR Code
export const generateQRCode = async (cpf) => {
  try {
    const response = await api.post('/usuarios/generateQRCode', { cpf });
    return response.data.qrCodeURL;
  } catch (error) {
    throw error.response?.data || 'Erro ao gerar QR Code';
  }
};

// Registro de presença
export const registerAttendance = async (cpf, token) => {
  try {
    const response = await api.post(
      '/usuarios/registerAttendance',
      { cpf },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Erro ao registrar presença';
  }
};

// Listar todos os usuários
export const getAllUsers = async (token) => {
  try {
    const response = await api.get('/usuarios', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Erro ao buscar usuários';
  }
};

// Atualizar usuário
export const updateUser = async (id, userData, token) => {
  try {
    const response = await api.put(`/usuarios/${id}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Erro ao atualizar usuário';
  }
};

// Deletar usuário
export const deleteUser = async (id, token) => {
  try {
    const response = await api.delete(`/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Erro ao deletar usuário';
  }
};

// Promover usuário para administrador
export const promoteToAdmin = async (cpf, token) => {
  try {
    const response = await api.post(
      '/usuarios/promoteToAdmin',
      { cpf },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || 'Erro ao promover usuário';
  }
};