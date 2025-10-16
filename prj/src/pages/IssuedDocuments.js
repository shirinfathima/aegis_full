import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Paper,
  Button
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Description as DocumentIcon,
  Verified as VerifiedIcon,
  CloudDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function IssuedDocuments() {
  const navigate = useNavigate();

  // Mock data (matches Approved documents from UserDashboard mock data)
  const [documents] = useState([
    {
      id: 1,
      name: 'National ID Card',
      status: 'Approved',
      uploadDate: '2024-09-10',
      confidence: 98,
      issuer: 'Government of India',
      blockchainTx: '0xabc123...',
    }
    // Only approved documents should be listed here
  ]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedIcon /> Issued Documents (Verified)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Securely view and manage all documents approved by TrustNet.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>My Verified Credentials</Typography>
          
          {documents.length === 0 ? (
            <Alert severity="info" icon={<DocumentIcon />}>
              You currently have no documents that have been fully approved.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {documents.map((document) => (
                <Grid item xs={12} key={document.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ApprovedIcon color="success" />
                        <Box>
                          <Typography variant="subtitle1">{document.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Issued by: {document.issuer || 'TrustNet'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Confidence Score: {document.confidence}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', display: 'flex', gap: 1 }}>
                        <Chip
                          label={document.status}
                          color='success'
                          size="small"
                        />
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<DownloadIcon />}
                        >
                          Download Credential
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          <Divider sx={{ my: 3 }} />
          
          <Button
            variant="outlined"
            onClick={() => navigate('/user')}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default IssuedDocuments;