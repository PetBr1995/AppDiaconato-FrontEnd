import axios from 'axios';

const api = axios.create({
  baseURL: 'https://201.75.89.242:3000/api', // Substitua pelo IP do seu backend
});

// Função de retry
const retryRequest = async (requestFunction, retries = 3, delay = 1000) => {
  try {
    return await requestFunction(); // Executa a função de requisição
  } catch (error) {
    if (retries > 0) {
      console.log(`Tentando novamente (${retries} tentativas restantes)...`);
      await new Promise((resolve) => setTimeout(resolve, delay)); // Aguarda antes de tentar novamente
      return retryRequest(requestFunction, retries - 1, delay); // Chama recursivamente
    }
    throw error.response?.data || 'Erro ao processar a requisição'; // Lança o erro após todas as tentativas
  }
};

// Cadastro de usuário
export const registerUser = async (userData) => {
  return retryRequest(async () => {
    const response = await api.post('/usuarios/register', userData);
    return response.data;
  });
};

// Login de usuário
export const loginUser = async (cpf) => {
  return retryRequest(async () => {
    const response = await api.post('/usuarios/login', { cpf });
    return response.data;
  });
};

// Geração de QR Code
export const generateQRCode = async (cpf) => {
  return retryRequest(async () => {
    const response = await api.post('/usuarios/generateQRCode', { cpf });
    return response.data.qrCodeURL;
  });
};

// Registro de presença
export const registerAttendance = async (cpf, token) => {
  return retryRequest(async () => {
    const response = await api.post(
      '/usuarios/registerAttendance',
      { cpf },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  });
};

// Listar todos os usuários
export const getAllUsers = async (token) => {
  return retryRequest(async () => {
    const response = await api.get('/usuarios', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  });
};

// Atualizar usuário
export const updateUser = async (id, userData, token) => {
  return retryRequest(async () => {
    const response = await api.put(`/usuarios/${id}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  });
};

// Deletar usuário
export const deleteUser = async (id, token) => {
  return retryRequest(async () => {
    const response = await api.delete(`/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  });
};

// Promover usuário para administrador
export const promoteToAdmin = async (cpf, token) => {
  return retryRequest(async () => {
    const response = await api.post(
      '/usuarios/promoteToAdmin',
      { cpf },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  });
};