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

function IssuerDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal & Registry State
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [registryCheck, setRegistryCheck] = useState({ loading: false, verified: null, message: '' });

  const [stats, setStats] = useState({
    totalIssued: 1240, 
    fraudDetected: 12, 
    avgProcessingTime: '45s'
  });

  const fetchPendingDocuments = useCallback(async () => {
    try {
      const data = await documentService.getPendingDocuments();
      setPendingDocs(data);
    } catch (err) {
      console.error("Error fetching pending docs:", err);
      setError("Failed to load pending documents.");
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role.toUpperCase() === 'ISSUER') {
      fetchPendingDocuments();
    }
  }, [currentUser, fetchPendingDocuments]);

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
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', boxShadow: 2 }}>
            <IssuerIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">{currentUser?.name}</Typography>
          <Chip label="ISSUER AUTHORITY" color="primary" size="small" sx={{ mt: 1 }} />
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
          <Divider />
          <ListItem button onClick={() => navigate('/issuer/issued-docs')}>
            <ListItemIcon><DocIcon /></ListItemIcon>
            <ListItemText primary="Issued Documents" />
          </ListItem>
          <ListItem button onClick={() => navigate('/issuer/fraud-detection')}>
            <ListItemIcon><FraudIcon color="warning" /></ListItemIcon>
            <ListItemText primary="Fraud Detection" />
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Issuer Dashboard</Typography>
          <Typography color="text.secondary">Manage identity verifications and credential issuance</Typography>
        </Box>
        <Chip icon={<PendingIcon />} label={`${pendingDocs.length} Pending Actions`} color="warning" variant="outlined" />
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} textColor="primary" indicatorColor="primary">
          <Tab label="System Overview" />
          <Tab label={`Verification Queue (${pendingDocs.length})`} />
        </Tabs>
      </Box>

      {/* Overview Tab Content */}
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

      {/* Verification Queue Table */}
      {currentTab === 1 && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {pendingDocs.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">All Caught Up!</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Document Name</strong></TableCell>
                      <TableCell><strong>AI Score</strong></TableCell>
                      <TableCell align="center"><strong>Review</strong></TableCell>
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
                            color={doc.faceMatchConfidence > 80 ? "success" : "warning"} 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button variant="contained" size="small" startIcon={<ViewIcon />} onClick={() => handleOpenReview(doc)}>
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
        <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Document Review: #{selectedDoc?.id}
          
          {/* Registry Status Badge */}
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