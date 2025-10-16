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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  Visibility as PreviewIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Scanner as ScanIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function DocumentUpload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock OCR extracted data
  const [extractedData, setExtractedData] = useState({
    fullName: '',
    dateOfBirth: '',
    idNumber: '',
    issuedDate: '',
    expiryDate: '',
    address: '',
    nationality: ''
  });

  const documentTypes = [
    { value: 'national-id', label: 'National ID Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driver-license', label: 'Driver License' },
    { value: 'birth-certificate', label: 'Birth Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid file type (JPEG, PNG, PDF)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const processOCR = async () => {
    if (!selectedFile || !documentType) {
      alert('Please select a file and document type');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate OCR processing
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Mock extracted data based on document type
      const mockData = {
        'national-id': {
          fullName: 'John Michael Doe',
          dateOfBirth: '1990-05-15',
          idNumber: 'ID123456789',
          issuedDate: '2020-01-15',
          expiryDate: '2030-01-15',
          address: '123 Main Street, City, State 12345',
          nationality: 'United States'
        },
        'passport': {
          fullName: 'John Michael Doe',
          dateOfBirth: '1990-05-15',
          idNumber: 'P123456789',
          issuedDate: '2019-03-20',
          expiryDate: '2029-03-20',
          address: '',
          nationality: 'United States'
        },
        'driver-license': {
          fullName: 'John Michael Doe',
          dateOfBirth: '1990-05-15',
          idNumber: 'DL123456789',
          issuedDate: '2018-07-10',
          expiryDate: '2026-07-10',
          address: '123 Main Street, City, State 12345',
          nationality: ''
        }
      };

      setExtractedData(mockData[documentType] || mockData['national-id']);
      setOcrData({
        confidence: Math.floor(Math.random() * 20) + 80, // 80-99% confidence
        processingTime: '2.3s',
        status: 'success'
      });
      setIsProcessing(false);
    }, 3000);
  };

  const handleDataChange = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    const requiredFields = ['fullName', 'dateOfBirth', 'idNumber'];
    const missingFields = requiredFields.filter(field => !extractedData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Navigate to verification result
    navigate('/verification-result', { 
      state: { 
        documentData: extractedData, 
        ocrData, 
        documentType,
        fileName: selectedFile.name
      } 
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon /> Document Upload & OCR
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload your document and let our AI extract the information automatically
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                1. Upload Document
              </Typography>

              {/* Document Type Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  label="Document Type"
                >
                  {documentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* File Upload Area */}
              <Paper
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: selectedFile ? '#f5f5f5' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#f9f9f9'
                  }
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                {selectedFile ? (
                  <Box>
                    <DocumentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">{selectedFile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                    <Chip label="File Selected" color="success" sx={{ mt: 1 }} />
                  </Box>
                ) : (
                  <Box>
                    <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Drop files here or click to browse
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supports: PDF, JPEG, PNG (Max 10MB)
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Process Button */}
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={processOCR}
                  disabled={!selectedFile || !documentType || isProcessing}
                  startIcon={<ScanIcon />}
                >
                  {isProcessing ? 'Processing...' : 'Extract Information with OCR'}
                </Button>
              </Box>

              {/* Progress Bar */}
              {isProcessing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    Processing document... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {/* OCR Status */}
              {ocrData && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <strong>OCR Complete!</strong> Extracted data with {ocrData.confidence}% confidence in {ocrData.processingTime}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Preview and Edit Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                2. Review & Confirm Extracted Data
              </Typography>

              {!ocrData ? (
                <Alert severity="info">
                  Upload and process a document to see extracted information here.
                </Alert>
              ) : (
                <Box>
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PreviewIcon />}
                      onClick={() => setPreviewOpen(true)}
                    >
                      Preview Document
                    </Button>
                    <Chip 
                      label={`${ocrData.confidence}% Confidence`} 
                      color={ocrData.confidence > 90 ? 'success' : ocrData.confidence > 70 ? 'warning' : 'error'}
                    />
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* Extracted Data Form */}
                  <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon fontSize="small" />
                    Edit extracted information if needed:
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name *"
                        value={extractedData.fullName}
                        onChange={(e) => handleDataChange('fullName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth *"
                        type="date"
                        value={extractedData.dateOfBirth}
                        onChange={(e) => handleDataChange('dateOfBirth', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ID Number *"
                        value={extractedData.idNumber}
                        onChange={(e) => handleDataChange('idNumber', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Issued Date"
                        type="date"
                        value={extractedData.issuedDate}
                        onChange={(e) => handleDataChange('issuedDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        type="date"
                        value={extractedData.expiryDate}
                        onChange={(e) => handleDataChange('expiryDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    {extractedData.address && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          multiline
                          rows={2}
                          value={extractedData.address}
                          onChange={(e) => handleDataChange('address', e.target.value)}
                        />
                      </Grid>
                    )}
                    {extractedData.nationality && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Nationality"
                          value={extractedData.nationality}
                          onChange={(e) => handleDataChange('nationality', e.target.value)}
                        />
                      </Grid>
                    )}
                  </Grid>

                  {/* Submit Button */}
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleSubmit}
                      startIcon={<CheckIcon />}
                    >
                      Confirm & Start Verification
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Document Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {selectedFile && (
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Document Preview"
                style={{ maxWidth: '100%', maxHeight: '400px' }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DocumentUpload;