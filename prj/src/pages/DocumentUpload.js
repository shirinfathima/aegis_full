import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, Alert,
  Paper, LinearProgress, Stepper, Step, StepLabel, CircularProgress, TextField, Autocomplete
} from '@mui/material';
import {
  CloudUpload as UploadIcon, CheckCircle as CheckIcon,
  Article as ArticleIcon, Shield as ShieldIcon, 
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { uploadIdCard } from '../services/documentService';
import { getCurrentUser, getStoredPassword } from '../services/authService'; // Added for auth

const API_URL = 'http://localhost:8080/api'; // Added API constant
const steps = ['Upload ID Documents', 'Liveness Check', 'Verifying'];
const cardGradient = 'linear-gradient(135deg, #0f2027 0%, #438b98 45%, #2c5364 100%)';

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
    <Container maxWidth="md" sx={{ py: 4, background: '#f6f9fb', minHeight: '100vh' }}>
      <Box sx={{
        mb: 4,
        p: 3,
        borderRadius: 3,
        boxShadow: '0 12px 35px rgba(16, 39, 70, 0.15)',
        background: 'linear-gradient(135deg, #fff 0%, #f0f7ff 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(67, 139, 152, 0.1) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15, 32, 39, 0.08) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #438b98 0%, #2c5364 100%)',
            boxShadow: '0 8px 24px rgba(67, 139, 152, 0.3)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <ShieldIcon sx={{ fontSize: 32, color: '#fff' }} />
          </Box>

          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #0f2027 0%, #438b98 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Document Upload
            </Typography>
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
              Upload identity documents and complete liveness verification
            </Typography>
          </Box>
        </Box>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse {
            0%, 100% { box-shadow: 0 8px 24px rgba(67, 139, 152, 0.3); }
            50% { box-shadow: 0 8px 40px rgba(67, 139, 152, 0.6); }
          }
        `}</style>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {activeStep === 0 && (
        <Card sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 18px 45px rgba(0,0,0,0.14)',
          border: '1px solid #203a43',
          background: cardGradient
        }}>
          <Box sx={{ background: cardGradient, p: 3 }}>
            <Typography variant="h5" sx={{ color: '#f1f8ff', mb: 2 }}>Step 1: Document Details</Typography>
          </Box>
          <CardContent sx={{ bgcolor: '#fdfdff' }}>
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
                disabled={!frontFile || !backFile || !selectedIssuer}
                sx={{
                  background: 'linear-gradient(135deg, #0f2027 0%, #438b98 45%, #2c5364 100%)',
                  color:'#fff',
                  px:4,
                  py:1.4,
                  fontWeight:700,
                  borderRadius: 2,
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #1a3a45 0%, #5aa8b8 45%, #3d7a8f 100%)',
                    boxShadow: '0 8px 24px rgba(67, 139, 152, 0.3)'
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    color: 'rgba(0,0,0,0.26)'
                  }
                }}
              >
                Continue to Liveness Check
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Liveness Check */}
      {activeStep === 1 && (
        <Card sx={{
          borderRadius: 4, p:3, textAlign:'center',
          boxShadow:'0 18px 45px rgba(0,0,0,0.14)',
          background: cardGradient,
          color: '#fff'
        }}>
          <Typography variant="h5" color="inherit" gutterBottom>Step 2: Blink 5 Times</Typography>
          <Box sx={{ position: 'relative', display: 'inline-block', mt: 2 }}>
            <Webcam 
              audio={false} 
              ref={webcamRef} 
              screenshotFormat="image/jpeg" 
              style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.25)' }} 
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
        <Card sx={{
          borderRadius: 4, textAlign: 'center', py: 10,
          boxShadow: '0 18px 45px rgba(0,0,0,0.14)',
          background: cardGradient, color: '#fff'
        }}>
          <CircularProgress size={60} sx={{ color:'#cddcfe' }} />
          <Typography variant="h6" sx={{ mt: 3 }}>Processing AI Verification...</Typography>
        </Card>
      )}
    </Container>
  );
}

const FileUploadBox = ({ file, onSelect, title, inputId }) => (
  <Paper
    sx={{
      border: '2px dashed rgba(255,255,255,0.35)',
      background: cardGradient,
      color: '#fff',
      width: '100%',
      minHeight: file ? 160 : 180,
      height: file ? 160 : 180,
      p: 2,
      textAlign: 'center',
      cursor: 'pointer',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.5,
      borderRadius: 2,
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: 'linear-gradient(135deg, #1a3a45 0%, #5aa8b8 45%, #3d7a8f 100%)',
        transform: 'scale(1.02)'
      }
    }}
    onClick={() => document.getElementById(inputId).click()}
  >
    <input id={inputId} type="file" accept="image/*" onChange={onSelect} style={{ display: 'none' }} />
    {file
      ? <CheckIcon sx={{ fontSize: 48, color: '#a5d6a7', flexShrink: 0 }} />
      : <ArticleIcon sx={{ fontSize: 48, color: '#90caf9', flexShrink: 0 }} />
    }
    <Typography
      variant="subtitle1"
      sx={{
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        fontWeight: 700,
        fontSize: '0.9rem',
        lineHeight: 1.3,
        color: '#fff'
      }}
    >
      {file ? file.name : title}
    </Typography>
    {file && (
      <Typography variant="caption" sx={{ color: '#c8e6ff', flexShrink: 0 }}>
        Uploaded
      </Typography>
    )}
  </Paper>
);

export default DocumentUpload;