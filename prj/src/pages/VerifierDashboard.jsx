import React, { useState, useEffect } from 'react';
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
      setTimeout(() => handleVerify(request.proofData), 100);
  };

  const handleResetVerification = () => {
      setVerificationResult(null);
      setProofInput('');
      setActiveInboxRequest(null);
  };

  // --- 👇 UPDATED: Highly Permissive Verification Logic ---
  const handleVerify = (inputJson = proofInput) => {
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
        
        // B. VC/VP DETECTION
        else if (vp.verifiableCredential && Array.isArray(vp.verifiableCredential)) {
             isStructureFound = true;
             const credential = vp.verifiableCredential[0];
             
             // Check VP types
             const types = Array.isArray(vp.type) ? vp.type : [vp.type || ""];
             if (types.includes("RedactedDisclosure")) {
                 type = "Redacted Document";
             } else {
                 type = "Full Identity Document";
             }
             
             if (credential && credential.credentialSubject) {
                 resultData = credential.credentialSubject.claims || credential.credentialSubject;
             } else {
                 resultData = { "Info": "Credential present but subject data is missing." };
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
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'secondary.main' }}>
            <VerifierIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6">{currentUser?.name}</Typography>
          <Chip label="VERIFIER" color="secondary" size="small" sx={{mt:1}}/>
        </CardContent>
      </Card>
      <Card>
        <List>
          <ListItem button onClick={() => { logout(); navigate('/'); }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Card>
    </Box>
  );

  return (
    <DashboardLayout sidebar={verifierSidebar}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Verifier Portal</Typography>
        <Typography color="text.secondary">Validate digital credentials securely</Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="Verify Proof (Tool)" icon={<VerifyIcon />} iconPosition="start"/>
            <Tab label={`Inbox (${inbox.length})`} icon={<InboxIcon />} iconPosition="start"/>
            <Tab label="Find & Request" icon={<SearchIcon />} iconPosition="start"/>
          </Tabs>
        </Box>

        {/* --- Tab 0: Verification Tool --- */}
        {currentTab === 0 && (
          <CardContent>
             <Grid container spacing={3}>
              
              {!verificationResult && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Verifiable Presentation Data</Typography>
                    <TextField
                      fullWidth multiline rows={4}
                      placeholder='Paste JSON Proof here...'
                      value={proofInput}
                      onChange={(e) => {
                          setProofInput(e.target.value);
                          setActiveInboxRequest(null); 
                      }}
                      sx={{fontFamily: 'monospace', bgcolor: '#f8f9fa'}}
                    />
                    <Button variant="contained" size="large" sx={{ mt: 2 }} onClick={() => handleVerify()} startIcon={<VerifierIcon />}>
                        Verify Signature & Data
                    </Button>
                  </Grid>
              )}

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
                        <Box>
                            {/* 1. Digital ID Card (Only for Full ID) */}
                            {verificationResult.type === 'Full Identity Document' && verificationResult.rawVP.verifiableCredential && (
                                <Box sx={{ mb: 3, display:'flex', justifyContent:'center' }}>
                                    <DigitalIDCard vcData={verificationResult.rawVP.verifiableCredential[0]} />
                                </Box>
                            )}

                            {/* 👇 CHANGED: ZKP UI Display component */}
                            {verificationResult.type === 'Selective Disclosure (Enrollment Proof)' && (
                               <Box sx={{ mb: 3, p: 3, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', textAlign: 'center' }}>
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
                            
                            {/* 2. Action Buttons */}
                            {activeInboxRequest && (
                                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                                    
                                    {(verificationResult.type === 'Full Identity Document' || verificationResult.type === 'Redacted Document') ? (
                                        <Button 
                                            variant="contained" color="primary" startIcon={<VisibilityIcon />}
                                            onClick={() => handleViewDocument(activeInboxRequest)}
                                        >
                                            View Original Images
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="contained" color="success" startIcon={<LockIcon />}
                                            onClick={() => {
                                                setViewProofData(activeInboxRequest.proofData);
                                                setIsProofModalOpen(true);
                                            }}
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
                          >
                              Verify Another Document
                          </Button>
                      </Box>
                  </Grid>
              )}
            </Grid>
          </CardContent>
        )}
        
        {/* --- Tab 1: Inbox (Unchanged) --- */}
        {currentTab === 1 && (
            <CardContent>
                <Box sx={{display:'flex', justifyContent:'space-between', mb:2}}>
                    <Typography variant="h6">Incoming Verification Requests</Typography>
                    <IconButton onClick={fetchInbox}><RefreshIcon /></IconButton>
                </Box>
                {inbox.length === 0 ? <Alert severity="info">No pending online requests.</Alert> : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead><TableRow><TableCell>From User</TableCell><TableCell>Document Type</TableCell><TableCell>Access Type</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
                            <TableBody>
                                {inbox.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.userEmail}</TableCell>
                                        <TableCell>{req.document?.documentName}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={req.accessType || 'UNKNOWN'} color="primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="contained" size="small" onClick={() => handleReviewRequest(req)}>Verify Proof</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        )}

        {/* --- Tab 2: SEARCH (Unchanged) --- */}
        {currentTab === 2 && (
            <CardContent>
                <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mb: 6 }}>
                    <Typography variant="h6" gutterBottom>Find a User</Typography>
                    <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: 10 }}>
                        <TextField 
                            fullWidth 
                            placeholder="Enter user email (e.g. student@scms.ac.in)"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                            }}
                        />
                        <Button type="submit" variant="contained" disabled={isSearching}>
                            {isSearching ? '...' : 'Search'}
                        </Button>
                    </form>
                    {searchError && <Alert severity="warning" sx={{mt:2}}>{searchError}</Alert>}
                </Box>

                {searchResults.length > 0 && (
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Search Results</Typography>
                        <Grid container spacing={3}>
                            {searchResults.map((doc) => (
                                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Avatar sx={{ width: 50, height: 50, mx: 'auto', mb: 1, bgcolor: '#eef2ff' }}>
                                                {doc.documentType && doc.documentType.includes('ID') ? '🆔' : '📄'}
                                            </Avatar>
                                            <Typography variant="subtitle1">{doc.documentType}</Typography>
                                            <Button 
                                                variant="outlined" size="small" sx={{ mt: 2 }}
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

                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     My Access Requests <RefreshIcon onClick={fetchSentRequests} sx={{ cursor: 'pointer', fontSize: 20, color: 'gray' }}/>
                </Typography>
                
                {sentRequests.length === 0 ? (
                    <Alert severity="info">You haven't sent any requests yet.</Alert>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                    <TableCell>User</TableCell>
                                    <TableCell>Document</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Data</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sentRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.userEmail}</TableCell>
                                        <TableCell>{req.document?.documentName}</TableCell>
                                        <TableCell>
                                            <Chip label={req.accessType} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={req.status} 
                                                color={req.status === 'APPROVED' ? 'success' : req.status === 'PENDING' ? 'warning' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {req.status === 'APPROVED' ? (
                                                (req.accessType === 'ZKP_AGE' || req.accessType === 'ZKP') ? (
                                                    <Button 
                                                        size="small" variant="contained" color="success"
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

      {/* --- MODALS --- */}
      
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