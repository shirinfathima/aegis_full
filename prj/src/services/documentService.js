import axios from 'axios';
import { getCurrentUser, getStoredPassword } from './authService';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : 'http://localhost:8080/api';

/**
 * Utility to generate Basic Auth headers
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
 * 🔥 NEW: Verify Enrollment ZKP On-Chain
 */
export const verifyEnrollmentWithZKP = async (documentId) => {
    try {
        const response = await axios.post(
            `${API_URL}/verifier/verify-zkp?documentId=${documentId}`,
            {},
            {
                headers: getAuthHeaders()
            }
        );

        return response.data;
    } catch (error) {
        console.error("On-Chain Verification Error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

/**
 * Verify student against university registry
 */
export const verifyStudentRegistry = async (admissionNo, name) => {
    try {
        const response = await axios.post(
            `${API_URL}/issuer/verify-student`,
            { admissionNo, name },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Registry Verification Error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

/**
 * Upload ID Card
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
 * Issuer dashboard functions
 */
export const getPendingDocuments = async () => {
    const response = await axios.get(
        `${API_URL}/issuer/documents/pending`,
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const approveDocument = async (documentId) => {
    const response = await axios.post(
        `${API_URL}/issuer/documents/${documentId}/approve`,
        {},
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const rejectDocument = async (documentId) => {
    const response = await axios.post(
        `${API_URL}/issuer/documents/${documentId}/reject`,
        {},
        { headers: getAuthHeaders() }
    );
    return response.data;
};

/**
 * Fetch decrypted document
 */
export const fetchDocument = async (documentId) => {
    const response = await axios.get(
        `${API_URL}/documents/view/${documentId}`,
        {
            responseType: 'blob',
            headers: getAuthHeaders()
        }
    );

    return URL.createObjectURL(response.data);
};

const documentService = {
    uploadIdCard,
    fetchDocument,
    verifyStudentRegistry,
    getPendingDocuments,
    approveDocument,
    rejectDocument,
    verifyEnrollmentWithZKP   // ✅ Added here
};

export default documentService;