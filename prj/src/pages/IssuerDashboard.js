import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar,
  Tabs, Tab, Alert, List, ListItem, ListItemIcon, ListItemText, Divider,
  Stack, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions
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
  Visibility as ViewIcon
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, logout, getStoredPassword } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function IssuerDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1); // Default to Verification Queue
  const [pendingDocs, setPendingDocs] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // --- NEW STATE FOR MODAL ---
  const [openModal, setOpenModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [stats, setStats] = useState({
    totalIssued: 1240, 
    fraudDetected: 12, 
    avgProcessingTime: '45s'
  });

  const fetchPendingDocuments = useCallback(async () => {
    const password = getStoredPassword();
    if (!currentUser || !password) return;

    try {
      const response = await fetch('http://localhost:8080/api/issuer/documents/pending', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`)
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingDocs(data);
      }
    } catch (err) {
      console.error("Error fetching pending docs:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role.toUpperCase() === 'ISSUER') {
      fetchPendingDocuments();
    }
  }, [currentUser, fetchPendingDocuments]);

  // --- ACTIONS ---

  const handleOpenReview = (doc) => {
    setSelectedDoc(doc);
    setOpenModal(true);
  };

  const handleCloseReview = () => {
    setOpenModal(false);
    setSelectedDoc(null);
  };

  const handleApprove = async () => {
    if(!selectedDoc) return;
    const docId = selectedDoc.id;
    const password = getStoredPassword();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:8080/api/issuer/documents/${docId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`) }
      });

      if (!response.ok) throw new Error("Approval failed");

      setSuccessMsg(`Document ${docId} Approved & Data Hard Deleted!`);
      setStats(prev => ({ ...prev, totalIssued: prev.totalIssued + 1 }));
      handleCloseReview(); // Close modal
      fetchPendingDocuments(); // Refresh list (item should disappear)
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async () => {
    if(!selectedDoc) return;
    const docId = selectedDoc.id;
    const password = getStoredPassword();
    try {
      await fetch(`http://localhost:8080/api/issuer/documents/${docId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`) }
      });
      handleCloseReview();
      fetchPendingDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  // --- RENDER HELPERS ---

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
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            bgcolor: 'error.main',
            color: 'white',
            borderRadius: '50%',
            width: 16,
            height: 16,
            fontSize: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
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

      {/* --- OVERVIEW TAB (Uses stats, StatCard, LinearProgress) --- */}
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
          <Grid item xs={12}>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>System Health</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 150 }}>Blockchain Node</Typography>
                  <LinearProgress variant="determinate" value={100} color="success" sx={{ flexGrow: 1, height: 8, borderRadius: 5 }} />
                  <Typography variant="body2" sx={{ ml: 2 }}>Online</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ minWidth: 150 }}>AI Match Engine</Typography>
                  <LinearProgress variant="determinate" value={95} color="primary" sx={{ flexGrow: 1, height: 8, borderRadius: 5 }} />
                  <Typography variant="body2" sx={{ ml: 2 }}>Active</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* --- VERIFICATION QUEUE TAB --- */}
      {currentTab === 1 && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {pendingDocs.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">All Caught Up!</Typography>
                <Typography variant="body2" color="text.disabled">No pending documents to verify.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Document Type</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="center"><strong>Review</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingDocs.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>#{doc.id}</TableCell>
                        <TableCell>{doc.documentName}</TableCell>
                        <TableCell><Chip label="Pending" color="warning" size="small" /></TableCell>
                        <TableCell align="center">
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<ViewIcon />}
                            onClick={() => handleOpenReview(doc)}
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

      {/* --- REVIEW EVIDENCE MODAL --- */}
      <Dialog open={openModal} onClose={handleCloseReview} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider' }}>
          Document Review: #{selectedDoc?.id}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedDoc && (
            <Grid container spacing={2}>
              {/* Front Image */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom align="center">ID Front</Typography>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#fafafa' }}>
                  {selectedDoc.tempDocData ? (
                    <img 
                      src={`data:image/jpeg;base64,${selectedDoc.tempDocData}`} 
                      alt="Front" 
                      style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                    />
                  ) : <Typography color="error">Data Missing</Typography>}
                </Paper>
              </Grid>

              {/* Back Image */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom align="center">ID Back</Typography>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#fafafa' }}>
                  {selectedDoc.tempDocBackData ? (
                    <img 
                      src={`data:image/jpeg;base64,${selectedDoc.tempDocBackData}`} 
                      alt="Back" 
                      style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                    />
                  ) : <Typography color="text.secondary">No Back Side</Typography>}
                </Paper>
              </Grid>

              {/* Selfie Image */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom align="center">Live Selfie</Typography>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#fafafa' }}>
                  {selectedDoc.tempSelfieData ? (
                    <img 
                      src={`data:image/jpeg;base64,${selectedDoc.tempSelfieData}`} 
                      alt="Selfie" 
                      style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                    />
                  ) : <Typography color="error">Data Missing</Typography>}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Note:</strong> Approving or Rejecting this document will permanently delete these images from the database.
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseReview} color="inherit">Cancel</Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="outlined" 
            startIcon={<RejectIcon />}
          >
            Reject Document
          </Button>
          <Button 
            onClick={handleApprove} 
            color="success" 
            variant="contained" 
            startIcon={<ApproveIcon />}
          >
            Approve & Anchor
          </Button>
        </DialogActions>
      </Dialog>

    </DashboardLayout>
  );
}

export default IssuerDashboard;