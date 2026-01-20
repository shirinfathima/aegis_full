import React, { useState } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Button, Tabs, Tab, Paper
} from '@mui/material';

// Remove 'ExpandMore'
import { 
  Explore, Security, ContactSupport, Info, 
  VerifiedUser, Business, Person 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// We reuse logic from your existing files
import PrivacyPolicy from './PrivacyPolicy'; 
import Contact from './Contact';

function LandingDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const domains = [
    {
      title: 'User Domain',
      icon: <Person color="primary" sx={{ fontSize: 40 }} />,
      description: 'Manage your personal profile, upload identity documents, and view your verification status.',
      path: '/user'
    },
    {
      title: 'Issuer Domain',
      icon: <Business color="secondary" sx={{ fontSize: 40 }} />,
      description: 'Review document requests and issue secure, blockchain-backed digital credentials.',
      path: '/issuer/dashboard'
    },
    {
      title: 'Verifier Domain',
      icon: <VerifiedUser color="success" sx={{ fontSize: 40 }} />,
      description: 'Verify the authenticity of digital documents submitted by users in real-time.',
      path: '/verifier/dashboard'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome to AegisID
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Your secure gateway to blockchain-powered identity management.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab icon={<Info />} label="Overview & How-To" />
          <Tab icon={<Explore />} label="App Domains" />
          <Tab icon={<Security />} label="Privacy & Terms" />
          <Tab icon={<ContactSupport />} label="Support" />
        </Tabs>
      </Box>

      {/* Tab 0: Introduction & How to Use */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom fontWeight="bold">What is AegisID?</Typography>
              <Typography variant="body1" paragraph color="text.secondary">
                AegisID is a decentralized identity platform that leverages blockchain technology to ensure your 
                documents are immutable, secure, and easily verifiable. We eliminate the need for physical 
                paperwork by providing a "Trust-Net" of digital credentials.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom fontWeight="bold">How to Use AegisID</Typography>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>1. Upload:</strong> Go to the User Dashboard to upload your ID documents.</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>2. Verify:</strong> Wait for the AI-powered OCR and Liveness checks to process your data.</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>3. Manage:</strong> Access your issued documents anytime from your secure vault.</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 1: Domains */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {domains.map((domain, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  {domain.icon}
                  <Typography variant="h6" sx={{ my: 2 }}>{domain.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {domain.description}
                  </Typography>
                  <Button variant="outlined" onClick={() => navigate(domain.path)}>
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 2: Privacy (Reusing PrivacyPolicy.js logic) */}
      {activeTab === 2 && (
        <Paper elevation={0}>
          <PrivacyPolicy />
        </Paper>
      )}

      {/* Tab 3: Contact (Reusing Contact.js logic) */}
      {activeTab === 3 && (
        <Paper elevation={0}>
          <Contact />
        </Paper>
      )}
    </Container>
  );
}

export default LandingDashboard;