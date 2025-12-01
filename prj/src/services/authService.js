const API_URL = 'http://localhost:8080/api/user';

// Volatile store for the decrypted master key (simulates a client-side digital wallet)
// NOTE: Reverting removal of password storage to support existing HTTP Basic Auth
// let masterKey = null; 

/*
// Mock function to simulate decryption and wallet initialization (REMOVED FOR FIX)
const decryptAndStoreMasterKey = (user, password) => {
    // In a real app: password is used to decrypt the user.didPrivateKey.
    // The decrypted key material is then stored in the 'masterKey' volatile store.
    if (user && user.didPrivateKey) {
        masterKey = {
            keyMaterial: user.didPrivateKey, // Storing encrypted key for flow simulation
            unlocked: true,
        };
    }
}
*/

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
  sessionStorage.setItem('temp_pass', password); // RE-ADDED: Store password for session
  // decryptAndStoreMasterKey(user, password); // REMOVED
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
  sessionStorage.setItem('temp_pass', password); // RE-ADDED: Store password for session
  // decryptAndStoreMasterKey(user, password); // REMOVED
  return user;
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// REPLACING getMasterKey with getStoredPassword
export const getStoredPassword = () => {
    return sessionStorage.getItem('temp_pass');
}

export const logout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('temp_pass'); // RE-ADDED
    // masterKey = null; // REMOVED
};