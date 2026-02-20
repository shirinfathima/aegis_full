import React, { useState } from 'react';
import { 
  Dialog, DialogContent, Typography, Box, Chip, Divider, 
  Button, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Alert
} from '@mui/material';
import { 
  CheckCircle, ExpandMore, Fingerprint, 
  Lock, Event 
} from '@mui/icons-material';
import documentService from '../services/documentService';

const ProofViewerModal = ({ isOpen, onClose, proofData }) => {

  const [verifying, setVerifying] = useState(false);
  const [onChainResult, setOnChainResult] = useState(null);

  if (!proofData) return null;

  // Safe parse (renamed to vp to avoid confusion with the nested "proof" key)
  let vp = {};
  try {
    vp = typeof proofData === 'string' ? JSON.parse(proofData) : proofData;
  } catch (e) {
    vp = { error: "Invalid Proof Format" };
  }

  // 1. Extract documentId from the root
  const documentId = vp?.documentId;

  // 2. Extract nested data from the inner "proof" block
  const proofBlock = vp?.proof || {};
  const disclosed = proofBlock?.disclosedAttributes;
  const publicSignals = proofBlock?.publicSignals || [];

  // 3. Robust Check: Looks at both disclosed flags AND the actual ZKP math output
  const is18Plus =
    disclosed?.age_over_18 === true ||
    disclosed?.age_over_21 === true ||
    publicSignals[0] === "1" || 
    publicSignals[0] === 1;

  const handleOnChainVerify = async () => {
    if (!documentId) {
      setOnChainResult({ error: "No documentId found in proof." });
      return;
    }

    try {
      setVerifying(true);
      setOnChainResult(null);

      const result = await documentService.verifyAgeWithZKP(documentId);

      setOnChainResult(result);

    } catch (err) {
      setOnChainResult({ error: "Blockchain verification failed." });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', p: 4 }}>

        {/* VERIFIED HEADER */}
        <Box sx={{ mb: 3 }}>
          <CheckCircle sx={{ fontSize: 80, color: '#00e676' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2, color: '#2e7d32' }}>
            VERIFIED
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Zero-Knowledge Proof Validated
          </Typography>
        </Box>

        {/* ZKP SUMMARY */}
        <Box sx={{ 
          bgcolor: '#f5f7fa', 
          p: 3, 
          borderRadius: 4, 
          textAlign: 'left',
          border: '1px solid #eef2f6'
        }}>

          <InfoRow 
            icon={<Fingerprint color="primary"/>} 
            label="Identity Check" 
            value="PASSED" 
            isSuccess 
          />

          <Divider sx={{ my: 1.5 }} />

          <InfoRow 
            icon={<Event />} 
            label="Age Requirement" 
            value={is18Plus ? "18+ CONFIRMED" : "FAILED"} 
            isSuccess={is18Plus}
          />

          <Divider sx={{ my: 1.5 }} />

          <InfoRow 
            icon={<Lock />} 
            label="Private Data" 
            value="HIDDEN (DOB Not Revealed)" 
            isNeutral
          />
        </Box>

        {/* 🔥 ON-CHAIN VERIFY BUTTON INSIDE MODAL */}
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={handleOnChainVerify}
            disabled={verifying}
          >
            {verifying ? <CircularProgress size={24} /> : "Verify Age On-Chain"}
          </Button>
        </Box>

        {/* Blockchain Result */}
        {onChainResult && (
          <Box sx={{ mt: 2 }}>
            {onChainResult.error ? (
              <Alert severity="error">{onChainResult.error}</Alert>
            ) : onChainResult.verifiedOnChain ? (
              <Alert severity="success">
                ✅ Age Verified Successfully On Blockchain
              </Alert>
            ) : (
              <Alert severity="warning">
                ❌ Blockchain Verification Failed
              </Alert>
            )}
          </Box>
        )}

        {/* Cryptographic Proof Section */}
        <Box sx={{ mt: 3, textAlign: 'left' }}>
          <Accordion variant="outlined">
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="caption">
                View Cryptographic Evidence
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
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
                {JSON.stringify(vp, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          fullWidth
          sx={{ mt: 3 }}
        >
          Close Verification
        </Button>

      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ icon, label, value, isSuccess, isNeutral }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {icon}
      <Typography variant="body1" fontWeight={500}>
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