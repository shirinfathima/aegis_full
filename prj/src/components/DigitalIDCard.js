import React, { useState } from 'react';
import { Box, Card, Typography, Avatar, Grid, Chip, IconButton, Paper } from '@mui/material';
import { FlipCameraAndroid as FlipIcon, Verified as VerifiedIcon, School as SchoolIcon } from '@mui/icons-material';

const DigitalIDCard = ({ vcData }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Safely extract claims (handle different nesting levels if necessary)
  const claims = vcData?.credentialSubject?.claims || {};
  const front = claims.front || {};
  const back = claims.back || {};
  const isVerified = vcData?.proof?.type?.includes("JsonWebSignature2020");

  const CardFace = ({ side, children }) => (
    <Card 
      sx={{ 
        width: 350, 
        height: 220, 
        borderRadius: 3, 
        position: 'absolute', // Position absolute for stacking and flipping
        backfaceVisibility: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        overflow: 'hidden',
        display: 'flex', 
        flexDirection: 'column',
        transform: side === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)', // Initial rotation
        // Control visibility via CSS for smooth flip effect
        ...(isFlipped ? (side === 'front' ? { transform: 'rotateY(180deg)' } : { transform: 'rotateY(360deg)' }) : {})
      }}
    >
       {/* Background Pattern/Watermark */}
       <SchoolIcon sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: 150, opacity: 0.05, color: '#000' }} />
       
       <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
         {children}
       </Box>
       
       {/* Verified Badge */}
       {isVerified && (
         <Chip 
           icon={<VerifiedIcon sx={{ color: '#fff !important', fontSize: 14 }} />} 
           label="Verified" 
           size="small"
           sx={{ 
             position: 'absolute', 
             top: 15, 
             right: 15, 
             bgcolor: '#2e7d32', 
             color: '#fff',
             fontWeight: 'bold',
             boxShadow: 2
           }} 
         />
       )}
    </Card>
  );

  return (
    <Box sx={{ 
      width: 350, 
      height: 220, 
      perspective: '1000px', 
      position: 'relative',
      // Container styles for flip effect
      transformStyle: 'preserve-3d',
      transition: 'transform 0.6s'
    }}>
      {/* --- FRONT SIDE --- */}
      <CardFace side="front">
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: '0.7rem', textTransform: 'uppercase' }}>
            {front.University || "Trusted Organization"}
          </Typography>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
             <Avatar 
               sx={{ width: 70, height: 70, border: '3px solid white', boxShadow: 2, margin: '0 auto' }}
               src="/path/to/placeholder/avatar.jpg" // Placeholder for image
             />
          </Grid>
          <Grid item xs={8}>
            <Typography variant="h6" sx={{ fontWeight: '800', lineHeight: 1.2 }}>
              {front.Name || "Unknown Name"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
              {front.Course}
            </Typography>
            <Box sx={{ bgcolor: '#e3f2fd', display: 'inline-block', px: 1, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                ID: {front["Registration Number"] || "N/A"}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, borderTop: '1px dashed #ccc', pt: 1 }}>
            <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', color: '#666' }}>
               {front["University Address"]?.substring(0, 45) || 'No Address Provided'}
            </Typography>
        </Box>

        {/* Flip Button */}
        <IconButton 
            onClick={() => setIsFlipped(!isFlipped)}
            sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'rgba(255,255,255,0.8)', zIndex: 10 }}
        >
            <FlipIcon />
        </IconButton>
      </CardFace>

      {/* --- BACK SIDE --- */}
      <CardFace side="back">
         <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            Personal Details
         </Typography>
         <Grid container spacing={1}>
           {Object.entries(back).map(([key, value]) => (
             <Grid item xs={6} key={key}>
               <Box>
                 <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                   {key}
                 </Typography>
                 <Typography variant="body2" sx={{ fontWeight: '500', fontSize: '0.8rem' }}>
                   {value}
                 </Typography>
               </Box>
             </Grid>
           ))}
         </Grid>
         <Box sx={{ position: 'absolute', bottom: 15, left: 15 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#999' }}>
               DID: {vcData?.credentialSubject?.id?.substring(0, 15)}...
            </Typography>
         </Box>

         {/* Flip Button */}
         <IconButton 
            onClick={() => setIsFlipped(!isFlipped)}
            sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'rgba(255,255,255,0.8)', zIndex: 10 }}
         >
            <FlipIcon />
         </IconButton>
      </CardFace>
    </Box>
  );
};

export default DigitalIDCard;