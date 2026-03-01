import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [name, setName] = useState(localStorage.getItem("name"));

  const login = (token, name) => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", name);
    setToken(token);
    setName(name);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setName(null);
  };

  return (
    <AuthContext.Provider value={{ token, name, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);