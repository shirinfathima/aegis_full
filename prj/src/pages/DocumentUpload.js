import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Paper,
  LinearProgress
  // Chip has been removed from this list
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { uploadIdCard } from '../services/documentService';

function DocumentUpload() {
  const navigate = useNavigate();
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event, fileType) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }
    
    if (fileType === 'front') setFrontFile(file);
    else setBackFile(file);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!frontFile || !backFile) {
      setError('Please select both the front and back images of your ID.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await uploadIdCard(frontFile, backFile);
      console.log('Upload successful, backend processing started:', result);
      alert('Your document has been submitted for verification!');
      
      // Navigate back to the dashboard to see the new pending document
      navigate('/user');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsProcessing(false);
    }
  };

  const FileUploadBox = ({ file, onSelect, title, inputId }) => (
    <Paper
      sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', cursor: 'pointer', backgroundColor: file ? '#f5f5f5' : 'transparent', '&:hover': { backgroundColor: '#f9f9f9' }}}
      onClick={() => document.getElementById(inputId).click()}
    >
      <input id={inputId} type="file" accept=".jpg,.jpeg,.png" onChange={onSelect} style={{ display: 'none' }} />
      {file ? (
        <Box>
          <CheckIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6">{file.name}</Typography>
          <Typography variant="body2" color="text.secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Typography>
        </Box>
      ) : (
        <Box>
          <ArticleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">{title}</Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><UploadIcon /> Document Upload</Typography>
        <Typography variant="body1" color="text.secondary">Upload the front and back of your ID document to begin verification.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FileUploadBox file={frontFile} onSelect={(e) => handleFileSelect(e, 'front')} title="Upload Front of ID" inputId="front-upload" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FileUploadBox file={backFile} onSelect={(e) => handleFileSelect(e, 'back')} title="Upload Back of ID" inputId="back-upload" />
            </Grid>
          </Grid>
          
          {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
          {isProcessing && <LinearProgress sx={{ mt: 3 }} />}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!frontFile || !backFile || isProcessing}
              startIcon={<CheckIcon />}
              sx={{ py: 1.5, px: 5 }}
            >
              {isProcessing ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default DocumentUpload;