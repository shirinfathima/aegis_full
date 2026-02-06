import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, Alert,
  Paper, LinearProgress, Stepper, Step, StepLabel, CircularProgress, TextField, Autocomplete
} from '@mui/material';
import {
  CloudUpload as UploadIcon, CheckCircle as CheckIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { uploadIdCard } from '../services/documentService';
import { getCurrentUser, getStoredPassword } from '../services/authService'; // Added for auth

const API_URL = 'http://localhost:8080/api'; // Added API constant
const steps = ['Upload ID Documents', 'Liveness Check', 'Verifying'];

function DocumentUpload() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  // File State
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);

  // Issuer Selection State
  const [issuers, setIssuers] = useState([]);
  const [selectedIssuer, setSelectedIssuer] = useState(null);

  // Liveness State
  const [blinkCount, setBlinkCount] = useState(0);
  const [isLivenessComplete, setIsLivenessComplete] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. Fetch Issuers on Component Load ---
  useEffect(() => {
    const fetchIssuers = async () => {
      try {
        const user = getCurrentUser();
        const password = getStoredPassword();

        if (!user || !password) return;

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
    if (fileType === 'front') setFrontFile(file);
    else setBackFile(file);
    setError(null);
  };

  // --- 2. Liveness Logic ---
  useEffect(() => {
    if (activeStep === 1 && blinkCount < 5) {
      const timer = setTimeout(() => {
        setBlinkCount(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (blinkCount >= 5 && !isLivenessComplete) {
      capturePhotoAndSubmit();
    }
  }, [activeStep, blinkCount, isLivenessComplete]); // Added capturePhotoAndSubmit to deps in next block

  // --- 3. Submission Logic (Updated with Issuer ID) ---
  const capturePhotoAndSubmit = useCallback(async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsLivenessComplete(true);
    setActiveStep(2);

    try {
      const blob = await fetch(imageSrc).then(res => res.blob());
      const selfieFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      if (!selectedIssuer) {
        throw new Error("No issuer selected.");
      }

      // Pass selectedIssuer.id to the service
      await uploadIdCard(frontFile, backFile, selfieFile, selectedIssuer.id);
      
      alert('Verification process started successfully!');
      navigate('/user');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Verification failed.');
      setActiveStep(0);
      setBlinkCount(0);
      setIsLivenessComplete(false);
    }
  }, [webcamRef, frontFile, backFile, selectedIssuer, navigate]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {/* STEP 1: Upload & Issuer Selection */}
      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3 }}>Step 1: Document Details</Typography>
            
            {/* Issuer Selection Dropdown */}
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
                    placeholder="Type to search (e.g., University)..." 
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
                  title="Front of ID" 
                  inputId="f-up" 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadBox 
                  file={backFile} 
                  onSelect={(e) => handleFileSelect(e, 'back')} 
                  title="Back of ID" 
                  inputId="b-up" 
                />
              </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                onClick={() => setActiveStep(1)} 
                // Validation: Disable if files OR issuer are missing
                disabled={!frontFile || !backFile || !selectedIssuer}
              >
                Continue to Liveness Check
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Liveness Check */}
      {activeStep === 1 && (
        <Card sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="h5" color="primary" gutterBottom>Step 2: Blink 5 Times</Typography>
          <Box sx={{ position: 'relative', display: 'inline-block', mt: 2 }}>
            <Webcam 
              audio={false} 
              ref={webcamRef} 
              screenshotFormat="image/jpeg" 
              style={{ width: '100%', maxWidth: '500px', borderRadius: '12px' }} 
            />
            <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 3, py: 1, borderRadius: 10 }}>
              <Typography variant="h6">Blinks: {blinkCount} / 5</Typography>
            </Box>
          </Box>
          <LinearProgress variant="determinate" value={(blinkCount / 5) * 100} sx={{ mt: 3, height: 10, borderRadius: 5 }} />
        </Card>
      )}

      {/* STEP 3: Verifying */}
      {activeStep === 2 && (
        <Card sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>Processing AI Verification...</Typography>
        </Card>
      )}
    </Container>
  );
}

const FileUploadBox = ({ file, onSelect, title, inputId }) => (
  <Paper 
    sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#f9f9f9' }}} 
    onClick={() => document.getElementById(inputId).click()}
  >
    <input id={inputId} type="file" accept="image/*" onChange={onSelect} style={{ display: 'none' }} />
    {file ? <CheckIcon color="success" sx={{ fontSize: 48 }} /> : <ArticleIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
    <Typography variant="subtitle1">{file ? file.name : title}</Typography>
  </Paper>
);

export default DocumentUpload;