import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Grid, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Chip,
  Stack, Paper, Avatar, Divider, Tooltip, IconButton
} from '@mui/material';
import {
  Verified as VerifiedIcon, Share as ShareIcon, Lock as LockIcon,
  Person as PersonIcon, QrCode as QrIcon, Code as CodeIcon,
  Send as SendIcon, Check as CheckIcon, ContentCopy as CopyIcon,
  Shield as ShieldIcon, Visibility as EyeIcon,
  VisibilityOff as EyeOffIcon, FlipCameraAndroid as FlipIcon,
  School as SchoolIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getStoredPassword } from '../services/authService';
import QRCode from 'react-qr-code';

// ─────────────────────────────────────────────
// IMPROVED DIGITAL ID CARD  (larger, flippable)
// ─────────────────────────────────────────────
const DigitalIDCard = ({ vcData }) => {
  const [flipped, setFlipped] = useState(false);
  const claims  = vcData?.credentialSubject?.claims || {};
  const front   = claims.front || {};
  const back    = claims.back  || {};
  const isSigned = !!vcData?.proof?.proofValue;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', perspective: '1400px', mx: 'auto' }}>
      <Box
        onClick={() => setFlipped(f => !f)}
        sx={{
          position: 'relative',
          width: 540,
          height: 340,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          boxSizing: 'border-box',
        }}
      >
        {/* ── FRONT ── */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: 4, overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
          color: '#fff',
          p: 3,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}>
          {/* noise texture */}
          <Box sx={{
            position:'absolute', inset:0, opacity:0.04,
            backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            borderRadius:4
          }}/>

          {/* header row */}
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:1 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
              <SchoolIcon sx={{ fontSize:28, color:'#64b5f6' }}/>
              <Box>
                <Typography sx={{ fontSize:'0.65rem', letterSpacing:2, color:'#90caf9', textTransform:'uppercase' }}>
                  Digital Identity
                </Typography>
                <Typography sx={{ fontSize:'0.82rem', fontWeight:700, lineHeight:1.1, maxWidth: 280 }}>
                  {front.University || 'Trusted Organisation'}
                </Typography>
              </Box>
            </Box>
            {isSigned && (
              <Chip
                icon={<VerifiedIcon sx={{ fontSize:'14px !important', color:'#a5d6a7 !important' }}/>}
                label="Signed"
                size="small"
                sx={{ bgcolor:'rgba(56,142,60,0.35)', color:'#a5d6a7', fontWeight:700, fontSize:'0.65rem', border:'1px solid rgba(165,214,167,0.4)' }}
              />
            )}
          </Box>

          {/* name + id */}
          <Box sx={{ zIndex:1 }}>
            <Typography sx={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.5px', lineHeight:1.1 }}>
              {front.Name || '—'}
            </Typography>
            <Typography sx={{ fontSize:'0.78rem', color:'#90caf9', mt:0.5 }}>
              {front.Course || ''}
            </Typography>
            <Box sx={{
              display:'inline-block', mt:1,
              bgcolor:'rgba(100,181,246,0.15)',
              border:'1px solid rgba(100,181,246,0.3)',
              px:1.5, py:0.4, borderRadius:1
            }}>
              <Typography sx={{ fontSize:'0.72rem', fontFamily:'monospace', color:'#64b5f6', letterSpacing:1 }}>
                ID: {front['Registration Number'] || 'N/A'}
              </Typography>
            </Box>
          </Box>

          {/* bottom row */}
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', zIndex:1 }}>
            <Typography sx={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.45)', maxWidth:'70%' }}>
              {front['University Address']?.substring(0, 55) || ''}
            </Typography>
            <Box sx={{
              bgcolor:'rgba(255,255,255,0.1)', borderRadius:'50%', p:0.8,
              display:'flex', alignItems:'center'
            }}>
              <FlipIcon sx={{ fontSize:16, color:'#90caf9' }}/>
            </Box>
          </Box>
        </Box>

        {/* ── BACK ── */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 4, overflow: 'hidden',
          background: 'linear-gradient(135deg, #2d323a 0%, #23515b 50%, #2c5664 100%)',
          color: '#fff',
          p: 3,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}>
          <Box sx={{
            position:'absolute', inset:0, opacity:0.04,
            backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            borderRadius:4
          }}/>

          <Typography sx={{ fontSize:'0.7rem', letterSpacing:3, color:'#9fa8da', textTransform:'uppercase', zIndex:1 }}>
            Personal Details
          </Typography>

          <Grid container spacing={1.5} sx={{ zIndex:1 }}>
            {Object.entries(back).map(([key, val]) => (
              <Grid item xs={6} key={key}>
                <Typography sx={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:0.5 }}>
                  {key}
                </Typography>
                <Typography sx={{ fontSize:'0.82rem', fontWeight:600, lineHeight:1.2 }}>
                  {val}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ zIndex:1 }}>
            <Typography sx={{ fontSize:'0.6rem', fontFamily:'monospace', color:'rgba(255,255,255,0.3)' }}>
              DID: {vcData?.credentialSubject?.id?.substring(0, 28)}…
            </Typography>
          </Box>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ display:'block', textAlign:'center', mt:1.5, color:'text.secondary' }}>
        Click card to flip
      </Typography>
    </Box>
  );
};

// ─────────────────────────────────────────────
// PROOF MODE SELECTOR CARD
// ─────────────────────────────────────────────
const ModeCard = ({ icon, title, desc, color, selected, onClick }) => (
  <Paper
    onClick={onClick}
    elevation={selected ? 4 : 0}
    sx={{
      p: 2, borderRadius: 3, cursor: 'pointer',
      border: '2px solid',
      borderColor: selected ? color : 'divider',
      bgcolor: selected ? `${color}10` : 'background.paper',
      transition: 'all 0.2s',
      '&:hover': { borderColor: color, transform: 'translateY(-2px)', boxShadow: 3 }
    }}
  >
    <Box sx={{ fontSize: '1.8rem', mb: 0.5 }}>{icon}</Box>
    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{title}</Typography>
    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.3 }}>{desc}</Typography>
    {selected && (
      <Chip label="Selected" size="small" sx={{ mt: 1, bgcolor: color, color: '#ffffff', fontSize: '0.65rem' }} />
    )}
  </Paper>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
function IssuedDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments]         = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState(null);
  const [verifiers, setVerifiers]         = useState([]);
  const [selectedVerifier, setSelectedVerifier] = useState('');
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [disclosureType, setDisclosureType]   = useState('full');
  const [proofResult, setProofResult]     = useState(null);
  const [viewMode, setViewMode]           = useState(0);
  const [copied, setCopied]               = useState(false);

  const ALL_FIELDS = ['Name', 'Date of Birth', 'Reg No', 'Photo', 'Address'];
  const [selectedFields, setSelectedFields] = useState(ALL_FIELDS);

  const fetchIssuedDocuments = async () => {
    const currentUser    = getCurrentUser();
    const storedPassword = getStoredPassword();
    if (!currentUser || !storedPassword) { setError("Session expired."); setIsLoading(false); return; }

    try {
      const r = await fetch('http://localhost:8080/api/documents/my-documents', {
        headers: { 'Authorization': 'Basic ' + btoa(`${currentUser.email}:${storedPassword}`) }
      });
      if (!r.ok) throw new Error(`Status: ${r.status}`);
      const data = await r.json();
      setDocuments(data.filter(d => d.status === 'APPROVED' && d.verifiableCredential));

      const vr = await fetch('http://localhost:8080/api/user/verifiers', {
        headers: { 'Authorization': 'Basic ' + btoa(`${currentUser.email}:${storedPassword}`) }
      });
      if (vr.ok) setVerifiers(await vr.json());
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchIssuedDocuments(); }, []);

  const openShareModal = (doc) => {
    setSelectedDocument(doc);
    setDisclosureType('full');
    setProofResult(null);
    setSelectedVerifier('');
    setSelectedFields(ALL_FIELDS);
    setIsSharingOpen(true);
    setViewMode(0);
  };

  const toggleField = (field) => {
    setSelectedFields(f => f.includes(field) ? f.filter(x => x !== field) : [...f, field]);
    setProofResult(null);
  };

  const handleGenerateProof = async () => {
    const currentUser = getCurrentUser();
    const password    = getStoredPassword();
    if (!currentUser) return;

    try {
      const vcJson = JSON.parse(selectedDocument.verifiableCredential);

      if (disclosureType === 'zkp') {
        const r = await fetch(
          `http://localhost:8080/api/user/generate-student-proof?documentId=${selectedDocument.id}`,
          { method:'POST', headers:{ 'Authorization':'Basic ' + btoa(`${currentUser.email}:${password}`) } }
        );
        if (!r.ok) throw new Error(await r.text() || "ZKP failed");
        const d = await r.json();
        const isActive = d?.presentation?.proof?.disclosedAttributes?.is_active_enrollment === true;
        setProofResult({
          status: isActive ? 'Success' : 'Warning',
          message: isActive ? "ZKP Generated: Active enrollment proven on-chain." : "ZKP Warning: Enrollment may be expired.",
          presentation: JSON.stringify(d.presentation, null, 2)
        });

      } else if (disclosureType === 'redacted') {
        const redacted = JSON.parse(JSON.stringify(vcJson));
        const fieldMap = { 'Reg No':'ID Number', 'Date of Birth':'Date of Birth', 'Address':'Address', 'Name':'Name' };
        const frontC   = redacted.credentialSubject.claims.front || {};
        const backC    = redacted.credentialSubject.claims.back  || {};
        Object.entries(fieldMap).forEach(([ui, jk]) => {
          if (!selectedFields.includes(ui)) { delete frontC[jk]; delete backC[jk]; }
        });
        setProofResult({
          status: 'Success',
          message: 'Redacted credential ready — only selected fields shared.',
          presentation: JSON.stringify({
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiablePresentation", "RedactedDisclosure"],
            holder: currentUser.did,
            proof: { type:"JsonWebSignature2020", created: new Date().toISOString(), jws:"redacted-signature-mock" },
            verifiableCredential: [redacted]
          }, null, 2)
        });

      } else {
        setProofResult({
          status: 'Success',
          message: 'Full Identity Document ready to share.',
          presentation: JSON.stringify({
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiablePresentation", "FullDocumentDisclosure"],
            holder: currentUser.did,
            proof: { type:"JsonWebSignature2020", created: new Date().toISOString(), verificationMethod: currentUser.did + "#key-1", jws:`mock-sig-${currentUser.did?.substring(14,20)}` },
            verifiableCredential: [vcJson]
          }, null, 2)
        });
      }
    } catch (e) {
      setProofResult({ status:'Error', message: `Error: ${e.message}` });
    }
  };

  const handleOnlineSend = async () => {
    const currentUser = getCurrentUser();
    const password    = getStoredPassword();
    if (!proofResult?.presentation) return;
    if (!selectedVerifier) { alert("Please select a verifier first."); return; }

    const fieldsToSend = disclosureType === 'redacted' ? selectedFields.join(',')
                       : disclosureType === 'zkp'      ? 'ENROLLMENT_CHECK_ONLY'
                       : 'ALL';
    try {
      const r = await fetch('http://localhost:8080/api/verifier/submit-proof', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Basic ' + btoa(`${currentUser.email}:${password}`) },
        body: JSON.stringify({
          verifierEmail: selectedVerifier, userEmail: currentUser.email,
          documentId: selectedDocument.id, documentName: selectedDocument.documentName,
          accessType: disclosureType.toUpperCase(), vpJson: proofResult.presentation,
          allowedFields: fieldsToSend
        })
      });
      if (r.ok) { alert(`✅ Proof sent to ${selectedVerifier}!`); setIsSharingOpen(false); }
      else throw new Error(await r.text());
    } catch (e) { alert(e.message); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proofResult?.presentation || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <Box sx={{ p:4 }}>Loading credentials…</Box>;
  if (error)     return <Alert severity="error" sx={{ m:2 }}>{error}</Alert>;

  const modeColor = disclosureType === 'full' ? '#438b98'
                  : disclosureType === 'redacted' ? '#438b98' : '#438b98';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, display:'flex', alignItems:'center', gap:1 }}>
          <VerifiedIcon color="primary"/> Digital Wallet
        </Typography>
        <Typography color="text.secondary">Manage and present your Verifiable Credentials</Typography>
      </Box>

      {documents.length === 0 ? (
        <Alert severity="info">No approved credentials yet.</Alert>
      ) : (
        <Grid container spacing={4}>
          {documents.map((doc) => {
            const vcData = JSON.parse(doc.verifiableCredential);
            return (
              <Grid item xs={12} md={10} lg={8} key={doc.id} sx={{ mx:'auto' }}>
                <Card sx={{ borderRadius:4, overflow:'visible', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <DigitalIDCard vcData={vcData}/>
                    <Box sx={{ mt: 3, display:'flex', justifyContent:'center' }}>
                      <Button
                        variant="contained" size="large" startIcon={<ShareIcon/>}
                        onClick={() => openShareModal(doc)}
                        sx={{ borderRadius:3, px:5, py:1.5, fontWeight:700,
                              background:'linear-gradient(135deg,#438b98,#0d47a1)',
                              boxShadow:'0 4px 16px rgba(23, 96, 123, 0.35)',
                              '&:hover':{ boxShadow:'0 6px 20px rgba(82, 151, 183, 0.5)' }
                        }}
                      >
                        Use Credential
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Box sx={{ mt:3 }}>
        <Button variant="outlined" onClick={() => navigate('/user')}>Back to Dashboard</Button>
      </Box>

      {/* ── GENERATE PROOF DIALOG ── */}
      <Dialog
        open={isSharingOpen}
        onClose={() => setIsSharingOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:4, overflow:'hidden' } }}
      >
        {/* Coloured header stripe */}
        <Box sx={{ height:6, background:`linear-gradient(90deg, ${modeColor}, ${modeColor}88)` }}/>

        <DialogTitle sx={{ pb:1, pt:2.5 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
              <Box sx={{ bgcolor:`${modeColor}18`, borderRadius:2, p:0.8, display:'flex' }}>
                <LockIcon sx={{ color: modeColor, fontSize:22 }}/>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>Generate Proof</Typography>
                <Typography variant="caption" color="text.secondary">
                  Choose how to share your credential
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setIsSharingOpen(false)}>
              <CloseIcon fontSize="small"/>
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px:3, pb:3 }}>

          {/* ── Step 1: Mode selection ── */}
          {!proofResult && (
            <>
              <Typography variant="overline" sx={{ color:'text.secondary', letterSpacing:1.5 }}>
                Step 1 — Sharing Mode
              </Typography>
              <Grid container spacing={1.5} sx={{ mt:0.5, mb:3 }}>
                <Grid item xs={4}>
                  <ModeCard icon="👁️" title="Full View" desc="Share all data" color="#438b98"
                    selected={disclosureType==='full'} onClick={() => { setDisclosureType('full'); setProofResult(null); }}/>
                </Grid>
                <Grid item xs={4}>
                  <ModeCard icon="✂️" title="Redacted" desc="Hide sensitive fields" color="#438b98"
                    selected={disclosureType==='redacted'} onClick={() => { setDisclosureType('redacted'); setProofResult(null); }}/>
                </Grid>
                <Grid item xs={4}>
                  <ModeCard icon="🔐" title="ZK Proof" desc="Prove enrollment only" color="#438b98"
                    selected={disclosureType==='zkp'} onClick={() => { setDisclosureType('zkp'); setProofResult(null); }}/>
                </Grid>
              </Grid>

              {/* Field selector for redacted */}
              {disclosureType === 'redacted' && (
                <Box sx={{ mb:3, p:2, bgcolor:'#438b98', borderRadius:3, border:'1px solid #438b98' }}>
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb:1.5, color:'#438b98' }}>
                    SELECT FIELDS TO SHARE:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {ALL_FIELDS.map(f => (
                      <Chip
                        key={f}
                        label={f}
                        clickable
                        onClick={() => toggleField(f)}
                        variant={selectedFields.includes(f) ? 'filled' : 'outlined'}
                        icon={selectedFields.includes(f) ? <CheckIcon /> : undefined}
                        sx={{
                          fontWeight: 600,
                          bgcolor: selectedFields.includes(f) ? '#9dc8df' : 'grey.300',
                          color: selectedFields.includes(f) ? '#2e5c70' : 'text.primary',
                          '&:hover': {
                            bgcolor: selectedFields.includes(f) ? '#9dc8df' : 'grey.400'
                          }
                        }}
                      />
                    ))}
                  </Stack>
                  <Typography variant="caption" sx={{ mt:1, display:'block', color:'text.secondary' }}>
                    {selectedFields.length} of {ALL_FIELDS.length} fields selected
                  </Typography>
                </Box>
              )}

              {/* ZKP explanation */}
              {disclosureType === 'zkp' && (
                <Box sx={{ mb:3, p:2, bgcolor:'#b9dae7', borderRadius:3, border:'1px solid #3a789b' }}>
                  <Typography variant="body2" sx={{ color:'#173370', fontWeight:500 }}>
                    🔐 A Zero-Knowledge Proof will be generated proving your enrollment is active —
                    without revealing any personal data.
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained" fullWidth size="large"
                onClick={handleGenerateProof} startIcon={<ShieldIcon/>}
                sx={{ borderRadius:3, py:1.5, fontWeight:700, bgcolor: modeColor,
                      '&:hover':{ bgcolor: modeColor, filter:'brightness(1.1)' }
                }}
              >
                Generate Proof
              </Button>
            </>
          )}

          {/* ── Proof result ── */}
          {proofResult && proofResult.status !== 'Error' && (
            <Box>
              <Alert
                severity={proofResult.status === 'Success' ? 'success' : 'warning'}
                sx={{ mb:3, borderRadius:2 }}
              >
                {proofResult.message}
              </Alert>

              {/* Step 2: Select verifier */}
              <Typography variant="overline" sx={{ color:'text.secondary', letterSpacing:1.5 }}>
                Step 2 — Select Verifier
              </Typography>
              <FormControl fullWidth sx={{ mt:1, mb:2 }}>
                <InputLabel>Who are you sending this to?</InputLabel>
                <Select
                  value={selectedVerifier}
                  label="Who are you sending this to?"
                  onChange={(e) => setSelectedVerifier(e.target.value)}
                  sx={{ borderRadius:2 }}
                >
                  {verifiers.length === 0 && (
                    <MenuItem disabled value="">No verifiers available</MenuItem>
                  )}
                  {verifiers.map(v => (
                    <MenuItem key={v.id} value={v.email}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                        <Avatar sx={{ width:28, height:28, bgcolor:'primary.main', fontSize:'0.7rem' }}>
                          {v.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{v.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{v.email}</Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Action buttons */}
              <Grid container spacing={1.5} sx={{ mb:2 }}>
                <Grid item xs={6}>
                  <Button
                    variant="contained" color="success" fullWidth startIcon={<SendIcon/>}
                    onClick={handleOnlineSend} disabled={!selectedVerifier}
                    sx={{ borderRadius:2, fontWeight:700 }}
                  >
                    Send Online
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
                    <Button
                      variant="outlined" fullWidth startIcon={copied ? <CheckIcon/> : <CopyIcon/>}
                      onClick={handleCopy} color={copied ? 'success' : 'inherit'}
                      sx={{ borderRadius:2 }}
                    >
                      {copied ? 'Copied' : 'Copy JSON'}
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>

              <Divider sx={{ my:2 }}/>

              {/* Step 3: QR / Raw data tabs */}
              <Typography variant="overline" sx={{ color:'text.secondary', letterSpacing:1.5 }}>
                Step 3 — In-Person Sharing
              </Typography>
              <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} sx={{ mt:1, mb:2 }}>
                <Tab icon={<QrIcon/>} label="QR Code" iconPosition="start" sx={{ minHeight:40 }}/>
                <Tab icon={<CodeIcon/>} label="Raw JSON" iconPosition="start" sx={{ minHeight:40 }}/>
              </Tabs>

              {viewMode === 0 && (
                <Box sx={{ textAlign:'center', p:3, bgcolor:'#fff', borderRadius:3,
                           border:'1px solid', borderColor:'divider',
                           boxShadow:'inset 0 2px 8px rgba(0,0,0,0.04)' }}>
                  <QRCode value={proofResult.presentation} size={220}/>
                  <Typography variant="caption" display="block" sx={{ mt:1.5, color:'text.secondary' }}>
                    Ask the verifier to scan this QR code with their device.
                    The QR encodes the full Verifiable Presentation JSON.
                  </Typography>
                </Box>
              )}

              {viewMode === 1 && (
                <Box sx={{ position:'relative' }}>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor:'#0d1117', color:'#58a6ff',
                      p:2, borderRadius:2, fontSize:'0.68rem',
                      maxHeight:220, overflowY:'auto',
                      fontFamily:'monospace', lineHeight:1.6,
                      border:'1px solid #30363d'
                    }}
                  >
                    {proofResult.presentation}
                  </Box>
                </Box>
              )}

              <Button
                variant="text" fullWidth size="small"
                onClick={() => setProofResult(null)} sx={{ mt:2, color:'text.secondary' }}
              >
                ← Change sharing mode
              </Button>
            </Box>
          )}

          {proofResult?.status === 'Error' && (
            <Box>
              <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{proofResult.message}</Alert>
              <Button variant="outlined" fullWidth onClick={() => setProofResult(null)} sx={{ borderRadius:2 }}>
                Try Again
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default IssuedDocuments;