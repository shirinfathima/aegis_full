import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemIcon, ListItemText, Alert, Tabs, Tab,
  IconButton
} from '@mui/material';

import {
  AdminPanelSettings as IssuerIcon,
  People as UsersIcon,
  Assignment as TaskIcon,
  Assessment as ReportsIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, logout, getStoredPassword } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function IssuerDashboard() {

  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1);

  // 🔹 BACKEND STATE
  const [pendingDocs, setPendingDocs] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 🔹 USER POPUP STATE (unchanged UI)
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

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
    fetchPendingDocuments();
  }, []);

  // --------------------------------------------------
  // APPROVE DOCUMENT
  // --------------------------------------------------
  const handleApprove = async (docId) => {
    const password = getStoredPassword();
    setError('');
    setSuccessMsg('');

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

      fetchPendingDocuments();

    } catch (err) {
      console.log(err);
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
  // COLOR HELPERS
  // --------------------------------------------------
  const getStatusColor = (value) => {
    if (!value) return "default";
    switch (value.toLowerCase()) {
      case "approved":
      case "active":
        return "success";
      case "pending":
      case "pending review":
      case "in progress":
        return "warning";
      case "rejected":
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  // --------------------------------------------------
  // SIDEBAR UI
  // --------------------------------------------------
  const issuerSidebar = (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
            <IssuerIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6">{currentUser.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentUser.email}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <List sx={{ width: '100%' }}>
            <ListItem button onClick={() => { logout(); navigate('/'); }}>
              <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>System Overview</Typography>
          <Typography>Total Users: {systemStats.totalUsers}</Typography>
          <Typography>Active Users: {systemStats.activeUsers}</Typography>
        </CardContent>
      </Card>
    </Box>
  );

  // --------------------------------------------------
  // MAIN RETURN (UI UNCHANGED)
  // --------------------------------------------------
  return (
    <DashboardLayout sidebar={issuerSidebar}>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IssuerIcon /> Issuer Dashboard
        </Typography>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="User Management" />
            <Tab label="Verification Queue" />
            <Tab label="System Reports" />
          </Tabs>
        </Box>

        {/* -------------------------------- VERIFICATION QUEUE ------------------------------- */}
        {currentTab === 1 && (
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <Typography variant="h6">Pending Verifications</Typography>
              <Chip label={`${pendingDocs.length} items`} color="primary" />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Face Score</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>

                  {pendingDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.userName || "User"}</TableCell>
                      <TableCell>{doc.documentName}</TableCell>
                      <TableCell>{doc.uploadDate || "--"}</TableCell>

                      <TableCell>
                        <Chip
                          label="Pending Review"
                          color="warning"
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={`${doc.faceMatchConfidence || 0}%`}
                          color={doc.faceMatchConfidence > 80 ? "success" : "warning"}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <IconButton size="small" color="success"
                          onClick={() => handleApprove(doc.id)}>
                          <ApproveIcon />
                        </IconButton>

                        <IconButton size="small" color="error"
                          onClick={() => handleReject(doc.id)}>
                          <RejectIcon />
                        </IconButton>

                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </TableCell>

                    </TableRow>
                  ))}

                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* -------------------------------- SYSTEM REPORTS ------------------------------- */}
        {currentTab === 2 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>System Performance</Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Success Rate: {systemStats.successRate}%
            </Alert>

            <Alert severity="success">
              Avg Processing Time: {systemStats.averageProcessingTime}
            </Alert>
          </CardContent>
        )}

        {/* -------------------------------- USER MANAGEMENT PLACEHOLDER ------------------- */}
        {currentTab === 0 && (
          <CardContent>
            <Typography>User management UI goes here.</Typography>
          </CardContent>
        )}

      </Card>

    </DashboardLayout>
  );
}

export default IssuerDashboard;
