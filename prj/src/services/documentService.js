import { getCurrentUser, getStoredPassword } from './authService';

const API_URL = 'http://localhost:8080/api';

// Modified to accept issuerId
export const uploadIdCard = async (frontFile, backFile, selfieFile, issuerId) => {
  const currentUser = getCurrentUser();
  const password = getStoredPassword();

  if (!currentUser || !password) {
    throw new Error('You are not logged in. Please log in again.');
  }

  const formData = new FormData();
  formData.append('frontImage', frontFile);
  formData.append('backImage', backFile);
  formData.append('selfieImage', selfieFile);
  
  // Append the selected issuer ID so the backend links the document to them
  formData.append('issuerId', issuerId);

  const response = await fetch(`${API_URL}/upload/id-card`, {
    method: 'POST',
    headers: {
      // Basic Auth using the user's email and stored password
      'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Document verification failed');
  }

  return response.json();
};