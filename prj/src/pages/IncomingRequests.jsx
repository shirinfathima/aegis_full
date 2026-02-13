import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Select, MenuItem, FormControl, Alert, Chip, CircularProgress 
} from '@mui/material';
import { AccessTime, CheckCircle, Cancel, Security, Visibility } from '@mui/icons-material';

const IncomingRequests = ({ userEmail }) => {
  const [requests, setRequests] = useState([]);
  const [durations, setDurations] = useState({}); 
  const [processingId, setProcessingId] = useState(null); 

  useEffect(() => {
    if(userEmail) fetchRequests();
  }, [userEmail]);

  const fetchRequests = async () => {
    const password = sessionStorage.getItem('temp_pass');
    try {
      const response = await fetch(`http://localhost:8080/api/user/requests?email=${userEmail}`, {
        headers: { 'Authorization': 'Basic ' + btoa(`${userEmail}:${password}`) }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.filter(r => r.status === 'PENDING'));
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleDurationChange = (reqId, minutes) => {
    setDurations({ ...durations, [reqId]: minutes });
  };

  // 👇 HELPER: Generate VP (Redacted / Full / ZKP)
  const generatePresentation = (request, type) => {
      try {
          const vcData = JSON.parse(request.document.verifiableCredential || "{}");
          let presentation = {};
          
          // --- 1. ZKP LOGIC (Using the Mock JSON you requested) ---
          if (type === 'ZKP') {
              const rawZkProof = {
                "curve": "bn128",
                "scheme": "groth16",
                "a": ["0x1a2b3c4d5e6f...", "0x4d5e6f7a8b9c..."],
                "b": [
                  ["0x7a8b9c0d1e2f...", "0x0d1e2f3a4b5c..."],
                  ["0x3a4b5c6d7e8f...", "0x6d7e8f9a8b7c..."]
                ],
                "c": ["0x9a8b7c6d5e4f...", "0x6d5e4f3a2b1c..."]
              };

              presentation = {
                  "@context": ["https://www.w3.org/2018/credentials/v1"],
                  "type": ["VerifiablePresentation", "AgeVerificationProof"],
                  "holder": "did:example:holder",
                  "proof": {
                      "type": "ZeroKnowledgeProof",
                      "created": new Date().toISOString(),
                      "proofValue": rawZkProof,
                      "disclosedAttributes": {
                        "age_over_21": true
                      }
                  },
                  "verifiableCredential": [
                     { "id": "urn:uuid:masked-credential", "proofType": "ZKP" }
                  ]
              };

          // --- 2. REDACTED LOGIC ---
          } else if (type === 'REDACTED') {
              const redactedVc = JSON.parse(JSON.stringify(vcData));
              const allowedList = (request.allowedFields || "").toLowerCase();
              
              const frontClaims = redactedVc.credentialSubject.claims.front || {};
              const backClaims = redactedVc.credentialSubject.claims.back || {};
              const allKeys = [...Object.keys(frontClaims), ...Object.keys(backClaims)];
              
              allKeys.forEach(key => {
                  if (!allowedList.includes(key.toLowerCase())) {
                      delete frontClaims[key];
                      delete backClaims[key];
                  }
              });

              presentation = {
                  "@context": ["https://www.w3.org/2018/credentials/v1"],
                  "type": ["VerifiablePresentation", "RedactedDisclosure"],
                  "holder": "did:example:holder",
                  "proof": {
                      "type": "JsonWebSignature2020",
                      "created": new Date().toISOString(),
                      "jws": "mock-redacted-signature"
                  },
                  "verifiableCredential": [redactedVc]
              };
              
          // --- 3. FULL LOGIC ---
          } else {
              presentation = {
                  "@context": ["https://www.w3.org/2018/credentials/v1"],
                  "type": ["VerifiablePresentation", "FullDocumentDisclosure"],
                  "holder": "did:example:holder",
                  "proof": {
                      "type": "JsonWebSignature2020",
                      "created": new Date().toISOString(),
                      "jws": "mock-full-signature"
                  },
                  "verifiableCredential": [vcData]
              };
          }
          
          return JSON.stringify(presentation);
      } catch (e) {
          console.error("VP Gen Error", e);
          return null;
      }
  };

  const handleResponse = async (request, status) => {
    setProcessingId(request.id);
    const password = sessionStorage.getItem('temp_pass');
    const duration = durations[request.id] || 60;
    let proofData = null;

    try {
      // --- 1. GENERATE PROOF BASED ON TYPE ---
      if (status === 'APPROVED') {
          // Check for both ZKP_AGE and ZKP
          const isZKP = request.accessType === 'ZKP_AGE' || request.accessType === 'ZKP';
          
          if (isZKP) {
            // FORCE Client-Side Mock Generation (No Backend Call)
            proofData = generatePresentation(request, 'ZKP');
          } else if (request.accessType === 'REDACTED') {
            proofData = generatePresentation(request, 'REDACTED');
          } else {
            proofData = generatePresentation(request, 'FULL');
          }
      }

      // --- 2. SEND RESPONSE ---
      const payload = {
        requestId: request.id,
        status: status,
        durationInMinutes: duration,
        generatedProof: proofData 
      };

      await fetch('http://localhost:8080/api/user/respond-request', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${userEmail}:${password}`)
        },
        body: JSON.stringify(payload)
      });
      
      setRequests(requests.filter(r => r.id !== request.id));
      
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Error: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card sx={{ mt: 3, mb: 3, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
          <AccessTime /> Incoming Access Requests
        </Typography>
        
        {requests.length === 0 ? (
          <Alert severity="info">No pending requests.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Requester</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Access Duration</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => {
                  const isZKP = req.accessType === 'ZKP_AGE' || req.accessType === 'ZKP';
                  return (
                  <TableRow key={req.id}>
                    <TableCell>
                        <Typography variant="body2" fontWeight="bold">{req.verifierEmail}</Typography>
                        <Typography variant="caption">{req.document?.documentName}</Typography>
                    </TableCell>
                    
                    <TableCell>
                        {isZKP ? (
                            <Chip icon={<Security />} label="ZK Proof" color="success" size="small" variant="outlined" />
                        ) : req.accessType === 'REDACTED' ? (
                            <Chip icon={<Visibility />} label="Redacted" color="warning" size="small" variant="outlined" />
                        ) : (
                            <Chip icon={<Visibility />} label="Full View" color="primary" size="small" variant="outlined" />
                        )}
                    </TableCell>
                    
                    <TableCell>
                      <FormControl size="small">
                        <Select
                          value={durations[req.id] || 60}
                          onChange={(e) => handleDurationChange(req.id, e.target.value)}
                          sx={{ minWidth: 120, bgcolor: 'white' }}
                        >
                          <MenuItem value={15}>15 Minutes</MenuItem>
                          <MenuItem value={60}>1 Hour</MenuItem>
                          <MenuItem value={1440}>24 Hours</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    <TableCell align="right">
                      <Button 
                        variant="contained" color="success" size="small" 
                        disabled={processingId === req.id}
                        startIcon={processingId === req.id ? <CircularProgress size={16} color="inherit"/> : <CheckCircle />}
                        onClick={() => handleResponse(req, 'APPROVED')}
                        sx={{ mr: 1 }}
                      >
                        {isZKP ? "Gen Proof" : "Approve"}
                      </Button>
                      <Button 
                        variant="outlined" color="error" size="small" 
                        disabled={processingId === req.id}
                        startIcon={<Cancel />}
                        onClick={() => handleResponse(req, 'REJECTED')}
                      >
                        Deny
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomingRequests;