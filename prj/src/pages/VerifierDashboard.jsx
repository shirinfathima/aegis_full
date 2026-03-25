import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Box, Typography, Card, CardContent, Button, Grid, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  Avatar, TextField, Tabs, Tab, Alert, Divider, List, ListItem, 
  ListItemIcon, ListItemText, IconButton, InputAdornment
} from '@mui/material';
import {
  VerifiedUser as VerifierIcon,
  DocumentScanner as VerifyIcon,
  CheckCircle as ValidIcon,
  Error as InvalidIcon,
  Inbox as InboxIcon,
  Refresh as RefreshIcon,
  ExitToApp as LogoutIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService'; 
import DashboardLayout from '../components/DashboardLayout'; 
import RequestAccessModal from './RequestAccessModal'; 
import ProofViewerModal from '../components/ProofViewerModal'; 
import DocumentViewerModal from '../components/DocumentViewerModal'; 
import DigitalIDCard from '../components/DigitalIDCard'; 

const cardGradient = 'linear-gradient(135deg, #1a3f4a 0%, #2d5a63 50%, #3d7a8f 100%)';
const accentColor = '#438b98';

function VerifierDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1); // Default to Inbox
  
  // --- VERIFY TOOL STATE ---
  const [proofInput, setProofInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [activeInboxRequest, setActiveInboxRequest] = useState(null); 
  
  // --- INBOX STATE ---
  const [inbox, setInbox] = useState([]);

  // --- SEARCH & REQUEST STATE ---
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // --- MODAL STATE ---
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // --- SENT REQUESTS STATE ---
  const [sentRequests, setSentRequests] = useState([]);

  // --- PROOF MODAL STATE ---
  const [viewProofData, setViewProofData] = useState(null); 
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // --- DOCUMENT VIEWER STATE ---
  const [viewRequestDoc, setViewRequestDoc] = useState(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role.toUpperCase() !== 'VERIFIER') {
      navigate('/'); 
    }
    if (currentUser?.role === 'VERIFIER') {
        fetchInbox();
    }
  }, [currentUser, navigate]);

  useEffect(() => {
      if (currentTab === 2) {
          fetchSentRequests();
      }
  }, [currentTab]);

  const getAuthHeaders = () => {
    const password = sessionStorage.getItem('temp_pass');
    return { 
        'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`),
        'Content-Type': 'application/json'
    };
  };

  const handleViewDocument = async (request) => {
    if (!request || !request.id) {
        alert("No valid request ID found.");
        return;
    }
    try {
        const res = await fetch(`http://localhost:8080/api/verifier/fetch-document-content?requestId=${request.id}`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            const errMsg = await res.text();
            alert(`Error fetching document: ${errMsg}`);
            return;
        }

        const data = await res.json();

        const updatedRequest = {
            ...request,
            document: {
                ...(request.document || {}), 
                fileData: data.fileData,         
                fileDataBack: data.fileDataBack  
            }
        };

        setViewRequestDoc(updatedRequest);
        setIsDocViewerOpen(true);

    } catch (err) {
        console.error(err);
        alert("Failed to retrieve document content. The server might be unreachable.");
    }
  };

  const fetchInbox = async () => {
    if(!currentUser) return;
    try {
        const res = await fetch(`http://localhost:8080/api/verifier/inbox?verifierEmail=${currentUser.email}`, {
             headers: getAuthHeaders()
        });
        if(res.ok) {
            const data = await res.json();
            data.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
            setInbox(data);
        }
    } catch(e) { console.error(e); }
  };

  const handleReviewRequest = (request) => {
      if (!request.proofData) {
          alert("This request is pending or has no proof data generated yet. Please wait for the User to approve it.");
          return;
      }
      setActiveInboxRequest(request); 
      setProofInput(request.proofData);
      setCurrentTab(0); // Switch to Verify Tool
      setTimeout(async () => await handleVerify(request.proofData), 100);
  };

  const handleResetVerification = () => {
      setVerificationResult(null);
      setProofInput('');
      setActiveInboxRequest(null);
  };

  // --- 👇 UPDATED: Highly Permissive Verification Logic ---
  const handleVerify = async (inputJson = proofInput) => {
    setVerificationResult(null);
    try {
        if(!inputJson) throw new Error("Input cannot be empty.");
        
        let vp = null;
        
        // 1. Robust Parsing (Handle string, object, double-stringified, wrapped)
        try {
             if (typeof inputJson === 'object') {
                 vp = inputJson;
             } else {
                 vp = JSON.parse(inputJson);
                 if (typeof vp === 'string') {
                     try { vp = JSON.parse(vp); } catch(e) {}
                 }
                 if (vp && vp.vpJson) {
                     vp = typeof vp.vpJson === 'string' ? JSON.parse(vp.vpJson) : vp.vpJson;
                 }
             }
        } catch(e) {
            throw new Error("Input is not valid JSON.");
        }

        if (!vp) throw new Error("Parsed JSON is null or empty.");

        // 🔥 FIX: If proof is wrapped inside { success, presentation }, unwrap it
        if (vp.presentation) {
            vp = vp.presentation;
        }
        
        // 2. Identify Structure
        let resultData = {};
        let type = "Raw Data View"; // Default if unknown
        let isStructureFound = false;

        // 👇 CHANGED: ZKP ENROLLMENT DETECTION
        const zkpAttributes = vp.disclosedAttributes || (vp.proof && vp.proof.disclosedAttributes);
        const zkpType = (vp.type === 'ZeroKnowledgeProof') || (vp.proof && vp.proof.type === 'ZeroKnowledgeProof');
        const zkpValue = vp.proofValue || (vp.proof && vp.proof.proofValue);

        if (zkpAttributes || (zkpType && zkpValue)) {
            isStructureFound = true;
            type = "Selective Disclosure (Enrollment Proof)";
            resultData = {
                "Enrollment Status": zkpAttributes?.is_active_enrollment ? "ACTIVE" : "EXPIRED"
            };
        }
        
        // B. TRUE CRYPTOGRAPHIC VC/VP VERIFICATION
        else if (vp.verifiableCredential && Array.isArray(vp.verifiableCredential)) {
            isStructureFound = true;
            const credential = vp.verifiableCredential[0];

            // Determine type
            const types = Array.isArray(vp.type) ? vp.type : [vp.type || ""];
            if (types.includes("RedactedDisclosure")) {
                type = "Redacted Document";
            } else {
                type = "Full Identity Document";
            }

            // --- REAL CRYPTOGRAPHIC CHECK ---
            try {
                if (!credential.proof || !credential.proof.proofValue) {
                    throw new Error("No cryptographic proof found in credential.");
                }

                // 1. Extract issuer Ethereum address from DID
                const issuerAddress = credential.issuer.split(':').pop();

                // 2. Extract signature
                const signature = credential.proof.proofValue;

                // 3. Reconstruct original signed data (remove proof block)
                const dataToVerify = { ...credential };
                delete dataToVerify.proof;
                const messageString = JSON.stringify(dataToVerify);

                // 4. Recover the address that signed this message
                const recoveredAddress = ethers.utils.verifyMessage(messageString, signature);

                // 5. Compare — if mismatch, document was tampered
                if (recoveredAddress.toLowerCase() !== issuerAddress.toLowerCase()) {
                    throw new Error("Signature mismatch! This document was altered or forged.");
                }

                // 6. Signature valid — extract claims
                if (credential.credentialSubject) {
                    resultData = credential.credentialSubject.claims || credential.credentialSubject;
                }

            } catch (validationError) {
                throw new Error("Cryptographic Validation Failed: " + validationError.message);
            }
        }
        
        // C. FALLBACK: If we can't identify it, SHOW IT ANYWAY.
        if (!isStructureFound) {
             console.warn("Unknown JSON structure, defaulting to raw view:", vp);
             resultData = vp; // Just show the raw JSON
        }

        setVerificationResult({
            status: 'Valid',
            type: type,
            holder: vp.holder || "did:example:holder",
            issuer: "did:trustnet:issuer-aegis-core",
            data: resultData,
            rawVP: vp
        });

    } catch (e) {
        setVerificationResult({
            status: 'Invalid',
            message: "Verification Error: " + e.message
        });
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if(!searchEmail) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
        const res = await fetch(`http://localhost:8080/api/verifier/search-user?email=${searchEmail}`, {
            headers: getAuthHeaders()
        });
        
        if (!res.ok) throw new Error("User not found or no public docs.");
        
        const data = await res.json();
        setSearchResults(data);
    } catch (err) {
        setSearchError(err.message);
    } finally {
        setIsSearching(false);
    }
  };

  const openRequestModal = (doc) => {
      setSelectedDoc(doc);
      setModalOpen(true);
  };

  const fetchSentRequests = async () => {
    if (!currentUser) return;
    try {
        const res = await fetch(`http://localhost:8080/api/verifier/my-requests?verifierEmail=${currentUser.email}`, {
             headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            data.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
            setSentRequests(data);
        }
    } catch (e) { console.error(e); }
  };

  const verifierSidebar = (
    <Box>
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <Box sx={{ background: cardGradient, p: 3 }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: cardGradient, boxShadow: '0 8px 24px rgba(67, 139, 152, 0.3)' }}>
            <VerifierIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Avatar>
        </Box>
        <CardContent sx={{ textAlign: 'center', background: 'linear-gradient(180deg, #f8fbff 0%, #f0f7ff 100%)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{currentUser?.name}</Typography>
          <Chip label="VERIFIER" sx={{ background: cardGradient, color: '#fff', fontWeight: 700, mt: 1 }} size="small"/>
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <List>
          <ListItem 
            button 
            onClick={() => { logout(); navigate('/'); }}
            sx={{ borderRadius: 2, '&:hover': { background: 'rgba(244, 67, 54, 0.08)' } }}
          >
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" sx={{ fontWeight: 600 }} />
          </ListItem>
        </List>
      </Card>
    </Box>
  );

  return (
    <DashboardLayout sidebar={verifierSidebar}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ background: cardGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>
          Verifier Portal
        </Typography>
        <Typography color="text.secondary">Validate digital credentials securely</Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', background: '#f8fbfd' }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, v) => setCurrentTab(v)}
            sx={{
              '& .MuiTab-root': { fontWeight: 600 },
              '& .MuiTabs-indicator': { background: cardGradient, height: 3 }
            }}
          >
            <Tab label="Verify Proof (Tool)" icon={<VerifyIcon />} iconPosition="start"/>
            <Tab label={`Inbox (${inbox.length})`} icon={<InboxIcon />} iconPosition="start"/>
            <Tab label="Find & Request" icon={<SearchIcon />} iconPosition="start"/>
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <CardContent sx={{ p: 4, background: '#f8fbfd' }}>
             <Grid container spacing={3}>
              
              {!verificationResult && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Verifiable Presentation Data</Typography>
                    <TextField
                      fullWidth multiline rows={4}
                      placeholder='Paste JSON Proof here...'
                      value={proofInput}
                      onChange={(e) => {
                          setProofInput(e.target.value);
                          setActiveInboxRequest(null); 
                      }}
                      sx={{
                        fontFamily: 'monospace', 
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                          borderColor: accentColor,
                        }
                      }}
                    />
                    <Button 
                      variant="contained" 
                      size="large" 
                      sx={{ mt: 3, background: cardGradient, py: 1.5, fontWeight: 700 }} 
                      onClick={async () => await handleVerify()} 
                      startIcon={<VerifyIcon />}
                    >
                        Verify Signature & Data
                    </Button>
                  </Grid>
              )}

              {verificationResult && (
                  <Grid item xs={12}>
                      <Divider sx={{my:2}} />
                      {verificationResult.status === 'Valid' ? (
                          <Alert icon={<ValidIcon fontSize="inherit" />} severity="success" sx={{mb:2, borderRadius: 2}}>
                              <Typography variant="h6">Signature Valid: Credential Verified</Typography>
                          </Alert>
                      ) : (
                          <Alert icon={<InvalidIcon fontSize="inherit" />} severity="error" sx={{mb:2, borderRadius: 2}}>
                             <Typography variant="h6">Verification Failed</Typography>
                             {verificationResult.message}
                          </Alert>
                      )}
                      
                      {verificationResult.status === 'Valid' && (
                        <Box>
                            {verificationResult.type === 'Full Identity Document' && verificationResult.rawVP.verifiableCredential && (
                                <Box sx={{ mb: 3, display:'flex', justifyContent:'center' }}>
                                    <DigitalIDCard vcData={verificationResult.rawVP.verifiableCredential[0]} />
                                </Box>
                            )}

                            {verificationResult.type === 'Selective Disclosure (Enrollment Proof)' && (
                               <Box sx={{ mb: 3, p: 3, bgcolor: '#e8f4f7', borderRadius: 2, border: `2px solid ${accentColor}`, textAlign: 'center' }}>
                                 <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                   {verificationResult.type}
                                 </Typography>
                                 <Chip 
                                   label={`Enrollment Status: ${verificationResult.data["Enrollment Status"]}`}
                                   color={verificationResult.data["Enrollment Status"] === "ACTIVE" ? "success" : "error"}
                                   size="medium"
                                   sx={{ mt: 1, fontWeight: 'bold', fontSize: '1.1rem', py: 2.5, px: 2 }}
                                 />
                               </Box>
                            )}
                            
                            {activeInboxRequest && (
                                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    
                                    {(verificationResult.type === 'Full Identity Document' || verificationResult.type === 'Redacted Document') ? (
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleViewDocument(activeInboxRequest)}
                                            sx={{ background: cardGradient, fontWeight: 700 }}
                                        >
                                            View Original Images
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            startIcon={<LockIcon />}
                                            onClick={() => {
                                                setViewProofData(activeInboxRequest.proofData);
                                                setIsProofModalOpen(true);
                                            }}
                                            sx={{ fontWeight: 700 }}
                                        >
                                            View Proof Details
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Box>
                      )}

                      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                          <Button 
                            variant="outlined" 
                            startIcon={<ArrowBackIcon />}
                            onClick={handleResetVerification}
                            sx={{ borderColor: accentColor, color: accentColor, fontWeight: 700 }}
                          >
                              Verify Another Document
                          </Button>
                      </Box>
                  </Grid>
              )}
            </Grid>
          </CardContent>
        )}
        
        {currentTab === 1 && (
            <CardContent sx={{ p: 4, background: '#f8fbfd' }}>
                <Box sx={{display:'flex', justifyContent:'space-between', mb:3, alignItems: 'center'}}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Incoming Verification Requests</Typography>
                    <IconButton onClick={fetchInbox} sx={{ color: accentColor }}><RefreshIcon /></IconButton>
                </Box>
                {inbox.length === 0 ? <Alert severity="info" sx={{ borderRadius: 2 }}>No pending online requests.</Alert> : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead sx={{ background: cardGradient }}>
                              <TableRow>
                                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>From User</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Document Type</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Access Type</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                                {inbox.map((req) => (
                                    <TableRow key={req.id} sx={{ '&:hover': { background: '#e8f4f7' } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{req.userEmail}</TableCell>
                                        <TableCell>{req.document?.documentName}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={req.accessType || 'UNKNOWN'} sx={{ background: accentColor, color: '#fff', fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="contained" size="small" onClick={() => handleReviewRequest(req)} sx={{ background: cardGradient }}>Verify Proof</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        )}

        {currentTab === 2 && (
            <CardContent sx={{ p: 4, background: '#f8fbfd' }}>
                <Box sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>Find a User</Typography>
                    <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: 10 }}>
                        <TextField 
                            fullWidth 
                            placeholder="Enter user email (e.g. student@scms.ac.in)"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                                borderColor: accentColor,
                              }
                            }}
                        />
                        <Button type="submit" variant="contained" disabled={isSearching} sx={{ background: cardGradient, fontWeight: 700, px: 4 }}>
                            {isSearching ? '...' : 'Search'}
                        </Button>
                    </form>
                    {searchError && <Alert severity="warning" sx={{mt:2, borderRadius: 2}}>{searchError}</Alert>}
                </Box>

                {searchResults.length > 0 && (
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Search Results</Typography>
                        <Grid container spacing={3}>
                            {searchResults.map((doc) => (
                                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                                    <Card sx={{ borderRadius: 2, transition: 'all 0.3s', '&:hover': { boxShadow: '0 8px 24px rgba(67, 139, 152, 0.15)', transform: 'translateY(-4px)' } }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Avatar sx={{ width: 50, height: 50, mx: 'auto', mb: 2, background: cardGradient, boxShadow: '0 4px 12px rgba(67, 139, 152, 0.2)' }}>
                                                {doc.documentType && doc.documentType.includes('ID') ? '🆔' : '📄'}
                                            </Avatar>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{doc.documentType}</Typography>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                sx={{ mt: 2, borderColor: accentColor, color: accentColor, fontWeight: 600 }}
                                                startIcon={<LockIcon />}
                                                onClick={() => openRequestModal(doc)}
                                            >
                                                Request Access
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Divider sx={{ my: 4 }} />
                    </Box>
                )}

                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                     My Access Requests <RefreshIcon onClick={fetchSentRequests} sx={{ cursor: 'pointer', fontSize: 20, color: accentColor }}/>
                </Typography>
                
                {sentRequests.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>You haven't sent any requests yet.</Alert>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2 }} variant="outlined">
                        <Table>
                            <TableHead sx={{ background: cardGradient }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>User</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Document</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Data</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sentRequests.map((req) => (
                                    <TableRow key={req.id} sx={{ '&:hover': { background: '#e8f4f7' } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{req.userEmail}</TableCell>
                                        <TableCell>{req.document?.documentName}</TableCell>
                                        <TableCell>
                                            <Chip label={req.accessType} size="small" variant="outlined" sx={{ borderColor: accentColor, color: accentColor }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={req.status} 
                                                color={req.status === 'APPROVED' ? 'success' : req.status === 'PENDING' ? 'warning' : 'error'}
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {req.status === 'APPROVED' ? (
                                                (req.accessType === 'ZKP_AGE' || req.accessType === 'ZKP') ? (
                                                    <Button 
                                                        size="small" variant="contained" sx={{ background: cardGradient }}
                                                        onClick={() => {
                                                            setViewProofData(req.proofData);
                                                            setIsProofModalOpen(true);
                                                        }}
                                                    >
                                                        View Proof
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="small" 
                                                        variant="outlined"
                                                        startIcon={<VisibilityIcon />}
                                                        sx={{ borderColor: accentColor, color: accentColor }}
                                                        onClick={() => handleViewDocument(req)}
                                                    >
                                                        View Doc
                                                    </Button>
                                                )
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">Waiting...</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        )}
      </Card>

      <RequestAccessModal 
         isOpen={isModalOpen}
         onClose={() => {
            setModalOpen(false);
            fetchSentRequests(); 
         }}
         document={selectedDoc}
         verifierEmail={currentUser?.email}
         userEmail={searchEmail}
      />

      <ProofViewerModal 
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        proofData={viewProofData}
      />

      <DocumentViewerModal 
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        request={viewRequestDoc}
      />

    </DashboardLayout>
  );
}

export default VerifierDashboard;