const API_URL = 'http://localhost:8080/api/user';

export const register = async (name, email, password, role) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, role }),
  });
  return response.text();
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }
  // Expect a JSON User object on success
  const user = await response.json();
  
  // Store user data in local storage
  localStorage.setItem('user', JSON.stringify(user));

  // Return the full user object
  return user
};
// New helper functions to retrieve stored data
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const logout = () => {
    localStorage.removeItem('user');
};