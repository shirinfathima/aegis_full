import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel, Select,
  MenuItem, Alert, Avatar, CircularProgress, Tooltip
} from '@mui/material';
import {
  Assignment as DocumentIcon, Visibility as ViewIcon, Person as PersonIcon,
  Image as ImageIcon, PictureAsPdf as PdfIcon, Verified as VerifiedIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import documentService from '../services/documentService'; // Import the updated service

function DocumentReview() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');
  const [registryStatus, setRegistryStatus] = useState({ loading: false, verified: null, message: '' });

  // 1. Fetch real pending documents from backend
  useEffect(() => {
    fetchPendingDocs();
  }, []);

  const fetchPendingDocs = async () => {
    try {
      setLoading(true);
      const data = await documentService.getPendingDocuments();
      setVerifications(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Cross-check against University Registry when a document is opened for review
  const handleVerificationClick = async (doc) => {
    setSelectedVerification(doc);
    setVerificationDialogOpen(true);
    setDecision('');
    setRemarks('');
    
    // Reset and trigger registry check
    setRegistryStatus({ loading: true, verified: null, message: '' });
    
    try {
      const ocrData = JSON.parse(doc.ocrData);
      // FIX: Access the nested 'front' object and use the exact keys from your OCR
      const admissionNo = ocrData.front["Registration Number"];
      const studentName = ocrData.front["Name"];

      const result = await documentService.verifyStudentRegistry(
        admissionNo, 
        studentName
      );
      setRegistryStatus({ loading: false, verified: true, message: result.message });
    } catch (error) {
      setRegistryStatus({ 
        loading: false, 
        verified: false, 
        message: error.response?.data?.message || "Not found in University Registry" 
      });
    }
  };

  const handleSubmitDecision = async () => {
    if (!decision) {
      alert('Please select a decision');
      return;
    }

    try {
      if (decision === 'Approved') {
        await documentService.approveDocument(selectedVerification.id);
        alert("Success: Document approved and anchored to Blockchain.");
      } else {
        await documentService.rejectDocument(selectedVerification.id);
        alert("Document Rejected.");
      }
      setVerificationDialogOpen(false);
      fetchPendingDocs(); // Refresh list
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Operation failed"));
    }
  };

  const getPriorityColor = (confidence) => {
    if (confidence > 90) return 'success';
    if (confidence > 75) return 'primary';
    return 'error';
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>Document Review Queue ({verifications.length})</Typography>
        <Typography variant="body1" color="text.secondary">Manual university verification against master registry records.</Typography>
      </Box>

      <Card>
        <CardContent>
          {verifications.length === 0 ? (
            <Alert severity="info">No documents pending review at the moment.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>AI Confidence</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verifications.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar><PersonIcon /></Avatar>
                          <Typography variant="subtitle2">User ID: {doc.userId}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{doc.documentType || "University ID"}</TableCell>
                      <TableCell><Chip label={doc.status} size="small" /></TableCell>
                      <TableCell>
                        <Chip 
                          label={`${doc.faceMatchConfidence || 0}%`} 
                          color={getPriorityColor(doc.faceMatchConfidence)} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="contained" size="small" startIcon={<ViewIcon />} onClick={() => handleVerificationClick(doc)}>
                          Review
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

      {/* Review Dialog */}
      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Review Document
          {/* REGISTRY STATUS BADGE */}
          {!registryStatus.loading && registryStatus.verified !== null && (
            <Chip 
              icon={registryStatus.verified ? <VerifiedIcon /> : <ErrorIcon />}
              label={registryStatus.verified ? "Registry Verified" : "Registry Mismatch"}
              color={registryStatus.verified ? "success" : "error"}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedVerification && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {registryStatus.loading ? (
                  <Alert severity="info" icon={<CircularProgress size={20} />}>Checking University Registry Database...</Alert>
                ) : !registryStatus.verified && (
                  <Alert severity="error">{registryStatus.message}</Alert>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Extracted OCR Data</Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{selectedVerification.ocrData}</pre>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6">Decision</Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Action</InputLabel>
                  <Select value={decision} label="Action" onChange={(e) => setDecision(e.target.value)}>
                    <MenuItem value="Approved">Approve & Issue VC</MenuItem>
                    <MenuItem value="Rejected">Reject Document</MenuItem>
                  </Select>
                </FormControl>
                <TextField 
                  fullWidth multiline rows={3} sx={{ mt: 2 }} 
                  label="Remarks" value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            disabled={decision === 'Approved' && registryStatus.verified === false}
            onClick={handleSubmitDecision}
          >
            Submit Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DocumentReview;