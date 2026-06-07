import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario({
        nome: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        perfil: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      });
    }
  }, [token]);

  const salvarToken = (novoToken) => {
    localStorage.setItem('token', novoToken);
    setToken(novoToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ token, usuario, salvarToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);