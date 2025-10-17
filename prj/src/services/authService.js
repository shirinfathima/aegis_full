const API_URL = 'http://localhost:8080/api/user';

export const register = async (name, email, password, role) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Registration failed');
  }

  const user = await response.json();
  localStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('temp_pass', password); // Store password for session
  return user;
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }
  
  const user = await response.json();
  localStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('temp_pass', password); // Store password for session
  return user;
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const logout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('temp_pass');
};