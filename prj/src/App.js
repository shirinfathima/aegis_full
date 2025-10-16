import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

// Import all pages
import HomePage from './HomePage';
import UserDashboard from './pages/UserDashboard';
import DocumentUpload from './pages/DocumentUpload';
import VerificationResult from './pages/VerificationResult';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import FraudDetection from './pages/FraudDetection';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProfileDetails from './pages/ProfileDetails';
import IssuedDocuments from './pages/IssuedDocuments';
import DocumentReview from './pages/DocumentReview'; 

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        
        {/* User Routes */}
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/profile-details" element={<ProfileDetails />} /> 
        <Route path="/upload" element={<DocumentUpload />} />
        <Route path="/verification-result" element={<VerificationResult />} />
        <Route path="/issued-documents" element={<IssuedDocuments />} /> {/* <-- NEW ROUTE */}
        
        {/* issuer Routes */}
        <Route path="/issuer" element={<IssuerDashboard />} />
        <Route path="/issuer/dashboard" element={<IssuerDashboard />} />
        
        {/* Verifier Routes */}
        <Route path="/verifier" element={<VerifierDashboard />} />
        <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
        <Route path="/verifier/document-review" element={<DocumentReview />} />
        
        {/* Security Routes */}
        <Route path="/fraud-detection" element={<FraudDetection />} />
        
        {/* Fallback Route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
