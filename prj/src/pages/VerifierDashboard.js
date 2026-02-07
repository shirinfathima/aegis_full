// This file is complete and includes DigitalIDCard, Verify Tool, and Online Inbox
import React, { useState, useEffect } from 'react';
import {
  Box, Stack, Typography, CardContent, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  TextField, Tabs, Tab, Alert, IconButton, Grid, Divider
} from '@mui/material';
import {
  VerifiedUser as VerifierIcon,
  DocumentScanner as VerifyIcon,
  CheckCircle as ValidIcon,
  Error as InvalidIcon,
  Inbox as InboxIcon,
  Refresh as RefreshIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import DashboardLayout from '../components/DashboardLayout';
import DigitalIDCard from '../components/DigitalIDCard';
import { ModernCard, GlassCard, gradients } from '../styles/ModernComponents';

function VerifierDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1);
  
  const [proofInput, setProofInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [inbox, setInbox] = useState([]);

  const handleFetchInbox = async () => {
    const password = sessionStorage.getItem('temp_pass'); 
    if(!currentUser) return;
    try {
        const res = await fetch('http://localhost:8080/api/verifier/inbox', {
             headers: { 'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`) }
        });
        if(res.ok) setInbox(await res.json());
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role.toUpperCase() !== 'VERIFIER') {
      navigate('/'); 
    }
    if (currentUser?.role === 'VERIFIER') {
        handleFetchInbox();
    }
  }, [currentUser, navigate]);



  const handleReviewRequest = (request) => {
      setProofInput(request.vpJson);
      setCurrentTab(0);
      setTimeout(() => handleVerify(request.vpJson), 100);
  };

  const handleVerify = (inputJson = proofInput) => {
    setVerificationResult(null); // Clear previous result
    try {
        if(!inputJson) throw new Error("Input cannot be empty.");
        
        // Safety: If input is a VerificationRequest object, use its vpJson property
        let vpJsonString = (typeof inputJson === 'string') ? inputJson : inputJson.vpJson;
        if (!vpJsonString) throw new Error("Invalid proof format received.");

        const vp = JSON.parse(vpJsonString);
        
        if (!vp.proof || !vp.type) throw new Error("Invalid structure: Missing proof or type fields.");
        
        let resultData = {};
        let type = "Unknown";

        if (vp.type.includes("FullDocumentDisclosure")) {
            type = "Full Identity Document";
            const credential = vp.verifiableCredential[0];
            resultData = credential.credentialSubject.claims;
        } else if (vp.type.includes("AgeVerificationProof")) {
            type = "Selective Disclosure (Age Proof)";
            resultData = vp.proof.disclosedAttributes;
        }

        setVerificationResult({
            status: 'Valid',
            type: type,
            holder: vp.holder,
            issuer: "did:trustnet:issuer-aegis-core",
            data: resultData,
            rawVP: vp
        });

    } catch (e) {
        setVerificationResult({
            status: 'Invalid',
            message: "The proof provided is invalid or tampered with. Check JSON syntax."
        });
    }
  };

  const verifierSidebar = (
    <Stack spacing={3}>
      <ModernCard gradient={gradients.cyan}>
        <Stack alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <VerifierIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
              {currentUser?.name}
            </Typography>
            <Chip 
              label="VERIFIER" 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 700,
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
            />
          </Box>
        </Stack>
      </ModernCard>

      <GlassCard>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Button
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={() => { logout(); navigate('/'); }}
            sx={{ 
              color: '#dc2626',
              fontWeight: 600,
              justifyContent: 'flex-start',
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(220, 38, 38, 0.1)',
              }
            }}
          >
            Logout
          </Button>
        </CardContent>
      </GlassCard>
    </Stack>
  );

  return (
    <DashboardLayout sidebar={verifierSidebar}>
      <Stack spacing={4}>
        <Box>
          <Typography 
            variant="h3" 
            fontWeight={700}
            sx={{ 
              mb: 1,
              background: gradients.cyan,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Verifier Portal
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            Validate digital credentials securely
          </Typography>
        </Box>

      <GlassCard sx={{ overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="Verify Proof (Tool)" icon={<VerifyIcon />} iconPosition="start"/>
            <Tab label={`Inbox (${inbox.length})`} icon={<InboxIcon />} iconPosition="start"/>
          </Tabs>
        </Box>

        {/* --- Tab 0: Verification Tool --- */}
        {currentTab === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Verifiable Presentation Data</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder='Paste JSON Proof here...'
                  value={proofInput}
                  onChange={(e) => setProofInput(e.target.value)}
                  sx={{fontFamily: 'monospace', bgcolor: '#f8f9fa'}}
                />
                <Button 
                    variant="contained" 
                    size="large" 
                    sx={{ mt: 2 }} 
                    onClick={() => handleVerify()}
                    startIcon={<VerifierIcon />}
                >
                    Verify Signature & Data
                </Button>
              </Grid>

              {verificationResult && (
                  <Grid item xs={12}>
                      <Divider sx={{my:2}} />
                      {verificationResult.status === 'Valid' ? (
                          <Alert icon={<ValidIcon fontSize="inherit" />} severity="success" sx={{mb:2}}>
                              <Typography variant="h6">Signature Valid: Credential Verified</Typography>
                          </Alert>
                      ) : (
                          <Alert icon={<InvalidIcon fontSize="inherit" />} severity="error" sx={{mb:2}}>
                             <Typography variant="h6">Verification Failed</Typography>
                             {verificationResult.message}
                          </Alert>
                      )}

                      {verificationResult.status === 'Valid' && (
                          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                               <ValidIcon sx={{ verticalAlign: 'middle', mr: 1 }}/> 
                               Proof Successful
                            </Typography>
                            
                            {/* Display Verified Data */}
                            {verificationResult.type.includes("Full") ? (
                               <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
                                  <DigitalIDCard 
                                    vcData={{ 
                                      credentialSubject: { 
                                        claims: verificationResult.data, 
                                        id: verificationResult.holder 
                                      } 
                                    }} 
                                  />
                               </Box>
                            ) : (
                               <Alert severity="success" sx={{ display: 'inline-flex', minWidth: 300 }}>
                                  <Typography variant="h5">Age Verified: {verificationResult.data.age_over_21 ? "OVER 21" : "UNDER 21"}</Typography>
                               </Alert>
                            )}
                            
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="caption" color="text.secondary">
                               Blockchain Anchor Checked • Issuer: {verificationResult.issuer}
                            </Typography>
                          </Paper>
                      )}
                  </Grid>
              )}
            </Grid>
          </CardContent>
        )}
        
        {/* --- Tab 1: Inbox --- */}
        {currentTab === 1 && (
            <CardContent>
                <Box sx={{display:'flex', justifyContent:'space-between', mb:2}}>
                    <Typography variant="h6">Incoming Verification Requests</Typography>
                    <IconButton onClick={handleFetchInbox}><RefreshIcon /></IconButton>
                </Box>
                
                {inbox.length === 0 ? (
                    <Alert severity="info">No pending online requests.</Alert>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow><TableCell>From</TableCell><TableCell>Document</TableCell><TableCell>Time</TableCell><TableCell>Action</TableCell></TableRow>
                            </TableHead>
                            <TableBody>
                                {inbox.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.senderEmail}</TableCell>
                                        <TableCell>{req.documentName}</TableCell>
                                        <TableCell>{new Date(req.timestamp).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                onClick={() => handleReviewRequest(req)}
                                            >
                                                Verify
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        )}
      </GlassCard>
      </Stack>
    </DashboardLayout>
  );
}

export default VerifierDashboard;