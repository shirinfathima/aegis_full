import React from 'react';
import { Typography, Box, Paper, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WelcomeLayout from '../components/WelcomeLayout';
import { RateReview, Verified, Storage } from '@mui/icons-material';

function IssuerWelcome() {
  const navigate = useNavigate();

  const introduction = (
    <Box>
      <Paper sx={{ p: 4, mb: 3, borderRadius: 4, background: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom color="secondary">
          Issuer Management Guide
        </Typography>
        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <RateReview color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Review Requests</Typography>
            <Typography variant="body2" color="text.secondary">Validate user-submitted documents against official records.</Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Verified color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Issue Credentials</Typography>
            <Typography variant="body2" color="text.secondary">Sign digital IDs using secure blockchain anchoring.</Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Storage color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Manage Records</Typography>
            <Typography variant="body2" color="text.secondary">Maintain a tamper-proof history of all issued documents.</Typography>
          </Grid>
        </Grid>
        <Button 
          variant="contained" 
          color="secondary"
          size="large" 
          sx={{ mt: 4, borderRadius: 3 }} 
          onClick={() => navigate('/issuer/dashboard')}
        >
          Open Issuer Panel
        </Button>
      </Paper>
    </Box>
  );

  return <WelcomeLayout roleName="Issuer" introContent={introduction} />;
}

export default IssuerWelcome;