import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Container,
  Typography,
  CardContent,
  Button,
  Grid,
  Alert,
  Paper,
  LinearProgress,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { uploadIdCard } from '../services/documentService';
import { getCurrentUser, getStoredPassword } from '../services/authService';
import { GlassCard, gradients } from '../styles/ModernComponents';

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
        border: '2px dashed',
        borderColor: file ? 'transparent' : 'rgba(102, 126, 234, 0.3)',
        background: file ? gradients.green : 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(10px)',
        p: 4, 
        textAlign: 'center', 
        cursor: 'pointer',
        borderRadius: '16px',
        transition: 'all 0.3s ease-in-out',
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 30px rgba(102, 126, 234, 0.15)',
          borderColor: 'rgba(102, 126, 234, 0.5)',
        }
      }}
      onClick={() => document.getElementById(inputId).click()}
    >
      <input id={inputId} type="file" accept=".jpg,.jpeg,.png" onChange={onSelect} style={{ display: 'none' }} />
      {file ? (
        <Stack spacing={2} alignItems="center">
          <CheckIcon sx={{ fontSize: 56, color: 'white' }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>{file.name}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</Typography>
        </Stack>
      ) : (
        <Stack spacing={2} alignItems="center">
          <ArticleIcon sx={{ fontSize: 56, color: '#667eea' }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>{title}</Typography>
        </Stack>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography 
            variant="h3" 
            fontWeight={700}
            sx={{ 
              mb: 1,
              background: gradients.purple,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Document Upload
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            Upload your ID and assign it to an issuer for verification
          </Typography>
        </Box>

      <GlassCard>
        <CardContent sx={{ p: 4 }}>
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
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 3,
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </Alert>
          )}
          {isProcessing && <LinearProgress sx={{ mt: 3, borderRadius: '4px', height: 6 }} />}

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!frontFile || !backFile || !selectedIssuer || isProcessing}
              startIcon={<CheckIcon />}
              sx={{
                background: gradients.purple,
                fontWeight: 600,
                py: 1.5,
                px: 5,
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f93 100%)',
                  boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)',
                },
                '&:disabled': {
                  background: 'rgba(102, 126, 234, 0.3)',
                }
              }}
            >
              {isProcessing ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </Box>
        </CardContent>
      </GlassCard>
      </Stack>
    </Container>
  );
}

export default DocumentUpload;