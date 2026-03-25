import React, { useState } from 'react';
     import { Box, Button, Typography, Container, Grid, Paper } from '@mui/material';
     import { styled } from '@mui/material/styles';
     import LockIcon from '@mui/icons-material/Lock';
     import BoltIcon from '@mui/icons-material/Bolt';
     import ShieldIcon from '@mui/icons-material/Shield';
     import SettingsIcon from '@mui/icons-material/Settings';
     import SignInModal from './SignInModal';
     import SignUpModal from './SignUpModal';
     import { useNavigate } from 'react-router-dom';

     const cardGradient = 'linear-gradient(135deg, #1a3f4a 0%, #2d5a63 50%, #3d7a8f 100%)';
     const accentColor = '#438b98';

     const Header = styled(Box)(({ theme }) => ({
       display: 'flex',
       justifyContent: 'space-between',
       alignItems: 'center',
       padding: theme.spacing(2, 4),
       borderBottom: '1px solid #eee',
     }));

     const HeroSection = styled(Box)(({ theme }) => ({
       textAlign: 'center',
       padding: theme.spacing(8, 2),
       background: 'linear-gradient(180deg, #f5fafc, #ffffff)',
     }));

     const InfoCard = styled(Paper)(({ theme, bgcolor }) => ({
        padding: theme.spacing(3, 5),
        textAlign: 'center',
        backgroundColor: bgcolor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(2),
      }));

     const CallToActionSection = styled(Box)(({ theme }) => ({
       textAlign: 'center',
       padding: theme.spacing(6, 2),
       backgroundColor: '#f5f5f5',
     }));

     const Footer = styled(Box)(({ theme }) => ({
       textAlign: 'center',
       padding: theme.spacing(4, 2),
       background: cardGradient,
       color: '#fff',
     }));

     function HomePage() {
       const [signInOpen, setSignInOpen] = useState(false);
       const [signUpOpen, setSignUpOpen] = useState(false);
       const navigate = useNavigate();

       const handleSignInOpen = () => setSignInOpen(true);
       const handleSignInClose = () => setSignInOpen(false);
       const handleSignUpOpen = () => setSignUpOpen(true);
       const handleSignUpClose = () => setSignUpOpen(false);
       const handleGetStarted = () => navigate('/register');

       return (
         <Box>
           {/* Header/Navbar */}
           <Header>
             <Typography variant="h6" sx={{ fontWeight: 'bold', color: accentColor }}>
               AegisID
             </Typography>
             <Box>
               <Button onClick={handleSignInOpen} sx={{ marginRight: 2, color: accentColor }}>Sign In</Button>
               <Button variant="contained" onClick={handleSignUpOpen} sx={{ background: cardGradient }}>Register</Button>
             </Box>
           </Header>

           {/* Hero Section */}
           <HeroSection>
             <Typography
               variant="h1"
               sx={{
                 mb: 2,
                 color: '#2b5f6b', // medium-dark shade
                 fontWeight: 600,
                 background: 'linear-gradient(135deg, #2b5f6b 0%, #3f7a88 100%)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 backgroundClip: 'text',
               }}
             >
               Secure Digital Identity
             </Typography>
             <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary' }}>
               Manage your digital identity and verify your documents with AegisID's cutting-edge blockchain technology.
             </Typography>
             <Box>
               <Button variant="contained" size="large" sx={{ mr: 2, background: cardGradient }} onClick={handleSignUpOpen}>Get Started</Button>
               <Button variant="outlined" size="large" sx={{ borderColor: accentColor, color: accentColor }} onClick={handleSignInOpen}>Sign In</Button>
             </Box>
           </HeroSection>

           {/* Why Choose AegisID Section */}
           <Container sx={{ py: 8 }}>
             <Typography variant="h4" textAlign="center" sx={{ mb: 6 }}>
               Why Choose AegisID?
             </Typography>
             <Grid container spacing={4}>
               <Grid item xs={12} md={4}>
                 <InfoCard bgcolor="#e8f4f7">
                   <ShieldIcon sx={{ fontSize: 60, color: accentColor }} />
                   <Typography variant="h6" fontWeight="bold">Secure Verification</Typography>
                   <Typography variant="body2" color="text.secondary">
                     Leverage blockchain for immutable and tamper-proof identity verification.
                   </Typography>
                 </InfoCard>
               </Grid>
               <Grid item xs={12} md={4}>
                 <InfoCard bgcolor="#e8f4f7">
                   <BoltIcon sx={{ fontSize: 60, color: accentColor }} />
                   <Typography variant="h6" fontWeight="bold">Fast Processing</Typography>
                   <Typography variant="body2" color="text.secondary">
                     Streamlined workflows ensure quick and efficient document processing.
                   </Typography>
                 </InfoCard>
               </Grid>
               <Grid item xs={12} md={6}>
                 <InfoCard bgcolor="#e8f4f7" sx={{ px: 10.8 }}>
                   <SettingsIcon sx={{ fontSize: 60, color: accentColor }} />
                   <Typography variant="h6" fontWeight="bold">Complete Control</Typography>
                   <Typography variant="body2" color="text.secondary">
                     You control access to your data. Own your digital identity.     
                   </Typography>
                 </InfoCard>
               </Grid>
               <Grid item xs={12} md={4}>
                 <InfoCard bgcolor="#e8f4f7" sx={{ px: 3.8 }}>
                   <LockIcon sx={{ fontSize: 60, color: accentColor }} />
                   <Typography variant="h6" fontWeight="bold">Document Management</Typography>
                   <Typography variant="body2" color="text.secondary">
                     Securely store and manage all your essential digital documents in one place.
                   </Typography>
                 </InfoCard>
               </Grid>
             </Grid>
           </Container>

           {/* Call to Action Section */}
           <CallToActionSection>
             <Typography variant="h4" sx={{ mb: 3 }}>
               Ready to secure your digital identity?
             </Typography>
             <Button variant="contained" size="large" sx={{ background: cardGradient, color: '#fff' }} onClick={handleSignUpOpen}>
               Start Your Verification
             </Button>
           </CallToActionSection>

           {/* Footer */}
           <Footer>
             <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>AegisID</Typography>
             <Typography variant="body2" sx={{ mb: 1 }}>Secure digital identity verification platform</Typography>
             <Typography variant="body2">© {new Date().getFullYear()} AegisID. All rights reserved.</Typography>
           </Footer>

           {/* Modals */}
           <SignInModal open={signInOpen} onClose={handleSignInClose} onSignUpClick={handleSignUpOpen} />
           <SignUpModal open={signUpOpen} onClose={handleSignUpClose} onSignInClick={handleSignInOpen} />
         </Box>
       );
     }

     export default HomePage;
