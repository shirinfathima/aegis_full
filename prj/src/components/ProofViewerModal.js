import React from 'react';
import { 
  Dialog, DialogContent, Typography, Box, Chip, Divider, 
  Button, Accordion, AccordionSummary, AccordionDetails 
} from '@mui/material';
import { CheckCircle, ExpandMore, Fingerprint, Lock, Event } from '@mui/icons-material';

const ProofViewerModal = ({ isOpen, onClose, proofData }) => {
  if (!proofData) return null;

  // 1. Parse the JSON safely
  let proof = {};
  try {
    proof = JSON.parse(proofData);
  } catch (e) {
    proof = { error: "Invalid Proof Format" };
  }

  // 👇 CHANGED: Extract data based on the new Enrollment ZKP JSON structure
  const disclosedAttributes = proof?.proof?.disclosedAttributes || proof?.disclosedAttributes || {};
  const cryptoProof = proof?.proof?.proofValue || proof?.proofValue || proof?.proof || {};
  const timestamp = proof?.proof?.created ? new Date(proof.proof.created).toLocaleString() : "Just now";

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', p: 4 }}>
        
        {/* 1. The Big Green Success Badge */}
        <Box sx={{ mb: 3 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#00e676' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2, color: '#2e7d32' }}>
                VERIFIED
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
                Zero-Knowledge Proof Validated
            </Typography>
        </Box>

        {/* 2. The "What We Know" Section (The Magic of ZKP) */}
        <CardSection>
            <InfoRow 
                icon={<Fingerprint color="primary"/>} 
                label="Identity Check" 
                value="PASSED" 
                isSuccess 
            />
            <Divider sx={{ my: 1.5 }} />
            
            {/* 👇 CHANGED: Updated for Enrollment Proof */}
            <InfoRow 
                icon={<Event color="action"/>} 
                label="Enrollment Status" 
                value={disclosedAttributes?.is_active_enrollment ? "ACTIVE CONFIRMED" : "FAILED"} 
                isSuccess={disclosedAttributes?.is_active_enrollment === true}
            />
            <Divider sx={{ my: 1.5 }} />
            
            {/* 👇 CHANGED: Updated descriptive text */}
            <InfoRow 
                icon={<Lock color="action"/>} 
                label="Private Data" 
                value="HIDDEN (Personal Info Not Revealed)" 
                isNeutral
            />
        </CardSection>

        {/* 3. The "Nerd Stuff" (Hidden by default) */}
        <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Accordion variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lock fontSize="small"/> View Cryptographic Evidence
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
                        This mathematical proof guarantees the claim without revealing the source data.
                    </Typography>
                    <Box 
                        component="pre" 
                        sx={{ 
                            bgcolor: '#1e1e1e', 
                            color: '#00e676', 
                            p: 2, 
                            borderRadius: 2, 
                            fontSize: '10px', 
                            overflowX: 'auto',
                            maxHeight: '150px' 
                        }}
                    >
                        {JSON.stringify(cryptoProof, null, 2)}
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#aaa' }}>
                        Timestamp: {timestamp}
                    </Typography>
                </AccordionDetails>
            </Accordion>
        </Box>

        <Button onClick={onClose} variant="contained" size="large" fullWidth sx={{ mt: 3, borderRadius: 3 }}>
            Close Verification
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// --- Small Helper Components for Styling ---
const CardSection = ({ children }) => (
    <Box sx={{ 
        bgcolor: '#f5f7fa', 
        p: 3, 
        borderRadius: 4, 
        textAlign: 'left',
        border: '1px solid #eef2f6'
    }}>
        {children}
    </Box>
);

const InfoRow = ({ icon, label, value, isSuccess, isNeutral }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon}
            <Typography variant="body1" fontWeight={500} color="text.primary">
                {label}
            </Typography>
        </Box>
        <Chip 
            label={value} 
            color={isSuccess ? "success" : isNeutral ? "default" : "error"} 
            variant={isNeutral ? "outlined" : "filled"}
            size="small"
            sx={{ fontWeight: 'bold' }}
        />
    </Box>
);

export default ProofViewerModal;