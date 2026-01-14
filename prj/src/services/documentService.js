import { getCurrentUser, getStoredPassword } from './authService';

const API_URL = 'http://localhost:8080/api';

export const uploadIdCard = async (frontFile, backFile, selfieFile) => {
  const currentUser = getCurrentUser();
  const password = getStoredPassword();

  if (!currentUser || !password) {
    throw new Error('You are not logged in. Please log in again.');
  }

  const formData = new FormData();
  formData.append('frontImage', frontFile);
  formData.append('backImage', backFile);
  formData.append('selfieImage', selfieFile);

  const response = await fetch(`${API_URL}/upload/id-card`, {
    method: 'POST',
    headers: {
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