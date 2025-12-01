import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Paper,
  Button,
  Dialog, // Added for Modal
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  // Additions for the Wallet UI
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Description as DocumentIcon,
  Verified as VerifiedIcon,
  Share as ShareIcon, // Changed from DownloadIcon
  Lock as LockIcon,
  Person as PersonIcon,
  CloudDownload as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// Using getStoredPassword instead of getMasterKey
import { getCurrentUser, getStoredPassword } from '../services/authService'; 

function IssuedDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Wallet State
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [disclosureType, setDisclosureType] = useState('full'); // 'full' or 'age_proof'
  const [proofResult, setProofResult] = useState(null);

  // Helper to calculate age from DD-MM-YYYY format
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    try {
      // NOTE: The backend OCR extracts date in DD-MM-YYYY format (e.g., '30-03-2004')
      const [day, month, year] = dobString.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      console.error("Error calculating age:", e);
      return null;
    }
  };

  const fetchIssuedDocuments = async () => {
    const currentUser = getCurrentUser();
    
    // Using the stored password for HTTP Basic Auth
    const storedPassword = getStoredPassword(); 
    
    if (!currentUser || !storedPassword) {
        setError("Session expired. Please log in.");
        setIsLoading(false);
        // Do not use localStorage.removeItem('user') here, logout should handle that
        return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/documents/my-documents', {
        headers: {
          // Use the stored password for Basic Auth, as expected by the backend
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${storedPassword}`) 
        }
      });

      if (!response.ok) {
        // If auth fails here, show specific error
        if (response.status === 401 || response.status === 403) {
            throw new Error("Authorization failed. Please log in again.");
        }
        throw new Error(`Failed to fetch documents. Status: ${response.status}`);
      }

      const data = await response.json();
      // Filter only approved documents that have a VC
      const issuedDocs = data.filter(doc => doc.status === 'APPROVED' && doc.verifiableCredential);
      setDocuments(issuedDocs);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
    
  useEffect(() => {
    fetchIssuedDocuments();
  }, [navigate]);


  const openShareModal = (document) => {
    setSelectedDocument(document);
    setDisclosureType('full'); // Default to full disclosure
    setProofResult(null); // Clear previous result
    setIsSharingOpen(true);
  };
  
  // Reverting handleDownloadVC for the "Download Credential" menu item
  const handleDownloadVC = (vcString, documentName) => {
    try {
        const blob = new Blob([vcString], { type: 'application/ld+json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentName.replace(/\s/g, '_')}_VC.jsonld`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Download error:", e);
    }
  };


  const handleGenerateProof = () => {
    const vcString = selectedDocument.verifiableCredential;
    const currentUser = getCurrentUser();
    
    // We are no longer using getMasterKey, using the DID for simulation.
    if (!currentUser) {
      setProofResult({ status: 'Error', message: "User session expired. Cannot generate proof." });
      return;
    }

    try {
        const vcJson = JSON.parse(vcString);
        // Claims are nested: vcJson.credentialSubject.claims.back
        const claimsNode = JSON.parse(vcJson.credentialSubject.claims.claims); // Assuming claims are nested under a 'claims' property in OCR
        const dob = claimsNode.back?.['Date Of Birth']; // Safely access DOB

        let verifiablePresentation;
        let disclosureMessage;

        // --- Selective Disclosure Logic Simulation (ZKP) ---
        if (disclosureType === 'age_proof') {
            const age = calculateAge(dob);
            const isOver21 = age !== null && age >= 21;
            
            disclosureMessage = isOver21 
                ? "The holder is verified to be over 21 years old (Selective Disclosure Proof)." 
                : "The holder is NOT verified to be over 21 years old (Selective Disclosure Proof).";
            
            // Generate a presentation with only the proof of age (no DOB or ID visible)
            verifiablePresentation = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "type": ["VerifiablePresentation", "AgeVerificationProof"],
                "holder": currentUser.did,
                "proof": {
                    "type": "ZeroKnowledgeProof", // Mock ZKP type
                    "created": new Date().toISOString(),
                    "proofValue": `mock-zkp-over-21-${isOver21 ? 'TRUE' : 'FALSE'}_DID:${currentUser.did.substring(14, 20)}`,
                    "disclosedAttributes": { "age_over_21": isOver21 }
                },
                "verifiableCredential": [
                    { 
                        "id": "urn:uuid:selective-disclosure-proof",
                        "claims": { "ageVerification": isOver21, "documentType": selectedDocument.documentName } 
                    } // Only include the derived claim
                ]
            };

            setProofResult({
                status: isOver21 ? 'Success' : 'Warning',
                message: disclosureMessage,
                presentation: JSON.stringify(verifiablePresentation, null, 2)
            });

        } else {
            // Full Disclosure (Standard Verifiable Presentation)
            
            // Simulate cryptographic signing using the user's DID private key (mocked)
            const mockSignature = `mock-signature-by-DID:${currentUser.did.substring(14, 20)}...`;
            
            verifiablePresentation = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "type": ["VerifiablePresentation", "FullDocumentDisclosure"],
                "holder": currentUser.did,
                "proof": {
                    "type": "JsonWebSignature2020",
                    "created": new Date().toISOString(),
                    "verificationMethod": currentUser.did + "#key-1",
                    "jws": mockSignature // Signature using user's key
                },
                "verifiableCredential": [vcJson] // Include the full VC
            };
            
            setProofResult({
                status: 'Success',
                message: 'Verifiable Presentation (Full Disclosure) Generated Successfully.',
                presentation: JSON.stringify(verifiablePresentation, null, 2)
            });
        }

    } catch (e) {
        console.error("Proof Generation Error:", e);
        setProofResult({ status: 'Error', message: `Failed to parse VC claims: ${e.message}. Check browser console for raw VC data errors.` });
    }
  };


  if (isLoading) {
    return <Box sx={{ p: 4 }}>Loading issued documents...</Box>;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Error: {error}</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go to Login</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedIcon /> Issued Documents (Wallet)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Securely view and manage your Verifiable Credentials using your Digital Wallet.
        </Typography>
        <Alert severity="info" sx={{mt:2}}>
            Backend authentication restored: You are now using HTTP Basic Auth (Email/Password) to access protected API endpoints.
        </Alert>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>My Verifiable Credentials</Typography>
          
          {documents.length === 0 ? (
            <Alert severity="info" icon={<DocumentIcon />}>
              You currently have no documents that have been fully approved.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {documents.map((document) => (
                <Grid item xs={12} key={document.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ApprovedIcon color="success" />
                        <Box>
                          <Typography variant="subtitle1">{document.documentName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            DID: {getCurrentUser()?.did || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            VC Hash (On Chain): {document.vcHash.substring(0, 20)}...
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', display: 'flex', gap: 1 }}>
                        <Chip
                          label={'VC ISSUED'}
                          color='success'
                          size="small"
                        />
                        {document.verifiableCredential && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ShareIcon />}
                            onClick={() => openShareModal(document)}
                          >
                            Share Credential/Generate Proof
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadVC(document.verifiableCredential, document.documentName)}
                        >
                            Download VC
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          <Divider sx={{ my: 3 }} />
          
          <Button
            variant="outlined"
            onClick={() => navigate('/user')}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
      
      {/* Credential Sharing Modal */}
      <Dialog 
        open={isSharingOpen} 
        onClose={() => setIsSharingOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon /> Digital Wallet: Generate Verifiable Presentation
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            **Credential:** {selectedDocument?.documentName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the level of disclosure required by the verifying party to generate a cryptographic proof (Verifiable Presentation).
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Disclosure Type</InputLabel>
            <Select
              value={disclosureType}
              label="Disclosure Type"
              onChange={(e) => {
                setDisclosureType(e.target.value);
                setProofResult(null);
              }}
            >
              <MenuItem value="full">Full Disclosure (Share all data)</MenuItem>
              <MenuItem value="age_proof">Selective Disclosure (Prove Age &gt; 21 only)</MenuItem>
            </Select>
          </FormControl>
            
          <Alert severity="info" sx={{ mb: 3 }}>
            Generating a Verifiable Presentation requires cryptographic signing. This process is simulated on the client side using your DID.
          </Alert>

          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateProof}
            startIcon={<PersonIcon />}
            fullWidth
          >
            Generate Proof
          </Button>
          
          {proofResult && (
            <Box sx={{ mt: 3 }}>
              <Alert severity={proofResult.status === 'Error' ? 'error' : proofResult.status === 'Warning' ? 'warning' : 'success'} sx={{ mb: 2 }}>
                {proofResult.message}
              </Alert>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Verifiable Presentation Output:</Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={proofResult.presentation}
                InputProps={{ readOnly: true }}
                sx={{ 
                  '& textarea': { fontFamily: 'monospace', fontSize: '0.8rem' },
                  backgroundColor: '#f5f5f5'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSharingOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default IssuedDocuments;