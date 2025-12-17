// This file is complete and includes DigitalIDCard, QR code, and Online Send
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
  Paper
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Share as ShareIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  QrCode as QrIcon,
  Code as CodeIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getStoredPassword } from '../services/authService';
import QRCode from 'react-qr-code';
import DigitalIDCard from '../components/DigitalIDCard'; // <--- ADDED

function IssuedDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [disclosureType, setDisclosureType] = useState('full'); 
  const [proofResult, setProofResult] = useState(null);
  const [viewMode, setViewMode] = useState(0);

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
    const storedPassword = getStoredPassword(); 
    
    if (!currentUser || !storedPassword) {
        setError("Session expired. Please log in.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/documents/my-documents', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${storedPassword}`) 
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
    setIsSharingOpen(true);
    setViewMode(0);
  };
  
  const handleGenerateProof = () => {
    const vcString = selectedDocument.verifiableCredential;
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      setProofResult({ status: 'Error', message: "User session expired. Cannot generate proof." });
      return;
    }

    try {
        const vcJson = JSON.parse(vcString);
        const claimsNode = vcJson.credentialSubject.claims; 
        const dob = claimsNode.back?.['Date Of Birth'] || claimsNode.back?.['DOB'];

        let verifiablePresentation;
        let disclosureMessage;

        if (disclosureType === 'age_proof') {
            const age = calculateAge(dob);
            const isOver21 = age !== null && age >= 21;
            
            disclosureMessage = isOver21 
                ? "Verified: Holder is over 21 years old." 
                : "Verification Failed: Holder is under 21.";
            
            verifiablePresentation = {
                "@context": ["https://www.w3.org/2018/credentials/v1"],
                "type": ["VerifiablePresentation", "AgeVerificationProof"],
                "holder": currentUser.did,
                "proof": {
                    "type": "ZeroKnowledgeProof",
                    "created": new Date().toISOString(),
                    "proofValue": `mock-zkp-over-21-${isOver21 ? 'TRUE' : 'FALSE'}_DID:${currentUser.did.substring(14, 20)}`,
                    "disclosedAttributes": { "age_over_21": isOver21 }
                },
                "verifiableCredential": [
                    { 
                        "id": "urn:uuid:selective-disclosure-proof",
                        "claims": { "ageVerification": isOver21, "documentType": selectedDocument.documentName } 
                    } 
                ]
            };

            setProofResult({
                status: isOver21 ? 'Success' : 'Warning',
                message: disclosureMessage,
                presentation: JSON.stringify(verifiablePresentation, null, 2)
            });

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
                message: 'Identity Verified. Ready to Share.',
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
    const password = getStoredPassword();

    if (!proofResult || !proofResult.presentation) return;

    try {
      const response = await fetch('http://localhost:8080/api/verifier/submit-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`)
        },
        body: JSON.stringify({
          documentName: selectedDocument.documentName,
          vpJson: proofResult.presentation
        })
      });

      if (response.ok) {
        alert("Proof sent successfully! The Verifier can now see it in their dashboard.");
        setIsSharingOpen(false);
      } else {
        throw new Error("Failed to send proof");
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
              <MenuItem value="full">Full Identity (Passport/Official)</MenuItem>
              <MenuItem value="age_proof">Age Only (buying restricted items)</MenuItem>
            </Select>
          </FormControl>

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
                <Grid item xs={6}>
                   <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<SendIcon />}
                      onClick={handleOnlineSend}
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