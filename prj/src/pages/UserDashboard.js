import React, { useState, useEffect } from 'react';
import IncomingRequests from './IncomingRequests';
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
import { getCurrentUser, logout, getStoredPassword } from '../services/authService';

const cardGradient = 'linear-gradient(135deg, #1a3f4a 0%, #2d5a63 50%, #3d7a8f 100%)';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
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
      const storedPassword = getStoredPassword();
      if (!currentUser || !storedPassword) {
          setError("Your session has expired. Please log in again.");
          setIsLoading(false);
          logout();
          navigate('/');
          return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/documents/my-documents`, {
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
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ textAlign: 'center', background: 'linear-gradient(180deg, #f8fbff 0%, #f0f7ff 100%)' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: cardGradient, boxShadow: '0 8px 24px rgba(67, 139, 152, 0.3)' }}>
            <PersonIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {user.email}
          </Typography>
          <Chip label={user.role} sx={{ background: cardGradient, color: '#fff', fontWeight: 700 }} size="small" />
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate('/profile-details')}
              fullWidth
              sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#438b98', color: '#438b98' }}
            >
              Profile Details
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ textAlign: 'center' }}>
            <List sx={{ width: '100%' }}>
                <ListItem 
                    button 
                    onClick={() => { 
                        logout(); 
                        navigate('/'); 
                    }}
                    sx={{ borderRadius: 2, '&:hover': { background: 'rgba(244, 67, 54, 0.08)' } }}
                >
                    <ListItemIcon>
                        <LogoutIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" sx={{ fontWeight: 600 }} />
                </ListItem>
            </List>
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Quick Actions</Typography>
          <List>
            <ListItem button onClick={() => navigate('/upload')} sx={{ borderRadius: 2, '&:hover': { background: 'rgba(67, 139, 152, 0.08)' } }}>
              <ListItemIcon>
                <UploadIcon sx={{ color: '#438b98' }} />
              </ListItemIcon>
              <ListItemText primary="Upload Document" sx={{ fontWeight: 600 }} />
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem button onClick={() => navigate('/issued-documents')} sx={{ borderRadius: 2, '&:hover': { background: 'rgba(67, 139, 152, 0.08)' } }}>
              <ListItemIcon>
                <DocumentIcon sx={{ color: '#438b98' }} />
              </ListItemIcon>
              <ListItemText primary="Issued Documents" sx={{ fontWeight: 600 }} />
            </ListItem>          
          </List>
        </CardContent>
      </Card>
      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <Box sx={{ background: cardGradient, p: 3 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Verification Progress</Typography>
        </Box>
        <CardContent sx={{ p: 3, background: '#f8fbfd' }}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Overall Progress</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#438b98' }}>{Math.round(getOverallProgress())}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getOverallProgress()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                background: 'rgba(67, 139, 152, 0.2)',
                '& .MuiLinearProgress-bar': {
                  background: cardGradient
                }
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {documents.filter(doc => doc.status === 'APPROVED').length} of {documents.length} documents verified
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <DashboardLayout sidebar={userSidebar}>
      <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #f5fafc 0%, #e8f4f8 100%)', boxShadow: '0 12px 35px rgba(16, 39, 70, 0.15)', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(67, 139, 152, 0.1) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
            <PersonIcon /> Welcome back, {user.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Manage your documents and track verification status
          </Typography>
        </Box>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </Box>

      <IncomingRequests userEmail={user.email} />

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <Box sx={{ background: cardGradient, p: 3 }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Document Status</Typography>
        </Box>
        <CardContent sx={{ p: 4, background: '#f8fbfd' }}>
          
          {isLoading ? (
            <LinearProgress sx={{ borderRadius: 2 }} />
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          ) : documents.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No documents uploaded yet. Start by uploading your first document.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {documents.map((document) => (
                <Card key={document.id} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #e0e0e0', transition: 'all 0.2s', background: '#fff', '&:hover': { boxShadow: '0 8px 24px rgba(67, 139, 152, 0.15)', borderColor: '#438b98' } }}>
                  <CardContent sx={{ p: 3.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1, minWidth: 0 }}>
                        <Box sx={{ color: getStatusColor(document.status) === 'success' ? '#4caf50' : getStatusColor(document.status) === 'warning' ? '#ff9800' : '#f44336', flexShrink: 0 }}>
                          {getStatusIcon(document.status)}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{document.documentName}</Typography>
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
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Chip
                          label={document.status}
                          color={getStatusColor(document.status)}
                          size="small"
                          sx={{ mb: 1.25, fontWeight: 700, display: 'block' }}
                        />
                        <Box sx={{ mt: 1.25 }}>
                          {document.status === 'REJECTED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate('/upload')}
                              sx={{ borderRadius: 1, fontWeight: 600, padding: '7.5px 20px', fontSize: '0.75rem' }}
                            >
                              Re-upload
                            </Button>
                          )}
                          {document.status === 'APPROVED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate('/issued-documents')}
                              sx={{ borderRadius: 1, fontWeight: 600, borderColor: '#438b98', color: '#438b98', padding: '7.5px 20px', fontSize: '0.75rem' }}
                            >
                              View Credential
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 3.75, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => navigate('/upload')}
              size="large"
              sx={{
                background: cardGradient,
                color: '#fff',
                px: 5,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(67, 139, 152, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2d5a63 0%, #4a8fa3 45%, #5aa8b8 100%)',
                  boxShadow: '0 12px 32px rgba(67, 139, 152, 0.4)'
                }
              }}
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