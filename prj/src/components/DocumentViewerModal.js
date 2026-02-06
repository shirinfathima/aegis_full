import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogTitle, Typography, Box, 
  Chip, Divider, Button, Grid, Paper, Tooltip, Alert 
} from '@mui/material';
import { 
  Visibility, VisibilityOff, Description, 
  VerifiedUser, GppGood, FlipCameraAndroid 
} from '@mui/icons-material';

const DocumentViewerModal = ({ isOpen, onClose, request }) => {
  const [viewSide, setViewSide] = useState('front'); // State to track which side is shown

  // Reset to front view whenever the modal opens or request changes
  useEffect(() => {
    if (isOpen) setViewSide('front');
  }, [isOpen, request]);

  if (!request || !request.document) return null;

  const { accessType, allowedFields, document, verifierEmail } = request;
  const isRedacted = accessType === 'REDACTED';
  const hasBackImage = !!document.fileDataBack; // Check if back image exists

  // --- 1. PARSE OCR DATA ---
  let ocrData = {};
  try {
    ocrData = JSON.parse(document.ocrData || "{}");
  } catch (e) {
    // console.error("OCR Parse Error", e);
  }

  // --- 2. PERMISSION CHECKER ---
  const isFieldAllowed = (fieldName) => {
    if (!isRedacted) return true; 
    if (!allowedFields) return false;
    return allowedFields.toLowerCase().includes(fieldName.toLowerCase());
  };

  // --- 3. DATA EXTRACTION ---
  const displayData = {
    Name: isFieldAllowed('Name') ? (ocrData.front?.name || "John Doe") : "REDACTED",
    DOB: isFieldAllowed('Date of Birth') ? (ocrData.front?.dob || "01/01/2000") : "REDACTED",
    ID_Number: isFieldAllowed('Reg No') ? (ocrData.front?.idNo || "123456789") : "REDACTED",
    Address: isFieldAllowed('Address') ? (ocrData.back?.address || "123 Tech Street") : "REDACTED"
  };

  // Determine current image source based on toggle state
  const currentImageSrc = viewSide === 'front' 
    ? document.fileData 
    : document.fileDataBack;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      {/* HEADER */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        <Description color="primary"/> 
        {isRedacted ? "Redacted Document View" : "Full Document View"}
        
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Chip 
                label={isRedacted ? "Restricted Access" : "Full Access"} 
                color={isRedacted ? "warning" : "primary"} 
                size="small" 
            />
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mt: 0 }}>
            
            {/* --- LEFT: DOCUMENT IMAGE (With Watermark & Stamp) --- */}
            <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{color:'text.secondary'}}>
                        OFFICIAL RECORD ({viewSide.toUpperCase()})
                    </Typography>
                    
                    {/* FLIP BUTTON */}
                    {hasBackImage && (!isRedacted || isFieldAllowed('Photo')) && (
                        <Button 
                            size="small" 
                            startIcon={<FlipCameraAndroid />} 
                            onClick={() => setViewSide(prev => prev === 'front' ? 'back' : 'front')}
                            variant="outlined"
                        >
                            Flip to {viewSide === 'front' ? 'Back' : 'Front'}
                        </Button>
                    )}
                </Box>
                
                <Paper 
                    variant="outlined" 
                    sx={{ 
                        height: 350, 
                        position: 'relative', 
                        overflow: 'hidden',
                        bgcolor: '#333',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 2
                    }}
                >
                    {(!isRedacted || isFieldAllowed('Photo')) ? (
                        <>
                            {/* A. THE IMAGE (Toggles based on state) */}
                            <img 
                                key={viewSide} // Forces re-render on flip
                                src={currentImageSrc ? `data:image/png;base64,${currentImageSrc}` : "https://via.placeholder.com/500x350?text=Image+Not+Found"} 
                                alt="Document" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />

                            {/* B. THE DIGITAL STAMP (Only on Front usually, but we keep on both for now) */}
                            <Tooltip title={`Digitally Signed by Issuer: ${document.issuerEmail || 'TrustNet Authority'}`}>
                                <Box sx={{
                                    position: 'absolute',
                                    top: 15, right: 15,
                                    bgcolor: 'rgba(255, 215, 0, 0.9)', 
                                    color: '#5c3a00',
                                    border: '2px solid #fff',
                                    borderRadius: '50%',
                                    width: 70, height: 70,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    zIndex: 10,
                                    transform: 'rotate(15deg)'
                                }}>
                                    <GppGood sx={{ fontSize: 24 }} />
                                    <Typography variant="caption" sx={{ fontSize: 8, fontWeight: 'bold', lineHeight: 1 }}>
                                        ISSUED
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: 7 }}>
                                        VERIFIED
                                    </Typography>
                                </Box>
                            </Tooltip>

                            {/* C. THE WATERMARK */}
                            <Box sx={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                zIndex: 5,
                                display: 'flex',
                                flexWrap: 'wrap',
                                opacity: 0.15, 
                                transform: 'rotate(-25deg) scale(1.5)',
                                overflow: 'hidden'
                            }}>
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <Typography key={i} variant="h6" sx={{ 
                                        color: 'white', 
                                        fontWeight: 'bold', 
                                        mr: 8, mb: 8,
                                        userSelect: 'none' 
                                    }}>
                                        {verifierEmail} • {new Date().toLocaleDateString()}
                                    </Typography>
                                ))}
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', color: '#888' }}>
                            <VisibilityOff sx={{ fontSize: 60, mb: 1 }} />
                            <Typography variant="h6">REDACTED</Typography>
                            <Typography variant="caption">Photo access denied.</Typography>
                        </Box>
                    )}
                </Paper>

                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', textAlign: 'center' }}>
                    <VerifiedUser fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Digitally Stamped by <strong>{document.issuerEmail || "Issuer Authority"}</strong>
                </Typography>
            </Grid>

            {/* --- RIGHT: EXTRACTED DATA --- */}
            <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" gutterBottom sx={{color:'text.secondary'}}>
                    VERIFIED DATA POINTS
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(displayData).map(([label, value]) => (
                        <Paper key={label} elevation={0} sx={{ 
                            p: 2, 
                            bgcolor: value === "REDACTED" ? '#f5f5f5' : '#e3f2fd',
                            border: '1px solid',
                            borderColor: value === "REDACTED" ? '#e0e0e0' : '#bbdefb',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
                        }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{textTransform: 'uppercase', fontSize: '0.7rem'}}>
                                    {label.replace('_', ' ')}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold" sx={{ 
                                    color: value === "REDACTED" ? "text.disabled" : "#1565c0",
                                    fontStyle: value === "REDACTED" ? "italic" : "normal"
                                }}>
                                    {value}
                                </Typography>
                            </Box>
                            {value === "REDACTED" ? <VisibilityOff color="disabled" fontSize="small"/> : <VerifiedUser color="primary" fontSize="small"/>}
                        </Paper>
                    ))}
                </Box>

                <Alert severity="info" sx={{ mt: 3, fontSize: '0.75rem' }}>
                    This view is watermarked with your identity ({verifierEmail}). Any screenshots will be traced back to you.
                </Alert>
            </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} variant="contained" size="large">
                Close Viewer
            </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;