import axios from 'axios';
import { getCurrentUser, getStoredPassword } from './authService';

const API_URL = 'http://localhost:8080/api';

/**
 * Utility to generate Basic Auth headers for requests
 */
const getAuthHeaders = () => {
    const currentUser = getCurrentUser();
    const password = getStoredPassword();

    if (!currentUser || !password) {
        throw new Error('You are not logged in. Please log in again.');
    }

    return {
        'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`),
    };
};

/**
 * Uploads ID documents for verification (Existing Logic)
 */
export const uploadIdCard = async (frontFile, backFile, selfieFile, issuerId) => {
    const formData = new FormData();
    formData.append('frontImage', frontFile);
    formData.append('backImage', backFile);
    formData.append('selfieImage', selfieFile);
    formData.append('issuerId', issuerId);

    const response = await fetch(`${API_URL}/upload/id-card`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Document verification failed');
    }

    return response.json();
};

/**
 * Fetches and decrypts a document for viewing (New Logic for Verifiers)
 */
export const fetchDocument = async (documentId) => {
    try {
        // Calls the backend decryption endpoint added to DocumentController
        const response = await axios.get(`${API_URL}/documents/view/${documentId}`, {
            responseType: 'blob', // Necessary for handling binary image data
            headers: getAuthHeaders()
        });
        
        // Creates a temporary local URL for the decrypted image blob
        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error("Error fetching decrypted document:", error);
        throw error;
    }
};

const documentService = {
    uploadIdCard,
    fetchDocument
};

export default documentService;