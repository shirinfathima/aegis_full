import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar,
  Tabs, Tab, Alert, List, ListItem, ListItemIcon, ListItemText, Divider,
  Stack, LinearProgress, CircularProgress
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
  CheckCircleOutline as CheckCircleOutlineIcon
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
  const [stats, setStats] = useState({
    totalIssued: 1240, // Mock data for display
    fraudDetected: 12, // Mock data for display
    avgProcessingTime: '45s'
  });

  // 1. Fetch Real Pending Documents
  // Wrapped in useCallback to satisfy useEffect dependencies
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

  // 2. Handle Approval Action
  const handleApprove = async (docId) => {
    const password = getStoredPassword();
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:8080/api/issuer/documents/${docId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`)
        }
      });

      if (!response.ok) throw new Error("Approval failed");

      setSuccessMsg(`Document ${docId} Approved & Anchored to Blockchain!`);
      // Update local stats mock
      setStats(prev => ({ ...prev, totalIssued: prev.totalIssued + 1 }));
      fetchPendingDocuments(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  // 3. Handle Reject Action
  const handleReject = async (docId) => {
    const password = getStoredPassword();
    try {
      await fetch(`http://localhost:8080/api/issuer/documents/${docId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`) }
      });
      fetchPendingDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Render Helpers ---

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
            {icon}
          </Avatar>
          <Typography variant="h6" color="text.secondary">{title}</Typography>
        </Stack>
        <Typography variant="h4" fontWeight="bold">{value}</Typography>
      </CardContent>
    </Card>
  );

  // Helper component for badge icon
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
        <Box>
           <Chip 
             icon={<PendingIcon />} 
             label={`${pendingDocs.length} Pending Actions`} 
             color="warning" 
             variant="outlined" 
           />
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} textColor="primary" indicatorColor="primary">
          <Tab label="System Overview" />
          <Tab label={`Verification Queue (${pendingDocs.length})`} />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Pending Review" 
              value={pendingDocs.length} 
              icon={<PendingIcon />} 
              color="warning" 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Total Issued" 
              value={stats.totalIssued} 
              icon={<DocIcon />} 
              color="success" 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Fraud Alerts" 
              value={stats.fraudDetected} 
              icon={<FraudIcon />} 
              color="error" 
            />
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

      {/* Verification Queue Tab */}
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
                      <TableCell sx={{ fontWeight: 'bold' }}>Request ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>User ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Document Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>AI Match Score</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingDocs.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>#{doc.id}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{doc.userId.toString().substring(0,1)}</Avatar>
                            <Typography variant="body2">{doc.userId}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip label={doc.documentName} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                             <CircularProgressWithLabel value={doc.faceMatchConfidence || 0} />
                           </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label="Pending Review" color="warning" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small" 
                              startIcon={<ApproveIcon />}
                              onClick={() => handleApprove(doc.id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small" 
                              startIcon={<RejectIcon />}
                              onClick={() => handleReject(doc.id)}
                            >
                              Reject
                            </Button>
                          </Stack>
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
    </DashboardLayout>
  );
}

// Helper for Circular Progress
function CircularProgressWithLabel(props) {
  const color = props.value > 80 ? "success" : props.value > 50 ? "warning" : "error";
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" value={props.value} color={color} size={30} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

export default IssuerDashboard;