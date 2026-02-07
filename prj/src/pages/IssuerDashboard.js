import React, { useState, useEffect } from 'react';
import {
  Box, Stack, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Alert, Tabs, Tab,
  IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  AdminPanelSettings as IssuerIcon,
  People as UsersIcon,
  Assignment as TaskIcon,
  Assessment as ReportsIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ExitToApp as LogoutIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';

import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, logout, getStoredPassword } from '../services/authService';
import { useNavigate } from 'react-router-dom';

// Styled Components
const ModernCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '20px',
  padding: theme.spacing(3),
  color: 'white',
  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none',
  },
}));

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
  },
}));

const StatCard = styled(Box)(({ gradient, theme }) => ({
  background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '20px',
  padding: theme.spacing(3),
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.02)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
}));

const ActionIconButton = styled(IconButton)(({ theme }) => ({
  padding: '8px',
  borderRadius: '10px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

function IssuerDashboard() {

  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1);

  // 🔹 BACKEND STATE
  const [pendingDocs, setPendingDocs] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 🔹 REVIEW DIALOG STATE
  const [openReview, setOpenReview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [parsedOcrData, setParsedOcrData] = useState({});

  // --------------------------------------------------
  // FETCH PENDING DOCUMENTS FROM BACKEND
  // --------------------------------------------------
  const fetchPendingDocuments = async () => {
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
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role.toUpperCase() !== 'ISSUER') {
      navigate('/');
    }
    fetchPendingDocuments();
  }, [currentUser, navigate, fetchPendingDocuments]);

  // --------------------------------------------------
  // REVIEW HANDLERS
  // --------------------------------------------------
  const handleReviewClick = (doc) => {
    setSelectedDoc(doc);
    // Parse the JSON string from ocrData to display it nicely
    try {
      if (doc.ocrData) {
        setParsedOcrData(JSON.parse(doc.ocrData));
      } else {
        setParsedOcrData({});
      }
    } catch (e) {
      console.error("Failed to parse OCR data", e);
      setParsedOcrData({ error: "Could not parse data" });
    }
    setOpenReview(true);
  };

  const handleCloseReview = () => {
    setOpenReview(false);
    setSelectedDoc(null);
    setParsedOcrData({});
  };

  // --------------------------------------------------
  // APPROVE DOCUMENT
  // --------------------------------------------------
  const handleApprove = async (docId) => {
    const password = getStoredPassword();
    setError('');
    setSuccessMsg('');
    
    // Close modal if open
    if (openReview) handleCloseReview();

    try {
      const res = await fetch(
        `http://localhost:8080/api/issuer/documents/${docId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`)
          }
        }
      );

      if (!res.ok) throw new Error("Approval failed");

      setSuccessMsg(`Document ${docId} Approved & Anchored!`);
      fetchPendingDocuments();

    } catch (err) {
      setError(err.message);
    }
  };

  // --------------------------------------------------
  // REJECT DOCUMENT
  // --------------------------------------------------
  const handleReject = async (docId) => {
    const password = getStoredPassword();
    
    // Close modal if open
    if (openReview) handleCloseReview();

    try {
      await fetch(
        `http://localhost:8080/api/issuer/documents/${docId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`)
          }
        }
      );

      setSuccessMsg(`Document ${docId} Rejected.`);
      fetchPendingDocuments();

    } catch (err) {
      console.log(err);
      setError("Failed to reject document");
    }
  };

  // --------------------------------------------------
  // STATIC SYSTEM DATA (UI purpose only)
  // --------------------------------------------------
  const systemStats = {
    totalUsers: 1247,
    activeUsers: 1158,
    successRate: 94.2,
    averageProcessingTime: '2.3 minutes'
  };

  // --------------------------------------------------
  // SIDEBAR UI
  // --------------------------------------------------
  const issuerSidebar = (
    <Stack spacing={3}>
      {/* Profile Card with Gradient */}
      <ModernCard>
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
            <IssuerIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
              {currentUser?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1.5 }}>
              {currentUser?.email}
            </Typography>
            <Chip 
              label="ISSUER" 
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

      {/* Stats Cards with Gradients */}
      <StatCard gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Total Users
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ mt: 0.5 }}>
              {systemStats.totalUsers}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GroupsIcon sx={{ fontSize: 28 }} />
          </Box>
        </Stack>
      </StatCard>

      <StatCard gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Active Users
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ mt: 0.5 }}>
              {systemStats.activeUsers}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingIcon sx={{ fontSize: 28 }} />
          </Box>
        </Stack>
      </StatCard>

      {/* Logout Button with Glassmorphism */}
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

  // --------------------------------------------------
  // MAIN RETURN
  // --------------------------------------------------
  return (
    <DashboardLayout sidebar={issuerSidebar}>
      <Stack spacing={4}>
        {/* Modern Header */}
        <Box>
          <Typography 
            variant="h3" 
            fontWeight={700}
            sx={{ 
              mb: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Issuer Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            Manage document verifications and system operations
          </Typography>
        </Box>

        {/* Alerts */}
        {successMsg && (
          <Alert 
            severity="success" 
            sx={{ 
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
            onClose={() => setSuccessMsg('')}
          >
            {successMsg}
          </Alert>
        )}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Main Content Card with Glassmorphism */}
        <GlassCard sx={{ overflow: 'hidden' }}>
          <Box 
            sx={{ 
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              background: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <Tabs 
              value={currentTab} 
              onChange={(e, v) => setCurrentTab(v)}
              sx={{ 
                px: 3,
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '0.938rem',
                  textTransform: 'none',
                  minHeight: 64,
                },
                '& .Mui-selected': {
                  color: '#667eea',
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            >
              <Tab 
                label="User Management" 
                icon={<UsersIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label="Verification Queue" 
                icon={<TaskIcon />} 
                iconPosition="start" 
              />
              <Tab 
                label="System Reports" 
                icon={<ReportsIcon />} 
                iconPosition="start" 
              />
            </Tabs>
          </Box>

          {/* -------------------------------- VERIFICATION QUEUE ------------------------------- */}
          {currentTab === 1 && (
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                      Pending Verifications
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Review and approve submitted documents
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${pendingDocs.length} ${pendingDocs.length === 1 ? 'item' : 'items'}`}
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      px: 2,
                      py: 2.5,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                    }}
                  />
                </Stack>

                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Document Type</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Face Score</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {pendingDocs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                            <TaskIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                              No pending verifications
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingDocs.map((doc) => (
                          <TableRow key={doc.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {doc.userName || "User"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {doc.documentName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {doc.uploadDate || "--"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label="Pending Review"
                                color="warning"
                                size="small"
                                sx={{ fontWeight: 500 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${doc.faceMatchConfidence || 0}%`}
                                color={doc.faceMatchConfidence > 80 ? "success" : "warning"}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <ActionIconButton 
                                  size="small"
                                  onClick={() => handleApprove(doc.id)}
                                  sx={{
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #0f8176 0%, #2ed96d 100%)',
                                    }
                                  }}
                                >
                                  <ApproveIcon fontSize="small" />
                                </ActionIconButton>

                                <ActionIconButton 
                                  size="small"
                                  onClick={() => handleReject(doc.id)}
                                  sx={{
                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                    color: 'white',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #f85f8c 0%, #fdd832 100%)',
                                    }
                                  }}
                                >
                                  <RejectIcon fontSize="small" />
                                </ActionIconButton>

                                <ActionIconButton 
                                  size="small"
                                  onClick={() => handleReviewClick(doc)}
                                  sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f93 100%)',
                                    }
                                  }}
                                >
                                  <ViewIcon fontSize="small" />
                                </ActionIconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          )}

          {/* -------------------------------- SYSTEM REPORTS ------------------------------- */}
          {currentTab === 2 && (
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                    System Performance
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Key metrics and statistics
                  </Typography>
                </Box>

                <Stack spacing={3}>
                  <StatCard gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                          Success Rate
                        </Typography>
                        <Typography variant="h2" fontWeight={800}>
                          {systemStats.successRate}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                          ↑ 2.4% from last week
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '16px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TrendingIcon sx={{ fontSize: 36 }} />
                      </Box>
                    </Stack>
                  </StatCard>

                  <StatCard gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                          Avg Processing Time
                        </Typography>
                        <Typography variant="h2" fontWeight={800}>
                          {systemStats.averageProcessingTime}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                          ↓ 0.3 min from last week
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '16px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TaskIcon sx={{ fontSize: 36 }} />
                      </Box>
                    </Stack>
                  </StatCard>
                </Stack>
              </Stack>
            </CardContent>
          )}

          {/* -------------------------------- USER MANAGEMENT PLACEHOLDER ------------------- */}
          {currentTab === 0 && (
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                <UsersIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary">
                  User Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  User management interface coming soon
                </Typography>
              </Stack>
            </CardContent>
          )}
        </GlassCard>

        {/* -------------------------------------------------- */}
        {/* REVIEW DIALOG POPUP                                */}
        {/* -------------------------------------------------- */}
        <Dialog open={openReview} onClose={handleCloseReview} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>Document Review</DialogTitle>
            <Divider />
            <DialogContent>
            {selectedDoc && (
                <Grid container spacing={3}>
                {/* Left Column: OCR Data */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    EXTRACTED DATA (OCR)
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                        <Stack spacing={2}>
                        {Object.entries(parsedOcrData).length > 0 ? (
                            Object.entries(parsedOcrData).map(([key, value]) => (
                            <Box key={key}>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                {key.replace(/_/g, ' ')}
                                </Typography>
                                <Typography variant="body1" fontWeight={500}>
                                {String(value)}
                                </Typography>
                                <Divider sx={{ my: 0.5, opacity: 0.5 }} />
                            </Box>
                            ))
                        ) : (
                            <Alert severity="info" sx={{ py: 0 }}>No OCR data available</Alert>
                        )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Column: AI & Metadata */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    AI VERIFICATION
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">Face Match Confidence</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip 
                                label={`${selectedDoc.faceMatchConfidence || 0}%`} 
                                color={selectedDoc.faceMatchConfidence > 80 ? "success" : "warning"}
                                sx={{ fontWeight: 'bold' }}
                            />
                            <Typography variant="body2">
                            {selectedDoc.faceMatchConfidence > 80 ? "High Confidence" : "Manual Review Needed"}
                            </Typography>
                        </Stack>
                        </Stack>
                    </CardContent>
                    </Card>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    METADATA
                    </Typography>
                    <Stack spacing={1}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">FILENAME</Typography>
                        <Typography variant="body2">{selectedDoc.documentName}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">USER ID</Typography>
                        <Typography variant="body2">{selectedDoc.userId}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">IPFS CID</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', wordBreak: 'break-all' }}>
                            {selectedDoc.ipfsCid}
                        </Typography>
                    </Box>
                    </Stack>
                </Grid>
                </Grid>
            )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseReview} color="inherit">
                Cancel
            </Button>
            <Button 
                variant="outlined" 
                color="error" 
                startIcon={<RejectIcon />}
                onClick={() => handleReject(selectedDoc.id)}
            >
                Reject
            </Button>
            <Button 
                variant="contained" 
                color="success" 
                startIcon={<ApproveIcon />}
                onClick={() => handleApprove(selectedDoc.id)}
            >
                Approve & Anchor
            </Button>
            </DialogActions>
        </Dialog>
      </Stack>
    </DashboardLayout>
  );
}

export default IssuerDashboard;