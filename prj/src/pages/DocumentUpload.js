import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  TextField,
  Autocomplete // IMPORT Autocomplete
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { uploadIdCard } from '../services/documentService';
import { getCurrentUser, getStoredPassword } from '../services/authService';

const API_URL = 'http://localhost:8080/api';

function DocumentUpload() {
  const navigate = useNavigate();
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  
  // State for issuers list and selection
  const [issuers, setIssuers] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState(null); // Changed to object for Autocomplete
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIssuers = async () => {
      try {
        const user = getCurrentUser();
        const password = getStoredPassword();

        // Call the new endpoint we just created
        const response = await fetch(`${API_URL}/user/issuers`, {
          headers: {
            'Authorization': 'Basic ' + btoa(`${user.email}:${password}`)
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIssuers(data);
        } else {
          console.error("Failed to fetch issuers");
        }
      } catch (err) {
        console.error("Error fetching issuers:", err);
      }
    };

    fetchIssuers();
  }, []);

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
    if (!selectedIssuer) {
      setError('Please search for and select an issuer.');
      return;
    }
    if (!frontFile || !backFile) {
      setError('Please select both the front and back images of your ID.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Pass the ID of the selected issuer object
      await uploadIdCard(frontFile, backFile, selectedIssuer.id);
      
      alert('Your document has been submitted for verification!');
      navigate('/user');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsProcessing(false);
    }
  };

  const FileUploadBox = ({ file, onSelect, title, inputId }) => (
    <Paper
      sx={{ 
        border: '2px dashed #ccc', 
        p: 3, 
        textAlign: 'center', 
        cursor: 'pointer', 
        backgroundColor: file ? '#f5f5f5' : 'transparent', 
        '&:hover': { backgroundColor: '#f9f9f9' }
      }}
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
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon /> Document Upload
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload your ID and assign it to an issuer for verification.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {/* SEARCHABLE ISSUER BOX */}
          <Box sx={{ mb: 4 }}>
            <Autocomplete
              id="issuer-search"
              options={issuers}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={selectedIssuer}
              onChange={(event, newValue) => {
                setSelectedIssuer(newValue);
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Search for an Issuer" 
                  placeholder="Type to search by name..." 
                />
              )}
              noOptionsText="No issuers found"
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FileUploadBox 
                file={frontFile} 
                onSelect={(e) => handleFileSelect(e, 'front')} 
                title="Upload Front of ID" 
                inputId="front-upload" 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FileUploadBox 
                file={backFile} 
                onSelect={(e) => handleFileSelect(e, 'back')} 
                title="Upload Back of ID" 
                inputId="back-upload" 
              />
            </Grid>
          </Grid>
          
          {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
          {isProcessing && <LinearProgress sx={{ mt: 3 }} />}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!frontFile || !backFile || !selectedIssuer || isProcessing}
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