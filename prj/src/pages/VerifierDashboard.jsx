import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, Table, 
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
  Search as SearchIcon,       // <--- NEW ICON
  Lock as LockIcon            // <--- NEW ICON
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService'; // Adjust path if needed
import DashboardLayout from '../components/DashboardLayout';      // Adjust path if needed
import DigitalIDCard from '../components/DigitalIDCard';          // Adjust path if needed
import RequestAccessModal from './RequestAccessModal';            // <--- NEW COMPONENT

function VerifierDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1); // Default to Inbox
  
  // --- EXISTING STATE ---
  const [proofInput, setProofInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [inbox, setInbox] = useState([]);

  // --- NEW STATE FOR SEARCH ---
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    if (!currentUser || currentUser.role.toUpperCase() !== 'VERIFIER') {
      navigate('/'); 
    }
    if (currentUser?.role === 'VERIFIER') {
        fetchInbox();
    }
  }, [currentUser, navigate]);

  // --- HELPER: GET AUTH HEADERS ---
  const getAuthHeaders = () => {
    const password = sessionStorage.getItem('temp_pass');
    return { 
        'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`),
        'Content-Type': 'application/json'
    };
  };

  // --- EXISTING FUNCTIONS ---
  const fetchInbox = async () => {
    if(!currentUser) return;
    try {
        const res = await fetch('http://localhost:8080/api/verifier/inbox', {
             headers: getAuthHeaders()
        });
        if(res.ok) setInbox(await res.json());
    } catch(e) { console.error(e); }
  };

  const handleReviewRequest = (request) => {
      setProofInput(request.vpJson);
      setCurrentTab(0); // Switch to Verify Tool
      setTimeout(() => handleVerify(request.vpJson), 100);
  };

  const handleVerify = (inputJson = proofInput) => {
    setVerificationResult(null);
    try {
        if(!inputJson) throw new Error("Input cannot be empty.");
        let vpJsonString = (typeof inputJson === 'string') ? inputJson : inputJson.vpJson;
        if (!vpJsonString) throw new Error("Invalid proof format received.");

        const vp = JSON.parse(vpJsonString);
        if (!vp.proof || !vp.type) throw new Error("Invalid structure.");
        
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
            message: "The proof provided is invalid or tampered with."
        });
    }
  };

  // --- NEW FUNCTIONS FOR SEARCH ---
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if(!searchEmail) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
        // Updated URL to match your new Controller
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

  // --- SIDEBAR ---
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
            {/* NEW TAB ADDED HERE */}
            <Tab label="Find & Request" icon={<SearchIcon />} iconPosition="start"/>
          </Tabs>
        </Box>

        {/* --- Tab 0: Verification Tool --- */}
        {currentTab === 0 && (
          <CardContent>
             {/* ... (Your Existing Code for Tab 0) ... */}
             <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Verifiable Presentation Data</Typography>
                <TextField
                  fullWidth multiline rows={4}
                  placeholder='Paste JSON Proof here...'
                  value={proofInput}
                  onChange={(e) => setProofInput(e.target.value)}
                  sx={{fontFamily: 'monospace', bgcolor: '#f8f9fa'}}
                />
                <Button variant="contained" size="large" sx={{ mt: 2 }} onClick={() => handleVerify()} startIcon={<VerifierIcon />}>
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
                      
                      {/* Simple Data Display for success */}
                      {verificationResult.status === 'Valid' && (
                          <Paper variant="outlined" sx={{p:2}}>
                              <pre>{JSON.stringify(verificationResult.data, null, 2)}</pre>
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
                {/* ... (Your Existing Code for Tab 1) ... */}
                <Box sx={{display:'flex', justifyContent:'space-between', mb:2}}>
                    <Typography variant="h6">Incoming Verification Requests</Typography>
                    <IconButton onClick={fetchInbox}><RefreshIcon /></IconButton>
                </Box>
                {inbox.length === 0 ? <Alert severity="info">No pending online requests.</Alert> : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead><TableRow><TableCell>From</TableCell><TableCell>Document</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
                            <TableBody>
                                {inbox.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.senderEmail}</TableCell>
                                        <TableCell>{req.documentName}</TableCell>
                                        <TableCell>
                                            <Button variant="contained" size="small" onClick={() => handleReviewRequest(req)}>Verify</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        )}

        {/* --- Tab 2: NEW SEARCH & REQUEST --- */}
        {currentTab === 2 && (
            <CardContent>
                <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mb: 4 }}>
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
                    <Grid container spacing={3}>
                        {searchResults.map((doc) => (
                            <Grid item xs={12} sm={6} md={4} key={doc.id}>
                                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 3 }, transition: '0.3s' }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: '#eef2ff', color: '#6366f1' }}>
                                            {doc.documentType && doc.documentType.toLowerCase().includes('id') ? '🆔' : '🎓'}
                                        </Avatar>
                                        <Typography variant="h6">{doc.documentType}</Typography>
                                        
                                        <Chip 
                                            label={doc.isVerified ? "Anchored On-Chain" : "Not Anchored"} 
                                            color={doc.isVerified ? "success" : "warning"}
                                            size="small"
                                            sx={{ my: 1 }}
                                        />
                                        
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Uploaded: {doc.uploadDate ? doc.uploadDate.split('T')[0] : 'N/A'}
                                        </Typography>

                                        <Button 
                                            variant="outlined" 
                                            fullWidth 
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
                )}
            </CardContent>
        )}
      </Card>

      {/* --- THE MODAL (Always rendered, conditional show) --- */}
      <RequestAccessModal 
         isOpen={isModalOpen}
         onClose={() => setModalOpen(false)}
         document={selectedDoc}
         verifierEmail={currentUser?.email}
         userEmail={searchEmail}
      />
    </DashboardLayout>
  );
}

export default VerifierDashboard;