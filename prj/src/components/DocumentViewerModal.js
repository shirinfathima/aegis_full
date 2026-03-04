import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogTitle, Typography, Box, 
  Chip, Divider, Button, Grid, Paper, Alert 
} from '@mui/material';
import { 
  VisibilityOff, Description, VerifiedUser, 
  FlipCameraAndroid, Security 
} from '@mui/icons-material';

const DocumentViewerModal = ({ isOpen, onClose, request }) => {
  const [viewSide, setViewSide] = useState('front'); 

  useEffect(() => {
    if (isOpen) setViewSide('front');
  }, [isOpen, request]);

  if (!request || !request.document) return null;

  const { accessType, allowedFields, document, verifierEmail, proofData } = request;

  // 👇 CHANGED: Updated for new ZKP Module (Removed old ZKP_AGE)
  const isZKP = accessType === 'ZKP';
  const isRedacted = accessType === 'REDACTED' || isZKP;
  
  const hasBackImage = !!document.fileDataBack; 

  // --- 1. SMART DATA EXTRACTION ---
  let flattenedData = {};
  let dataSource = "Raw OCR"; 

  const extractAndFlatten = (sourceObj) => {
      if (!sourceObj) return {};
      let result = {};
      
      const content = sourceObj.claims || sourceObj.extracted || sourceObj;

      Object.assign(result, content);

      if (content.back) {
          Object.assign(result, content.back);
      }

      if (content.front) {
          Object.assign(result, content.front);
      }
      
      return result;
  };

  try {
      if (proofData) {
          const vp = JSON.parse(proofData);
          
          // 👇 CHANGED: Extract Enrollment Data for new ZKP Module
          if (isZKP && (vp.proof?.disclosedAttributes || vp.disclosedAttributes)) {
              const attrs = vp.proof?.disclosedAttributes || vp.disclosedAttributes;
              flattenedData = {
                  "Enrollment Status": attrs.is_active_enrollment ? "ACTIVE" : "EXPIRED"
              };
              dataSource = "Zero-Knowledge Proof";
          }
          else if (vp.verifiableCredential && vp.verifiableCredential.length > 0) {
              const subject = vp.verifiableCredential[0].credentialSubject;
              flattenedData = extractAndFlatten(subject);
              dataSource = "Verifiable Presentation";
          }
      } 
      
      if (Object.keys(flattenedData).length === 0 && document.verifiableCredential) {
          const vc = JSON.parse(document.verifiableCredential);
          flattenedData = extractAndFlatten(vc.credentialSubject);
          dataSource = "Original Credential";
      } 
      
      if (Object.keys(flattenedData).length === 0) {
          const ocr = JSON.parse(document.ocrData || "{}");
          flattenedData = extractAndFlatten(ocr);
      }
  } catch (e) {
      console.error("Data Parsing Error", e);
  }

  // --- 2. PERMISSION CHECKER ---
  const allowedList = (allowedFields && isRedacted) 
      ? allowedFields.toLowerCase().split(',').map(f => f.trim()) 
      : [];

  const isFieldAllowed = (fieldName) => {
    if (!isRedacted) return true; // Full access allows everything
    if (!allowedFields) return false; // If redacted/ZKP and no list, hide everything
    return allowedList.includes(fieldName.toLowerCase());
  };

  // --- 3. ROBUST DATA MAPPING ---
  const getValue = (keyName) => {
      const lowerKey = keyName.toLowerCase();
      
      const map = {
          'name': ['name', 'fullname', 'full_name'],
          'dob': ['dob', 'date of birth', 'birthdate'],
          'id_number': ['registration number', 'idno', 'id_number', 'regno', 'reg no'], 
          'college': ['university', 'college', 'school', 'institution', 'university address'] 
      };
      
      const possibilities = map[lowerKey] || [lowerKey];
      
      for (const possibleKey of possibilities) {
          if (flattenedData[possibleKey]) return flattenedData[possibleKey];
          
          const found = Object.keys(flattenedData).find(k => k.toLowerCase() === possibleKey);
          if (found) return flattenedData[found];
      }
      return "Not Shared";
  };

  // 👇 CHANGED: Render Enrollment status dynamically if it is a ZKP request
  const displayData = isZKP ? {
      "Enrollment Status": flattenedData["Enrollment Status"] || "VERIFIED"
  } : {
    Name: isFieldAllowed('Name') ? getValue('Name') : "REDACTED",
    DOB: isFieldAllowed('Date of Birth') ? getValue('DOB') : "REDACTED",
    ID_Number: isFieldAllowed('Reg No') ? getValue('ID_Number') : "REDACTED", 
    College: isFieldAllowed('Address') ? getValue('College') : "REDACTED"     
  };

  const currentImageSrc = viewSide === 'front' 
    ? document.fileData 
    : document.fileDataBack;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        {isZKP ? <Security color="success"/> : <Description color="primary"/>}
        {isZKP ? "Zero-Knowledge Proof View" : isRedacted ? "Redacted Document View" : "Full Document View"}
        
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Chip 
                label={isZKP ? "ZKP Protected" : isRedacted ? "Restricted Access" : "Full Access"} 
                color={isZKP ? "success" : isRedacted ? "warning" : "primary"} 
                size="small" 
            />
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mt: 0 }}>
            {/* LEFT: IMAGE */}
            <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{color:'text.secondary'}}>
                        OFFICIAL RECORD ({viewSide.toUpperCase()})
                    </Typography>
                    {hasBackImage && (!isRedacted || isFieldAllowed('Photo')) && (
                        <Button 
                            size="small" startIcon={<FlipCameraAndroid />} variant="outlined"
                            onClick={() => setViewSide(prev => prev === 'front' ? 'back' : 'front')}
                        >
                            Flip to {viewSide === 'front' ? 'Back' : 'Front'}
                        </Button>
                    )}
                </Box>
                <Paper variant="outlined" sx={{ height: 350, position: 'relative', overflow: 'hidden', bgcolor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                    {(!isRedacted || isFieldAllowed('Photo')) ? (
                        <>
                            <img key={viewSide} src={currentImageSrc ? `data:image/png;base64,${currentImageSrc}` : "https://via.placeholder.com/500x350?text=Image+Not+Found"} alt="Doc" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <Box 
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    pointerEvents: 'none',
                                    zIndex: 5,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignContent: 'center',
                                    justifyContent: 'center',
                                    transform: 'rotate(-25deg)',   // 🔥 removed scale
                                }}
                                >
                                {Array.from({ length: 25 }).map((_, i) => (
                                    <Typography
                                    key={i}
                                    sx={{
                                        fontSize: '19px',          // 🔥 smaller font
                                        fontWeight: 700,
                                        color: 'rgba(0, 0, 0, 0.18)',
                                        mr: 6,
                                        mb: 6,
                                        userSelect: 'none',
                                        whiteSpace: 'nowrap'
                                    }}
                                    >
                                    {verifierEmail} • {new Date().toLocaleDateString()}
                                    </Typography>
                                ))}
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', color: '#888' }}>
                            {isZKP ? <Security sx={{ fontSize: 60, mb: 1, color: '#66bb6a' }} /> : <VisibilityOff sx={{ fontSize: 60, mb: 1 }} />}
                            <Typography variant="h6">{isZKP ? "ZKP ENCRYPTED" : "REDACTED"}</Typography>
                            <Typography variant="caption">{isZKP ? "Source image hidden via Zero-Knowledge Proof" : "Image access restricted"}</Typography>
                        </Box>
                    )}
                </Paper>
            </Grid>

            {/* RIGHT: VERIFIED DATA POINTS */}
            <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" gutterBottom sx={{color:'text.secondary', display:'flex', justifyContent:'space-between'}}>
                    <span>VERIFIED DATA POINTS</span>
                    <Chip label={dataSource === "Verifiable Presentation" ? "Live Proof Data" : "Stored Credential"} size="small" color="success" variant="outlined" sx={{height:20, fontSize:10}} />
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(displayData).map(([label, value]) => (
                        <Paper key={label} elevation={0} sx={{ 
                            p: 2, 
                            bgcolor: value === "REDACTED" || value === "Not Shared" ? '#f5f5f5' : '#e3f2fd',
                            border: '1px solid',
                            borderColor: value === "REDACTED" || value === "Not Shared" ? '#e0e0e0' : '#bbdefb',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
                        }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{textTransform: 'uppercase', fontSize: '0.7rem'}}>
                                    {label.replace('_', ' ')}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold" sx={{ 
                                    color: value === "REDACTED" || value === "Not Shared" ? "text.disabled" : "#1565c0",
                                    fontStyle: value === "REDACTED" || value === "Not Shared" ? "italic" : "normal"
                                }}>
                                    {value}
                                </Typography>
                            </Box>
                            {(value === "REDACTED" || value === "Not Shared") ? <VisibilityOff color="disabled" fontSize="small"/> : <VerifiedUser color="primary" fontSize="small"/>}
                        </Paper>
                    ))}
                </Box>
                <Alert severity="info" sx={{ mt: 3, fontSize: '0.75rem' }}>
                    Data extracted from {dataSource}. Images are watermarked.
                </Alert>
            </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose} variant="contained" size="large">Close Viewer</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;