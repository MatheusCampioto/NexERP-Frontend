import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(null);
  const [permissoes, setPermissoes] = useState({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarUsuario = async () => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const id = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

          const response = await api.get(`/Usuarios/${id}`);
          const dados = response.data;

          setUsuario({
            id: dados.id,
            nome: dados.nome,
            email: dados.email,
            perfil: dados.perfil,
          });

          setPermissoes({
            pessoas: dados.acessoPessoas,
            produtos: dados.acessoProdutos,
            estoque: dados.acessoEstoque,
            pedidos: dados.acessoPedidos,
            financeiro: dados.acessoFinanceiro,
            relatorios: dados.acessoRelatorios,
            usuarios: dados.acessoUsuarios,
          });
        } catch {
          localStorage.removeItem('token');
          setToken(null);
          setUsuario(null);
          setPermissoes({});
        }
      } else {
        setUsuario(null);
        setPermissoes({});
      }
      setCarregando(false);
    };

    carregarUsuario();
  }, [token]);

  const salvarToken = (novoToken) => {
    localStorage.setItem('token', novoToken);
    setToken(novoToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setPermissoes({});
  };

  const temAcesso = (modulo) => {
    if (usuario?.perfil === 'Admin') return true;
    return permissoes[modulo] === true;
  };

  return (
    <AuthContext.Provider value={{ token, usuario, permissoes, salvarToken, logout, temAcesso, carregando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);