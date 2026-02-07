import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
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
import { ModernCard, GlassCard, StatCard, gradients } from '../styles/ModernComponents';

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
      // FIX: Use getStoredPassword for HTTP Basic Auth
      const storedPassword = getStoredPassword();
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
            // FIX: Use storedPassword
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
    <Stack spacing={3}>
      {/* Profile Card with Gradient */}
      <ModernCard gradient={gradients.blue}>
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
            <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
              {user.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1.5 }}>
              {user.email}
            </Typography>
            <Chip 
              label={user.role.toUpperCase()} 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 700,
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate('/profile-details')}
            fullWidth
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 600,
              mt: 2,
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Profile Details
          </Button>
        </Stack>
      </ModernCard>

      {/* Quick Actions */}
      <GlassCard>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
            Quick Actions
          </Typography>
          <Stack spacing={1}>
            <Button
              fullWidth
              startIcon={<UploadIcon />}
              onClick={() => navigate('/upload')}
              sx={{ 
                justifyContent: 'flex-start',
                fontWeight: 600,
                color: '#667eea',
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              Upload Document
            </Button>
            <Button
              fullWidth
              startIcon={<DocumentIcon />}
              onClick={() => navigate('/issued-documents')}
              sx={{ 
                justifyContent: 'flex-start',
                fontWeight: 600,
                color: '#667eea',
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              Issued Documents
            </Button>
          </Stack>
        </CardContent>
      </GlassCard>

      {/* Logout */}
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

  return (
    <DashboardLayout sidebar={userSidebar}>
      <Stack spacing={4}>
        {/* Modern Header */}
        <Box>
          <Typography 
            variant="h3" 
            fontWeight={700}
            sx={{ 
              mb: 1,
              background: gradients.blue,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome back, {user.name}
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            Manage your documents and track verification status
          </Typography>
        </Box>

        {/* Progress Card with Gradient */}
        <StatCard gradient={gradients.green}>
          <Stack spacing={2}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Verification Progress
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h2" fontWeight={800}>
                {Math.round(getOverallProgress())}%
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Complete
              </Typography>
            </Stack>
            <Box sx={{ 
              height: 12, 
              borderRadius: '10px', 
              background: 'rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
            }}>
              <Box sx={{ 
                height: '100%', 
                width: `${getOverallProgress()}%`,
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '10px',
                transition: 'width 0.5s ease-in-out',
              }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {documents.filter(doc => doc.status === 'APPROVED').length} of {documents.length} documents verified
            </Typography>
          </Stack>
        </StatCard>

        {/* Document Status Card */}
        <GlassCard>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
              Document Status
            </Typography>
            
            {isLoading ? (
              <LinearProgress sx={{ borderRadius: '4px', height: 6 }} />
            ) : error ? (
              <Alert 
                severity="error"
                sx={{ 
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                {error}
              </Alert>
            ) : documents.length === 0 ? (
              <Alert 
                severity="info"
                sx={{ 
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(79, 172, 254, 0.1)',
                  border: '1px solid rgba(79, 172, 254, 0.2)',
                }}
              >
                No documents uploaded yet. Start by uploading your first document.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {documents.map((document) => (
                  <Card 
                    key={document.id}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      }
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ color: getStatusColor(document.status) + '.main' }}>
                            {getStatusIcon(document.status)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {document.documentName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded recently
                            </Typography>
                            {document.faceMatchConfidence != null && (
                              <Typography variant="body2" color="text.secondary">
                                Confidence: {document.faceMatchConfidence}%
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                        <Stack alignItems="flex-end" spacing={1}>
                          <Chip
                            label={document.status}
                            color={getStatusColor(document.status)}
                            sx={{ fontWeight: 600 }}
                          />
                          {document.status === 'REJECTED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate('/upload')}
                              sx={{ borderRadius: '8px', fontWeight: 600 }}
                            >
                              Re-upload
                            </Button>
                          )}
                          {document.status === 'APPROVED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate('/issued-documents')}
                              sx={{ borderRadius: '8px', fontWeight: 600 }}
                            >
                              View Credential
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => navigate('/upload')}
                size="large"
                sx={{
                  background: gradients.blue,
                  fontWeight: 600,
                  py: 1.5,
                  px: 4,
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3d8ee6 0%, #00e0f0 100%)',
                    boxShadow: '0 15px 40px rgba(79, 172, 254, 0.4)',
                  }
                }}
              >
                Upload New Document
              </Button>
            </Box>
          </CardContent>
      </GlassCard>
      </Stack>
    </DashboardLayout>
  );
}

export default UserDashboard;