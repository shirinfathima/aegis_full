import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Assignment as ReportIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';

function VerificationResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('processing');
  const [verificationData, setVerificationData] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  // Get data from previous page
  const { documentData, ocrData, documentType, fileName } = location.state || {};

  useEffect(() => {
    // Simulate AI verification process
    const processVerification = async () => {
      setVerificationStatus('processing');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock verification results
      const mockResults = {
        overall: {
          status: 'approved', // approved, rejected, pending_review
          confidence: 94,
          matchPercentage: 96,
          processingTime: '4.2s',
          verificationId: 'VER-' + Date.now()
        },
        templateMatch: {
          status: 'passed',
          confidence: 98,
          templateType: 'Official National ID Template v2.1',
          issues: []
        },
        dataValidation: {
          status: 'passed',
          confidence: 92,
          checks: [
            { field: 'Name Format', status: 'passed', confidence: 95 },
            { field: 'Date Format', status: 'passed', confidence: 98 },
            { field: 'ID Number Pattern', status: 'passed', confidence: 94 },
            { field: 'Expiry Date Logic', status: 'passed', confidence: 89 }
          ]
        },
        securityFeatures: {
          status: 'passed',
          confidence: 91,
          features: [
            { name: 'Watermark Detection', status: 'detected', confidence: 93 },
            { name: 'Hologram Presence', status: 'detected', confidence: 89 },
            { name: 'Security Thread', status: 'detected', confidence: 95 },
            { name: 'UV Features', status: 'not_checked', confidence: 0 }
          ]
        },
        fraudDetection: {
          status: 'clean',
          riskScore: 12, // out of 100, lower is better
          flags: [],
          checks: [
            'Digital tampering detection',
            'Known fraud patterns',
            'Duplicate detection',
            'Blacklist verification'
          ]
        },
        blockchainVerification: {
          status: 'pending',
          transactionHash: null,
          estimatedTime: '2-3 minutes'
        }
      };

      setVerificationData(mockResults);
      setVerificationStatus('completed');
    };

    if (documentData) {
      processVerification();
    }
  }, [documentData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
      case 'approved':
      case 'detected':
      case 'clean':
        return <SuccessIcon color="success" />;
      case 'failed':
      case 'rejected':
        return <FailIcon color="error" />;
      case 'warning':
      case 'pending_review':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
      case 'approved':
      case 'detected':
      case 'clean':
        return 'success';
      case 'failed':
      case 'rejected':
        return 'error';
      case 'warning':
      case 'pending_review':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (!documentData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          No document data found. Please upload a document first.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/upload')}
        >
          Upload Document
        </Button>
      </Container>
    );
  }

  if (verificationStatus === 'processing') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SecurityIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              AI Verification in Progress...
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Our AI is analyzing your document against official templates and security features.
            </Typography>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              This usually takes 3-5 seconds
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon /> AI Verification Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Document: {fileName} | Verification ID: {verificationData?.overall.verificationId}
        </Typography>
      </Box>

      {/* Overall Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getStatusIcon(verificationData.overall.status)}
                <Box>
                  <Typography variant="h5">
                    {verificationData.overall.status === 'approved' ? 'Verification Approved' : 
                     verificationData.overall.status === 'rejected' ? 'Verification Failed' : 
                     'Manual Review Required'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Overall confidence: {verificationData.overall.confidence}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Chip 
                  label={verificationData.overall.status.toUpperCase().replace('_', ' ')}
                  color={getStatusColor(verificationData.overall.status)}
                  sx={{ mb: 1, fontSize: '1rem', px: 2, py: 1, height: 'auto' }}
                />
                <Typography variant="body2" color="text.secondary">
                  Processed in {verificationData.overall.processingTime}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Extracted Data */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Extracted Information</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Full Name</strong></TableCell>
                      <TableCell>{documentData.fullName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Date of Birth</strong></TableCell>
                      <TableCell>{new Date(documentData.dateOfBirth).toLocaleDateString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>ID Number</strong></TableCell>
                      <TableCell>{documentData.idNumber}</TableCell>
                    </TableRow>
                    {documentData.issuedDate && (
                      <TableRow>
                        <TableCell><strong>Issued Date</strong></TableCell>
                        <TableCell>{new Date(documentData.issuedDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    )}
                    {documentData.expiryDate && (
                      <TableRow>
                        <TableCell><strong>Expiry Date</strong></TableCell>
                        <TableCell>{new Date(documentData.expiryDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Template Matching */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Template Matching</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getStatusIcon(verificationData.templateMatch.status)}
                <Typography variant="body1">
                  {verificationData.templateMatch.confidence}% Match
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Template: {verificationData.templateMatch.templateType}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={verificationData.templateMatch.confidence} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Data Validation */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Data Validation Checks</Typography>
              <Grid container spacing={2}>
                {verificationData.dataValidation.checks.map((check, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      {getStatusIcon(check.status)}
                      <Typography variant="subtitle2" sx={{ mt: 1 }}>
                        {check.field}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {check.confidence}%
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Features */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Security Features</Typography>
              <List dense>
                {verificationData.securityFeatures.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getStatusIcon(feature.status)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature.name}
                      secondary={feature.status === 'not_checked' ? 'Not checked' : `${feature.confidence}% confidence`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Fraud Detection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Fraud Detection</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ShieldIcon color="success" />
                <Box>
                  <Typography variant="body1">Risk Score: {verificationData.fraudDetection.riskScore}/100</Typography>
                  <Typography variant="body2" color="success.main">Low Risk</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Checks performed:
              </Typography>
              <List dense>
                {verificationData.fraudDetection.checks.map((check, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon>
                      <SuccessIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={check} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={() => setReportDialogOpen(true)}
        >
          View Full Report
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Download Report
        </Button>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => navigate('/upload')}
        >
          Upload Another Document
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Full Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon />
            Detailed Verification Report
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Verification Summary</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Document Type: {documentType}<br/>
            Verification ID: {verificationData.overall.verificationId}<br/>
            Processing Time: {verificationData.overall.processingTime}<br/>
            Overall Confidence: {verificationData.overall.confidence}%
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>Technical Details</Typography>
          <Typography variant="body2">
            • OCR Confidence: {ocrData.confidence}%<br/>
            • Template Match: {verificationData.templateMatch.confidence}%<br/>
            • Security Features: {verificationData.securityFeatures.confidence}%<br/>
            • Fraud Risk Score: {verificationData.fraudDetection.riskScore}/100<br/>
            • Blockchain Status: {verificationData.blockchainVerification.status}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default VerificationResult;