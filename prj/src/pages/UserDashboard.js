import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Edit as EditIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, logout } from '../services/authService';

function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }

    const role = currentUser.role.toUpperCase();
    if (role === 'VERIFIER') {
      navigate('/verifier/dashboard');
    } else if (role === 'ISSUER') {
      navigate('/issuer/dashboard');
    } else if (role !== 'USER') {
      navigate('/');
    }
    
    setUser(currentUser);
    
    const fetchDocuments = async () => {
      const storedPassword = sessionStorage.getItem('temp_pass');
      if (!currentUser || !storedPassword) {
          setError("Your session has expired. Please log in again.");
          setIsLoading(false);
          logout();
          navigate('/');
          return;
      }

      try {
        const response = await fetch('http://localhost:8080/api/documents/my-documents', {
          headers: {
            'Authorization': 'Basic ' + btoa(`${currentUser.email}:${storedPassword}`)
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch documents. Status: ${response.status}`);
        }

        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [navigate]);

  if (isLoading || !user) {
    return <Box sx={{ p: 4 }}>Loading Dashboard...</Box>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckIcon />;
      case 'PENDING': return <PendingIcon />;
      case 'REJECTED': return <CancelIcon />;
      default: return <DocumentIcon />;
    }
  };

  const getOverallProgress = () => {
    if (!documents || documents.length === 0) return 0;
    const approvedDocs = documents.filter(doc => doc.status === 'APPROVED').length;
    return (approvedDocs / documents.length) * 100;
  };
  
  const userSidebar = (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6">{user.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {user.email}
          </Typography>
          <Chip label={user.role} color="primary" size="small" />
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate('/profile-details')}
              fullWidth
            >
              Profile Details
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
            <List sx={{ width: '100%' }}>
                <ListItem 
                    button 
                    onClick={() => { 
                        logout(); 
                        navigate('/'); 
                    }}
                >
                    <ListItemIcon>
                        <LogoutIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
          <List>
            <ListItem button onClick={() => navigate('/upload')}>
              <ListItemIcon>
                <UploadIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Upload Document" />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => navigate('/issued-documents')}>
              <ListItemIcon>
                <DocumentIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Issued Documents" />
            </ListItem>          
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <DashboardLayout sidebar={userSidebar}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Welcome back, {user.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your documents and track verification status
        </Typography>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Verification Progress</Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Overall Progress</Typography>
              <Typography variant="body2">{Math.round(getOverallProgress())}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getOverallProgress()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {documents.filter(doc => doc.status === 'APPROVED').length} of {documents.length} documents verified
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Document Status</Typography>
          
          {isLoading ? (
            <LinearProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : documents.length === 0 ? (
            <Alert severity="info">
              No documents uploaded yet. Start by uploading your first document.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {documents.map((document) => (
                <Grid item xs={12} key={document.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getStatusIcon(document.status)}
                          <Box>
                            <Typography variant="subtitle1">{document.documentName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded recently
                            </Typography>
                            {document.faceMatchConfidence != null && (
                              <Typography variant="body2" color="text.secondary">
                                Confidence: {document.faceMatchConfidence}%
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={document.status}
                            color={getStatusColor(document.status)}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Box>
                            {document.status === 'REJECTED' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate('/upload')}
                              >
                                Re-upload
                              </Button>
                            )}
                            {document.status === 'APPROVED' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate('/verification-result')}
                              >
                                View Details
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => navigate('/upload')}
              size="large"
            >
              Upload New Document
            </Button>
          </Box>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default UserDashboard;