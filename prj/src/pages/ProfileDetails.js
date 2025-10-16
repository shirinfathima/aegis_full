import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Chip,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  CloudUpload as UploadIcon,
  DocumentScanner as DocumentScanIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Assuming you have a way to manage user state globally, like a Context or Redux store
// For this example, we'll use mock state.
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  dob: '1990-05-15',
  phone: '123-456-7890',
  documents: [
    {
      id: 1,
      name: 'National ID Card',
      status: 'Approved',
      uploadDate: '2024-09-10',
      confidence: 98,
      extractedData: {
        fullName: 'John Michael Doe',
        dateOfBirth: '1990-05-15',
        idNumber: 'ID123456789',
        issuedDate: '2020-01-15',
        expiryDate: '2030-01-15',
        address: '123 Main Street, City, State 12345',
        nationality: 'United States'
      }
    },
    // Add other documents as needed for testing
  ]
};

const ProfileDetails = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(mockUser);
  const [canUpload, setCanUpload] = useState(user.documents.length === 0 || user.documents.some(doc => doc.status === 'Rejected'));

  const handleUploadClick = () => {
    navigate('/upload');
  };

  const hasRejectedDocs = user.documents.some(doc => doc.status === 'Rejected');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> Profile Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your personal and identity information.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Personal Details Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon /> Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Full Name" value={user.name} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Email Address" value={user.email} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Date of Birth" value={user.dob} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone Number" value={user.phone} InputProps={{ readOnly: true }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Identity Document Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentScanIcon /> Identity Document
              </Typography>

              {canUpload ? (
                <Alert severity={hasRejectedDocs ? "error" : "info"} sx={{ mb: 3 }}>
                  {hasRejectedDocs
                    ? 'Your last document was rejected. Please upload a new document for verification.'
                    : 'You have not uploaded any documents yet. Please upload one to verify your identity.'
                  }
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Your identity document has been successfully verified.
                </Alert>
              )}

              {canUpload && (
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  fullWidth
                  size="large"
                  onClick={handleUploadClick}
                >
                  Upload Identity Document
                </Button>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon /> Document History
              </Typography>
              {user.documents.length > 0 ? (
                <Grid container spacing={2}>
                  {user.documents.map((doc) => (
                    <Grid item xs={12} key={doc.id}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2">{doc.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded on {doc.uploadDate}
                            </Typography>
                          </Box>
                          <Chip label={doc.status} color={doc.status === 'Approved' ? 'success' : 'error'} size="small" />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No documents found.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfileDetails;