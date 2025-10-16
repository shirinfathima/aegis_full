import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Assignment as DocumentIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Renamed component
function DocumentReview() {
  const navigate = useNavigate();
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Mock data for assigned verifications
  const [verifications, setVerifications] = useState([
    {
      id: 1,
      userId: 101,
      userName: 'John Smith',
      userEmail: 'john.smith@email.com',
      documentType: 'National ID',
      fileName: 'national_id_scan.jpg',
      submittedDate: '2024-09-14T10:30:00',
      priority: 'High',
      status: 'Assigned',
      ocrConfidence: 94,
      aiRecommendation: 'Approve',
      aiConfidence: 92,
      extractedData: {
        fullName: 'John Michael Smith',
        dateOfBirth: '1985-03-15',
        idNumber: 'ID987654321',
        issuedDate: '2020-01-15',
        expiryDate: '2030-01-15',
        address: '456 Oak Avenue, Springfield, IL 62701'
      },
      flags: []
    },
    {
      id: 2,
      userId: 102,
      userName: 'Sarah Johnson',
      userEmail: 'sarah.j@email.com',
      documentType: 'Passport',
      fileName: 'passport_scan.pdf',
      submittedDate: '2024-09-14T09:15:00',
      priority: 'Normal',
      status: 'Assigned',
      ocrConfidence: 97,
      aiRecommendation: 'Approve',
      aiConfidence: 96,
      extractedData: {
        fullName: 'Sarah Elizabeth Johnson',
        dateOfBirth: '1992-08-22',
        idNumber: 'P123456789',
        issuedDate: '2019-06-10',
        expiryDate: '2029-06-10'
      },
      flags: []
    },
    {
      id: 3,
      userId: 103,
      userName: 'Mike Davis',
      userEmail: 'mike.davis@email.com',
      documentType: 'Driver License',
      fileName: 'drivers_license.jpg',
      submittedDate: '2024-09-14T08:45:00',
      priority: 'Normal',
      status: 'Assigned',
      ocrConfidence: 78,
      aiRecommendation: 'Review Required',
      aiConfidence: 65,
      extractedData: {
        fullName: 'Michael Robert Davis',
        dateOfBirth: '1988-11-05',
        idNumber: 'DL555666777',
        issuedDate: '2018-02-20',
        expiryDate: '2026-02-20',
        address: '789 Pine Street, Chicago, IL 60601'
      },
      flags: ['Low OCR Confidence', 'Data Format Inconsistency']
    }
  ]);
  
  // Helper functions (copied from VerifierDashboard.js)
  const handleVerificationClick = (verification) => {
    setSelectedVerification(verification);
    setVerificationDialogOpen(true);
    setDecision('');
    setRemarks('');
  };

  const handleSubmitDecision = () => {
    if (!decision) {
      alert('Please select a decision');
      return;
    }

    // Update verification status (mock logic)
    const updatedVerifications = verifications.filter(v => v.id !== selectedVerification.id);
    
    setVerifications(updatedVerifications);
    setVerificationDialogOpen(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'error';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation.toLowerCase()) {
      case 'approve': return 'success';
      case 'reject': return 'error';
      case 'review required': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Document Review Queue ({verifications.length})
        </Typography>
        <Typography variant="body1" color="text.secondary">
          List of documents requiring your manual verification and approval.
        </Typography>
      </Box>

      <Card>
        <CardContent>
            {verifications.length === 0 ? (
              <Alert severity="success">
                Congratulations! You have no documents assigned for review at the moment.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Document</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>AI Recommendation</TableCell>
                      <TableCell>OCR Confidence</TableCell>
                      <TableCell>Flags</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {verifications.map((verification) => (
                      <TableRow key={verification.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar><PersonIcon /></Avatar>
                            <Box>
                              <Typography variant="subtitle2">{verification.userName}</Typography>
                              <Typography variant="body2" color="text.secondary">{verification.userEmail}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {verification.fileName.endsWith('.pdf') ? <PdfIcon color="error" /> : <ImageIcon color="primary" />}
                            <Box>
                              <Typography variant="subtitle2">{verification.documentType}</Typography>
                              <Typography variant="body2" color="text.secondary">{verification.fileName}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{new Date(verification.submittedDate).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip label={verification.priority} color={getPriorityColor(verification.priority)} size="small"/>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip label={verification.aiRecommendation} color={getRecommendationColor(verification.aiRecommendation)} size="small"/>
                            <Typography variant="body2" color="text.secondary">{verification.aiConfidence}% confidence</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{verification.ocrConfidence}%</Typography>
                        </TableCell>
                        <TableCell>
                          {verification.flags.length > 0 ? (
                            <Box>
                              {verification.flags.map((flag, index) => (
                                <Chip key={index} label={flag} color="warning" size="small" sx={{ mr: 0.5, mb: 0.5 }}/>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="success.main">No issues</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleVerificationClick(verification)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button 
                    variant="outlined" 
                    onClick={() => navigate('/verifier/dashboard')}
                >
                    Back to Dashboard
                </Button>
            </Box>
        </CardContent>
      </Card>

      {/* Verification Review Dialog */}
      <Dialog 
        open={verificationDialogOpen} 
        onClose={() => setVerificationDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Document Verification Review</DialogTitle>
        <DialogContent>
          {selectedVerification && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>User Information</Typography>
                    <Typography><strong>Name:</strong> {selectedVerification.userName}</Typography>
                    <Typography><strong>Email:</strong> {selectedVerification.userEmail}</Typography>
                    <Typography><strong>Document Type:</strong> {selectedVerification.documentType}</Typography>
                    <Typography><strong>File:</strong> {selectedVerification.fileName}</Typography>
                    <Typography><strong>Submitted:</strong> {new Date(selectedVerification.submittedDate).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>AI Analysis</Typography>
                    <Typography><strong>OCR Confidence:</strong> {selectedVerification.ocrConfidence}%</Typography>
                    <Typography><strong>AI Recommendation:</strong> {selectedVerification.aiRecommendation}</Typography>
                    <Typography><strong>AI Confidence:</strong> {selectedVerification.aiConfidence}%</Typography>
                    {selectedVerification.flags.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Flags:</Typography>
                        {selectedVerification.flags.map((flag, index) => (
                          <Chip key={index} label={flag} color="warning" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Extracted Data</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Full Name:</strong> {selectedVerification.extractedData.fullName}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Date of Birth:</strong> {selectedVerification.extractedData.dateOfBirth}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>ID Number:</strong> {selectedVerification.extractedData.idNumber}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Issued Date:</strong> {selectedVerification.extractedData.issuedDate}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Expiry Date:</strong> {selectedVerification.extractedData.expiryDate}</Typography>
                      </Grid>
                      {selectedVerification.extractedData.address && (
                        <Grid item xs={12}>
                          <Typography><strong>Address:</strong> {selectedVerification.extractedData.address}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Verification Decision</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Decision</InputLabel>
                          <Select
                            value={decision}
                            onChange={(e) => setDecision(e.target.value)}
                            label="Decision"
                          >
                            <MenuItem value="Approved">Approve</MenuItem>
                            <MenuItem value="Rejected">Reject</MenuItem>
                            <MenuItem value="Pending">Needs More Information</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          label="Remarks"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Add any comments or reasons for your decision..."
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitDecision}>
            Submit Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DocumentReview;