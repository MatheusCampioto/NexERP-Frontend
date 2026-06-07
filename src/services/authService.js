import api from './api';

export const login = async (email, senha) => {
  const response = await api.post('/Auth/login', { email, senha });
  return response.data;
};

export const registrar = async (dados) => {
  const response = await api.post('/Auth/registrar', dados);
  return response.data;
};