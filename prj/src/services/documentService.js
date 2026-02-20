import axios from 'axios';
import { getCurrentUser, getStoredPassword } from './authService';

const API_URL = 'http://localhost:8080/api';

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
 * Upload ID documents
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
 * Fetch decrypted document
 */
export const fetchDocument = async (documentId) => {
    try {
        const response = await axios.get(
            `${API_URL}/documents/view/${documentId}`,
            {
                responseType: 'blob',
                headers: getAuthHeaders()
            }
        );

        return URL.createObjectURL(response.data);

    } catch (error) {
        console.error("Error fetching decrypted document:", error);
        throw error;
    }
};

/**
 * 🔐 Generate & Verify Age Proof (ZKP On-Chain)
 */
export const verifyAgeWithZKP = async (documentId) => {
    try {
        const response = await axios.post(
            `${API_URL}/verifier/generate-proof/age`,
            null, // No body needed
            {
                params: { documentId: documentId }, // Sent as RequestParam
                headers: getAuthHeaders()
            }
        );

        // Backend already returns JSON stringified response
        const data = typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;

        return {
            verifiedOnChain: data.verifiedOnChain,
            ageCheckResult: data.ageCheckResult,
            birthYearUsed: data.birthYearUsed,
            currentYearUsed: data.currentYearUsed
        };

    } catch (error) {
        console.error("ZKP Verification Error:", error);
        throw error;
    }
};

const documentService = {
    uploadIdCard,
    fetchDocument,
    verifyAgeWithZKP
};

export default documentService;
