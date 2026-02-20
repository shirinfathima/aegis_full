import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Share as ShareIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  QrCode as QrIcon,
  Code as CodeIcon,
  Send as SendIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getStoredPassword } from '../services/authService';
import QRCode from 'react-qr-code';
import DigitalIDCard from '../components/DigitalIDCard'; 

function IssuedDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- VERIFIER SELECTION STATE ---
  const [verifiers, setVerifiers] = useState([]);
  const [selectedVerifier, setSelectedVerifier] = useState('');
  // -------------------------------

  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [disclosureType, setDisclosureType] = useState('full'); 
  const [proofResult, setProofResult] = useState(null);
  const [viewMode, setViewMode] = useState(0);
  
  // Redaction Fields (Default to all selected)
  const ALL_FIELDS = ['Name', 'Date of Birth', 'Reg No', 'Photo', 'Address'];
  const [selectedFields, setSelectedFields] = useState(ALL_FIELDS);

  // Helper to calculate age from DD-MM-YYYY
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    try {
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
    const password = getStoredPassword(); // FIXED ESLINT ERROR
    
    if (!currentUser || !password) {
        setError("Session expired. Please log in.");
        setIsLoading(false);
        return;
    }

    try {
      // 1. Fetch User's Documents
      const response = await fetch('http://localhost:8080/api/documents/my-documents', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`) 
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error("Authorization failed. Please log in again.");
        }
        throw new Error(`Failed to fetch documents. Status: ${response.status}`);
      }

      const data = await response.json();
      const issuedDocs = data.filter(doc => doc.status === 'APPROVED' && doc.verifiableCredential);
      setDocuments(issuedDocs);

      // 2. Fetch Available Verifiers for the Dropdown
      const verifierResponse = await fetch('http://localhost:8080/api/user/verifiers', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`) 
        }
      });
      if (verifierResponse.ok) {
        const verifierData = await verifierResponse.json();
        setVerifiers(verifierData);
      }

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
    setDisclosureType('full'); 
    setProofResult(null); 
    setSelectedVerifier(''); // Reset verifier selection
    setSelectedFields(ALL_FIELDS); // Reset fields
    setIsSharingOpen(true);
    setViewMode(0);
  };

  // Toggle Field Logic
  const toggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
    setProofResult(null); // Reset proof if selection changes
  };
  
  // MADE ASYNC TO SUPPORT REAL BACKEND ZKP FETCH
  const handleGenerateProof = async () => {
    const vcString = selectedDocument.verifiableCredential;
    const currentUser = getCurrentUser();
    const password = getStoredPassword();
    
    if (!currentUser) {
      setProofResult({ status: 'Error', message: "User session expired. Cannot generate proof." });
      return;
    }

    try {
        const vcJson = JSON.parse(vcString);
        let verifiablePresentation;
        let disclosureMessage;

        // --- OPTION 1: ZKP (Age Only) ---
        if (disclosureType === 'zkp') {
            
            // FIXED: CALLING THE BACKEND ENDPOINT FOR REAL W3C ZKP DATA
            const res = await fetch(
                `http://localhost:8080/api/user/generate-proof/age?documentId=${selectedDocument.id}`,
                {
                    method: 'POST',
                    headers: { 'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`) }
                }
            );

            if (!res.ok) {
                const errText = await res.text();
                throw new Error("ZKP Generation Failed: " + errText);
            }

            const data = await res.json();
            const isOver18 = data.isAdult;
            
            disclosureMessage = isOver18 
                ? "ZKP Generated: Proven age >= 18 without revealing DOB." 
                : "ZKP Warning: Age verification failed (Under 18).";
            
            // 👇 THE NEW WAY: The backend already built the perfect W3C format for us!
            verifiablePresentation = data.presentation;

            setProofResult({
                status: isOver18 ? 'Success' : 'Warning',
                message: disclosureMessage,
                presentation: JSON.stringify(verifiablePresentation, null, 2)
            });

        // --- OPTION 2: REDACTED (Selective Disclosure) ---
        } else if (disclosureType === 'redacted') {
             disclosureMessage = "Redacted View Generated (Sensitive fields hidden).";
             
             // Create a deep copy to redact
             const redactedVc = JSON.parse(JSON.stringify(vcJson));
             // Dynamic Redaction based on selectedFields
             // Mapping UI Labels to VC JSON Keys
             const fieldMap = {
                 'Reg No': 'ID Number',
                 'Date of Birth': 'Date of Birth', // Or 'DOB' depending on your OCR
                 'Address': 'Address',
                 'Name': 'Name'
             };

             const frontClaims = redactedVc.credentialSubject.claims.front || {};
             const backClaims = redactedVc.credentialSubject.claims.back || {};

             // Remove fields NOT in selectedFields
             Object.entries(fieldMap).forEach(([uiLabel, jsonKey]) => {
                 if (!selectedFields.includes(uiLabel)) {
                     delete frontClaims[jsonKey];
                     delete backClaims[jsonKey];
                 }
             });

             verifiablePresentation = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "type": ["VerifiablePresentation", "RedactedDisclosure"],
                "holder": currentUser.did,
                "proof": {
                    "type": "JsonWebSignature2020",
                    "created": new Date().toISOString(),
                    "jws": "redacted-signature-mock"
                },
                "verifiableCredential": [redactedVc] 
            };
            
            setProofResult({
                status: 'Success',
                message: disclosureMessage,
                presentation: JSON.stringify(verifiablePresentation, null, 2)
            });

        // --- OPTION 3: FULL (Standard) ---
        } else {
            const mockSignature = `mock-signature-by-DID:${currentUser.did.substring(14, 20)}...`;
            
            verifiablePresentation = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "type": ["VerifiablePresentation", "FullDocumentDisclosure"],
                "holder": currentUser.did,
                "proof": {
                    "type": "JsonWebSignature2020",
                    "created": new Date().toISOString(),
                    "verificationMethod": currentUser.did + "#key-1",
                    "jws": mockSignature 
                },
                "verifiableCredential": [vcJson] 
            };
            
            setProofResult({
                status: 'Success',
                message: 'Full Identity Document ready to share.',
                presentation: JSON.stringify(verifiablePresentation, null, 2)
            });
        }

    } catch (e) {
        console.error("Proof Generation Error:", e);
        setProofResult({ status: 'Error', message: `Data Error: ${e.message}` });
    }
  };

  const handleOnlineSend = async () => {
    const currentUser = getCurrentUser();
    const password = getStoredPassword(); // FIXED ESLINT ERROR

    if (!proofResult || !proofResult.presentation) return;
    if (!selectedVerifier) {
        alert("Please select a verifier from the list first.");
        return;
    }
    // Define allowed fields for Redacted mode (Matches the redaction logic in handleGenerateProof)
    let fieldsToSend = "ALL";
    if (disclosureType === 'redacted') {
        fieldsToSend = selectedFields.join(',');
    } else if (disclosureType === 'zkp') {
        fieldsToSend = "AGE_CHECK_ONLY";
    }

    try {
      const response = await fetch('http://localhost:8080/api/verifier/submit-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`)
        },
        body: JSON.stringify({
          verifierEmail: selectedVerifier, // Send to selected verifier
          userEmail: currentUser.email,
          documentId: selectedDocument.id,
          documentName: selectedDocument.documentName,
          accessType: disclosureType.toUpperCase(), // FULL, REDACTED, ZKP
          vpJson: proofResult.presentation,
          allowedFields: fieldsToSend
        })
      });

      if (response.ok) {
        alert(`Proof successfully sent to ${selectedVerifier}!`);
        setIsSharingOpen(false);
      } else {
        const errText = await response.text();
        throw new Error(errText || "Failed to send proof");
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (isLoading) return <Box sx={{ p: 4 }}>Loading issued documents...</Box>;
  if (error) return <Alert severity="error" sx={{m: 2}}>Error: {error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedIcon /> Digital Wallet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and present your Verifiable Credentials
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>My Credentials</Typography>
          
          {documents.length === 0 ? (
            <Alert severity="info">No approved credentials yet.</Alert>
          ) : (
            <Grid container spacing={4} sx={{mb: 2}}>
              {documents.map((document) => (
                <Grid item xs={12} md={6} key={document.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      {/* Render the Digital ID Card */}
                      {document.verifiableCredential && (
                          <DigitalIDCard vcData={JSON.parse(document.verifiableCredential)} />
                      )}
                      <Button 
                          variant="contained" 
                          startIcon={<ShareIcon />}
                          onClick={() => openShareModal(document)}
                          sx={{ minWidth: 200 }}
                      >
                          Use Credential
                      </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
          <Button variant="outlined" onClick={() => navigate('/user')} sx={{mt: 3}}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
      
      {/* Proof Generation Modal */}
      <Dialog 
        open={isSharingOpen} 
        onClose={() => setIsSharingOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon /> Generate Proof
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>Sharing Mode</InputLabel>
            <Select
              value={disclosureType}
              label="Sharing Mode"
              onChange={(e) => {
                setDisclosureType(e.target.value);
                setProofResult(null);
              }}
            >
              <MenuItem value="full">Full Disclosure (Standard)</MenuItem>
              <MenuItem value="redacted">Redacted (Hide Sensitive Fields)</MenuItem>
              <MenuItem value="zkp">Zero Knowledge Proof (Age Only)</MenuItem>
            </Select>
          </FormControl>
          
          {/* Redaction Selection UI */}
          {disclosureType === 'redacted' && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight="bold" display="block" sx={{mb: 1}}>
                      TAP FIELDS TO SHARE:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                      {ALL_FIELDS.map(field => (
                          <Chip 
                              key={field} 
                              label={field} 
                              onClick={() => toggleField(field)}
                              color={selectedFields.includes(field) ? "primary" : "default"}
                              variant={selectedFields.includes(field) ? "filled" : "outlined"}
                              icon={selectedFields.includes(field) ? <CheckIcon /> : undefined}
                              clickable
                          />
                      ))}
                  </Stack>
              </Box>
          )}
          
          {!proofResult && (
             <Button
                variant="contained"
                size="large"
                onClick={handleGenerateProof}
                startIcon={<PersonIcon />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Generate Proof
              </Button>
          )}
          
          {proofResult && proofResult.status !== 'Error' && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Alert severity={proofResult.status === 'Success' ? 'success' : 'warning'} sx={{ mb: 2 }}>
                {proofResult.message}
              </Alert>

               {/* Action Buttons: Online vs In-Person */}
               <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <FormControl fullWidth sx={{ mb: 1 }}>
                        <InputLabel>Select Verifier to Send To</InputLabel>
                        <Select
                            value={selectedVerifier}
                            label="Select Verifier to Send To"
                            onChange={(e) => setSelectedVerifier(e.target.value)}
                        >
                            {verifiers.map((v) => (
                                <MenuItem key={v.id} value={v.email}>
                                    {v.name} ({v.email})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                   <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<SendIcon />}
                      onClick={handleOnlineSend}
                      disabled={!selectedVerifier}
                    >
                      Send Online
                    </Button>
                </Grid>
                <Grid item xs={6}>
                   <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<QrIcon />}
                      onClick={() => setViewMode(0)}
                    >
                      Show QR
                    </Button>
                </Grid>
              </Grid>

              {/* View Tabs */}
              <Tabs 
                value={viewMode} 
                onChange={(e, v) => setViewMode(v)} 
                centered 
                sx={{ mb: 2 }}
              >
                <Tab icon={<QrIcon />} label="Scan" />
                <Tab icon={<CodeIcon />} label="Raw Data" />
              </Tabs>

              {/* QR Code View */}
              {viewMode === 0 && (
                <Box sx={{ p: 2, background: 'white', display: 'inline-block', borderRadius: 2, boxShadow: 3 }}>
                   <QRCode value={proofResult.presentation} size={256} />
                   <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                     Ask Verifier to scan this code
                   </Typography>
                </Box>
              )}

              {/* Raw JSON View */}
              {viewMode === 1 && (
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={proofResult.presentation}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: '#f5f5f5', fontFamily: 'monospace' }}
                />
              )}
            </Box>
          )}

          {proofResult?.status === 'Error' && (
             <Alert severity="error">{proofResult.message}</Alert>
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