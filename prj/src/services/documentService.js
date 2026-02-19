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
 * NEW: Cross-checks student details against the University Registry (Mock DB)
 * This allows the UI to verify a student before or during the approval process.
 */
export const verifyStudentRegistry = async (admissionNo, name) => {
    try {
        const response = await axios.post(`${API_URL}/issuer/verify-student`, {
            admissionNo,
            name
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Registry Verification Error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Uploads ID documents for verification
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
 * Fetches pending documents for the Issuer dashboard
 */
export const getPendingDocuments = async () => {
    const response = await axios.get(`${API_URL}/issuer/documents/pending`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Approves a document. This will trigger the backend Cross-Check + Blockchain anchoring.
 */
export const approveDocument = async (documentId) => {
    const response = await axios.post(`${API_URL}/issuer/documents/${documentId}/approve`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Rejects a document.
 */
export const rejectDocument = async (documentId) => {
    const response = await axios.post(`${API_URL}/issuer/documents/${documentId}/reject`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Fetches and decrypts a document for viewing
 */
export const fetchDocument = async (documentId) => {
    try {
        const response = await axios.get(`${API_URL}/documents/view/${documentId}`, {
            responseType: 'blob',
            headers: getAuthHeaders()
        });
        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error("Error fetching decrypted document:", error);
        throw error;
    }
};

const documentService = {
    uploadIdCard,
    fetchDocument,
    verifyStudentRegistry,
    getPendingDocuments,
    approveDocument,
    rejectDocument
};

export default documentService;