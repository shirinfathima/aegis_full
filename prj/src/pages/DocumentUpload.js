import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, Alert, 
  Paper, LinearProgress, Stepper, Step, StepLabel, CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon, CheckCircle as CheckIcon, 
  Article as ArticleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { uploadIdCard } from '../services/documentService';

const steps = ['Upload ID Documents', 'Liveness Check', 'Verifying'];

function DocumentUpload() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isLivenessComplete, setIsLivenessComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event, fileType) => {
    const file = event.target.files[0];
    if (!file) return;
    if (fileType === 'front') setFrontFile(file);
    else setBackFile(file);
    setError(null);
  };

  useEffect(() => {
    if (activeStep === 1 && blinkCount < 5) {
      const timer = setTimeout(() => {
        setBlinkCount(prev => prev + 1);
      }, 1200); 
      return () => clearTimeout(timer);
    } else if (blinkCount >= 5 && !isLivenessComplete) {
      capturePhotoAndSubmit();
    }
  }, [activeStep, blinkCount, isLivenessComplete]);

  const capturePhotoAndSubmit = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setIsLivenessComplete(true);
    setActiveStep(2);
    
    try {
      const blob = await fetch(imageSrc).then(res => res.blob());
      const selfieFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      await uploadIdCard(frontFile, backFile, selfieFile);
      alert('Verification process started successfully!');
      navigate('/user');
    } catch (err) {
      setError(err.message || 'Verification failed.');
      setActiveStep(0);
      setBlinkCount(0);
      setIsLivenessComplete(false);
    }
  }, [webcamRef, frontFile, backFile, navigate]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3 }}>Step 1: Upload ID Images</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FileUploadBox file={frontFile} onSelect={(e) => handleFileSelect(e, 'front')} title="Front of ID" inputId="f-up" />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadBox file={backFile} onSelect={(e) => handleFileSelect(e, 'back')} title="Back of ID" inputId="b-up" />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button variant="contained" onClick={() => setActiveStep(1)} disabled={!frontFile || !backFile}>
                Continue to Liveness Check
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="h5" color="primary" gutterBottom>Step 2: Blink 5 Times</Typography>
          <Box sx={{ position: 'relative', display: 'inline-block', mt: 2 }}>
            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" style={{ width: '100%', maxWidth: '500px', borderRadius: '12px' }} />
            <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 3, py: 1, borderRadius: 10 }}>
              <Typography variant="h6">Blinks: {blinkCount} / 5</Typography>
            </Box>
          </Box>
          <LinearProgress variant="determinate" value={(blinkCount / 5) * 100} sx={{ mt: 3, height: 10, borderRadius: 5 }} />
        </Card>
      )}

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
  <Paper sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#f9f9f9' }}} onClick={() => document.getElementById(inputId).click()}>
    <input id={inputId} type="file" accept="image/*" onChange={onSelect} style={{ display: 'none' }} />
    {file ? <CheckIcon color="success" sx={{ fontSize: 48 }} /> : <ArticleIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
    <Typography variant="subtitle1">{file ? file.name : title}</Typography>
  </Paper>
);

export default DocumentUpload;