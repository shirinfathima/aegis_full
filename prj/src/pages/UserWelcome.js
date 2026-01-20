import React from 'react';
import { Typography, Box, Paper, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WelcomeLayout from '../components/WelcomeLayout';
import { CloudUpload, AssignmentTurnedIn, Share } from '@mui/icons-material';

function UserWelcome() {
  const navigate = useNavigate();

  const introduction = (
    <Box>
      <Paper sx={{ p: 4, mb: 3, borderRadius: 4, background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
          Getting Started as a User
        </Typography>
        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <CloudUpload color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">1. Upload ID</Typography>
            <Typography variant="body2" color="text.secondary">Submit your government documents for AI-powered verification.</Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <AssignmentTurnedIn color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">2. Get Verified</Typography>
            <Typography variant="body2" color="text.secondary">Our system anchors your data to the blockchain for immutability.</Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Share color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">3. Share Identity</Typography>
            <Typography variant="body2" color="text.secondary">Present your digital ID securely to any verifier instantly.</Typography>
          </Grid>
        </Grid>
        <Button 
          variant="contained" 
          size="large" 
          sx={{ mt: 4, borderRadius: 3 }} 
          onClick={() => navigate('/user')}
        >
          Go to My Dashboard
        </Button>
      </Paper>
    </Box>
  );

  return <WelcomeLayout roleName="User" introContent={introduction} />;
}

export default UserWelcome;