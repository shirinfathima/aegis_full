import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar,
  Tabs, Tab, Alert, List, ListItem, ListItemIcon, ListItemText, Divider,
  Stack, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress
} from '@mui/material';
import {
  AdminPanelSettings as IssuerIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ExitToApp as LogoutIcon,
  Assignment as DocIcon,
  Warning as FraudIcon,
  Dashboard as DashboardIcon,
  AccessTime as PendingIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Visibility as ViewIcon,
  VerifiedUser as VerifiedIcon
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, logout, getStoredPassword } from '../services/authService';
import documentService from '../services/documentService'; // Use the service we updated
import { useNavigate } from 'react-router-dom';

const cardGradient = 'linear-gradient(135deg, #1a3f4a 0%, #2d5a63 50%, #3d7a8f 100%)';
const accentColor = '#438b98';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
function IssuerDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [stats, setStats] = useState({
    totalIssued: 0,
    fraudDetected: 0,
    avgProcessingTime: '45s'
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal & Registry State
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [registryCheck, setRegistryCheck] = useState({ loading: false, verified: null, message: '' });

  const fetchPendingDocuments = useCallback(async () => {
    try {
      const data = await documentService.getPendingDocuments();
      const sorted = data.sort((a, b) => b.id - a.id);
      setPendingDocs(sorted);
    } catch (err) {
      console.error("Error fetching pending docs:", err);
      setError("Failed to load pending documents.");
    }
  }, []);
  
  const fetchStats = useCallback(async () => {
    const password = getStoredPassword();
    const email = currentUser?.email;
    try {
      const response = await fetch(`${API_BASE}/api/issuer/stats`, {
        headers: { 'Authorization': 'Basic ' + btoa(`${email}:${password}`) }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          totalIssued: data.totalIssued,
          fraudDetected: data.fraudDetected,
        }));
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role.toUpperCase() === 'ISSUER') {
      fetchPendingDocuments();
      fetchStats(); 
    }
  }, [currentUser, fetchPendingDocuments, fetchStats]);

  // --- REGISTRY CROSS-CHECK LOGIC ---
  const performRegistryCheck = async (doc) => {
    setRegistryCheck({ loading: true, verified: null, message: '' });
    try {
      // 1. Parse the OCR data string from the document
      const ocrData = JSON.parse(doc.ocrData);
      
      // 2. Call our cross-check API (Step 5 logic)
      // FIX: Access the nested 'front' object and use the exact keys from your OCR
      const admissionNo = ocrData.front["Registration Number"];
      const studentName = ocrData.front["Name"];
      
      const result = await documentService.verifyStudentRegistry(
        admissionNo, 
        studentName
      );
      
      setRegistryCheck({ loading: false, verified: true, message: result.message });
    } catch (err) {
      setRegistryCheck({ 
        loading: false, 
        verified: false, 
        message: err.response?.data?.message || "Student not found in University Registry." 
      });
    }
  };

  const handleOpenReview = (doc) => {
    setSelectedDoc(doc);
    setOpenModal(true);
    performRegistryCheck(doc); // Trigger check as soon as modal opens
  };

  const handleCloseReview = () => {
    setOpenModal(false);
    setSelectedDoc(null);
    setRegistryCheck({ loading: false, verified: null, message: '' });
  };

  const handleApprove = async () => {
    if(!selectedDoc) return;
    setError('');
    setSuccessMsg('');

    try {
      await documentService.approveDocument(selectedDoc.id);
      setSuccessMsg(`Document #${selectedDoc.id} successfully verified and anchored to Blockchain.`);
      setStats(prev => ({ ...prev, totalIssued: prev.totalIssued + 1 }));
      handleCloseReview();
      fetchPendingDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Blockchain anchoring failed.");
    }
  };

  const handleReject = async () => {
    if(!selectedDoc) return;
    try {
      await documentService.rejectDocument(selectedDoc.id);
      setSuccessMsg("Document rejected and temporary data cleared.");
      handleCloseReview();
      fetchPendingDocuments();
    } catch (err) {
      setError("Failed to reject document.");
    }
  };

  // ... (StatCard, AssignmentIconWithBadge, issuerSidebar helpers stay the same) ...
  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>{icon}</Avatar>
          <Typography variant="h6" color="text.secondary">{title}</Typography>
        </Stack>
        <Typography variant="h4" fontWeight="bold">{value}</Typography>
      </CardContent>
    </Card>
  );

  const AssignmentIconWithBadge = ({ count }) => (
    <Box sx={{ position: 'relative', display: 'flex' }}>
      <DocIcon />
      {count > 0 && (
        <Box sx={{ position: 'absolute', top: -4, right: -4, bgcolor: 'error.main', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {count}
        </Box>
      )}
    </Box>
  );

  const issuerSidebar = (
    <Box>
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ textAlign: 'center', background: 'linear-gradient(180deg,#f8fbff 0%,#f0f7ff 100%)' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: cardGradient, boxShadow: '0 8px 24px rgba(67,139,152,0.3)' }}>
            <IssuerIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>{currentUser?.name}</Typography>
          <Chip label="ISSUER AUTHORITY" sx={{ mt: 1, background: cardGradient, color: '#fff', fontWeight: 700 }} size="small" />
        </CardContent>
      </Card>
      <Paper elevation={2}>
        <List component="nav">
          <ListItem button selected={currentTab === 0} onClick={() => setCurrentTab(0)}>
            <ListItemIcon><DashboardIcon color={currentTab === 0 ? "primary" : "inherit"} /></ListItemIcon>
            <ListItemText primary="Overview" />
          </ListItem>
          <ListItem button selected={currentTab === 1} onClick={() => setCurrentTab(1)}>
            <ListItemIcon><AssignmentIconWithBadge count={pendingDocs.length} /></ListItemIcon>
            <ListItemText primary="Verification Queue" />
          </ListItem>
          <Divider sx={{ my: 1 }} />
          <ListItem button onClick={() => { logout(); navigate('/'); }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );

  return (
    <DashboardLayout sidebar={issuerSidebar}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            background: cardGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700
          }}
        >
          Issuer Dashboard
        </Typography>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', mb: 3 }}>
        <Box sx={{ background: '#f8fbfd', borderBottom: '1px solid #dde8ed' }}>
          <Tabs
            value={currentTab}
            onChange={(e, v) => setCurrentTab(v)}
            sx={{
              '& .MuiTab-root': { fontWeight: 700 },
              '& .MuiTabs-indicator': { background: cardGradient, height: 3 }
            }}
          >
            <Tab label="System Overview" />
            <Tab label={`Verification Queue (${pendingDocs.length})`} />
          </Tabs>
        </Box>
      </Card>

      {currentTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard title="Pending Review" value={pendingDocs.length} icon={<PendingIcon />} color="warning" />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Total Issued" value={stats.totalIssued} icon={<DocIcon />} color="success" />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Fraud Alerts" value={stats.fraudDetected} icon={<FraudIcon />} color="error" />
          </Grid>
        </Grid>
      )}

      {currentTab === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <CardContent sx={{ p: 0 }}>
            {pendingDocs.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">All Caught Up!</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ background: cardGradient }}>
                    <TableRow>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Document Name</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>AI Score</TableCell>
                      <TableCell align="center" sx={{ color: '#fff', fontWeight: 700 }}>Review</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingDocs.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>#{doc.id}</TableCell>
                        <TableCell>{doc.documentName}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${doc.faceMatchConfidence}% AI Match`}
                            size="small"
                            sx={{
                              background: `linear-gradient(135deg, ${doc.faceMatchConfidence > 80 ? '#16a34a' : '#f97316'} 0%, ${doc.faceMatchConfidence > 80 ? '#22c55e' : '#fb923c'} 100%)`,
                              color: '#fff',
                              fontWeight: 700,
                              borderRadius: 1,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleOpenReview(doc)}
                            sx={{
                              background: cardGradient,
                              color: '#fff',
                              textTransform: 'none',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #2d5a63 0%, #438b98 100%)',
                              },
                            }}
                          >
                            Review Evidence
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- PRODUCTION REVIEW MODAL WITH REGISTRY CHECK --- */}
      <Dialog open={openModal} onClose={handleCloseReview} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, color: accentColor }}>
            Document Review: #{selectedDoc?.id}
          </Typography>
          {!registryCheck.loading && registryCheck.verified !== null && (
            <Chip 
              icon={registryCheck.verified ? <VerifiedIcon /> : <FraudIcon />}
              label={registryCheck.verified ? "University Verified" : "Registry Mismatch"}
              color={registryCheck.verified ? "success" : "error"}
              variant="filled"
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedDoc && (
            <Grid container spacing={2}>
              {/* Status Alert Area */}
              <Grid item xs={12}>
                {registryCheck.loading ? (
                  <Alert severity="info" icon={<CircularProgress size={20} />}>Cross-checking with University Registry Database...</Alert>
                ) : registryCheck.verified === false ? (
                  <Alert severity="error"><strong>CRITICAL:</strong> {registryCheck.message}</Alert>
                ) : registryCheck.verified === true ? (
                  <Alert severity="success">Student details match the University Registry.</Alert>
                ) : null}
              </Grid>

              {/* Image Evidence display stays similar */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom align="center">ID Front</Typography>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <img src={`data:image/jpeg;base64,${selectedDoc.tempDocData}`} alt="Front" style={{ maxWidth: '100%', maxHeight: '250px' }} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom align="center">ID Back</Typography>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <img src={`data:image/jpeg;base64,${selectedDoc.tempDocBackData}`} alt="Back" style={{ maxWidth: '100%', maxHeight: '250px' }} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom align="center">Live Selfie</Typography>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <img src={`data:image/jpeg;base64,${selectedDoc.tempSelfieData}`} alt="Selfie" style={{ maxWidth: '100%', maxHeight: '250px' }} />
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseReview} color="inherit">Cancel</Button>
          <Button onClick={handleReject} color="error" variant="outlined" startIcon={<RejectIcon />}>
            Reject Document
          </Button>
          <Button 
            onClick={handleApprove} 
            color="success" 
            variant="contained" 
            startIcon={<ApproveIcon />}
            disabled={registryCheck.verified === false} // DISABLED IF MISMATCH
          >
            Approve & Anchor
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default IssuerDashboard;