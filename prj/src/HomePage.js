     import React, { useState } from 'react';
     import { Box, Button, Typography, Container, Grid, Paper } from '@mui/material';
     import { styled } from '@mui/material/styles';
     import LockIcon from '@mui/icons-material/Lock';
     import BoltIcon from '@mui/icons-material/Bolt';
     import ShieldIcon from '@mui/icons-material/Shield';
     import SignInModal from './SignInModal'; // Create this component next
     import SignUpModal from './SignUpModal'; // Create this component next
     import { useNavigate } from 'react-router-dom'; // <-- Add this import

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
       background: 'linear-gradient(180deg, #f0f8ff, #ffffff)', // Light gradient for hero
     }));

     const InfoCard = styled(Paper)(({ theme, bgcolor }) => ({
       padding: theme.spacing(3),
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
       backgroundColor: '#f5f5f5', // Light background
     }));

     const Footer = styled(Box)(({ theme }) => ({
       textAlign: 'center',
       padding: theme.spacing(4, 2),
       backgroundColor: '#333', // Darker footer
       color: '#fff',
     }));

     function HomePage() {
       const [signInOpen, setSignInOpen] = useState(false);
       const [signUpOpen, setSignUpOpen] = useState(false);
       const navigate = useNavigate(); // <-- Add this line

       const handleSignInOpen = () => setSignInOpen(true);
       const handleSignInClose = () => setSignInOpen(false);
       const handleSignUpOpen = () => setSignUpOpen(true);
       const handleSignUpClose = () => setSignUpOpen(false);
       const handleGetStarted = () => navigate('/register'); // <-- Update this function
       return (
         <Box>
           {/* Header/Navbar */}
           <Header>
             <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
               AegisID
             </Typography>
             <Box>
               <Button onClick={handleSignInOpen} sx={{ marginRight: 2 }}>Sign In</Button>
               <Button variant="contained" onClick={handleSignUpOpen}>Register</Button>
             </Box>
           </Header>

           {/* Hero Section */}
           <HeroSection>
             <Typography variant="h1" sx={{ mb: 2 }}>
               Secure Digital <span style={{ color: '#1A73E8' }}>Identity</span>
             </Typography>
             <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary' }}>
               Manage your digital identity and verify your documents with AegisID's cutting-edge blockchain technology.
             </Typography>
             <Box>
               <Button variant="contained" size="large" sx={{ mr: 2 }} onClick={handleSignUpOpen}>Get Started</Button>
               <Button variant="outlined" size="large" onClick={handleSignInOpen}>Sign In</Button>
             </Box>
           </HeroSection>

           {/* Why Choose AegisID Section */}
           <Container sx={{ py: 8 }}>
             <Typography variant="h4" textAlign="center" sx={{ mb: 6 }}>
               Why Choose AegisID?
             </Typography>
             <Grid container spacing={4}>
               <Grid item xs={12} md={4}>
                 <InfoCard bgcolor="#e3f2fd">
                   <ShieldIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                   <Typography variant="h6" fontWeight="bold">Secure Verification</Typography>
                   <Typography variant="body2" color="text.secondary">
                     Leverage blockchain for immutable and tamper-proof identity verification.
                   </Typography>
                 </InfoCard>
               </Grid>
               <Grid item xs={12} md={4}>
                 <InfoCard bgcolor="#e8f5e9">
                   <BoltIcon sx={{ fontSize: 60, color: 'success.main' }} />
                   <Typography variant="h6" fontWeight="bold">Fast Processing</Typography>
                   <Typography variant="body2" color="text.secondary">
                     Streamlined workflows ensure quick and efficient document processing.
                   </Typography>
                 </InfoCard>
               </Grid>
               <Grid item xs={12} md={4}>
                 <InfoCard bgcolor="#f3e5f5">
                   <LockIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
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
             <Button variant="contained" size="large" sx={{ backgroundColor: '#ffffffff', color: 'primary.main' }} onClick={handleSignUpOpen}>
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
     