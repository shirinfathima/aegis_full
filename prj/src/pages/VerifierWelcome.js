import React from 'react';
import { Typography, Box, Paper, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WelcomeLayout from '../components/WelcomeLayout';
import { FactCheck, Security, Gavel } from '@mui/icons-material';

function VerifierWelcome() {
  const navigate = useNavigate();

  const introduction = (
    <Box>
      <Paper sx={{ 
        p: 4, 
        mb: 3, 
        borderRadius: 4, 
        background: 'linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)' // Soft green gradient
      }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom color="success.main">
          Verification Portal Overview
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          As a Verifier, your role is to maintain the integrity of the trust-net by validating digital credentials submitted by users.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <FactCheck color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Validate Authenticity</Typography>
            <Typography variant="body2" color="text.secondary">
              Review user documents and compare them against immutable blockchain hashes.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Security color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Signature Check</Typography>
            <Typography variant="body2" color="text.secondary">
              Instantly verify that credentials were signed by an authorized Issuer.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Gavel color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Audit Ready</Typography>
            <Typography variant="body2" color="text.secondary">
              Access real-time verification logs to ensure full regulatory compliance.
            </Typography>
          </Grid>
        </Grid>
        
        <Button 
          variant="contained" 
          color="success"
          size="large" 
          sx={{ mt: 4, borderRadius: 3, px: 6 }} 
          onClick={() => navigate('/verifier/dashboard')}
        >
          Enter Verification Dashboard
        </Button>
      </Paper>
    </Box>
  );

  return <WelcomeLayout roleName="Verifier" introContent={introduction} />;
}

export default VerifierWelcome;