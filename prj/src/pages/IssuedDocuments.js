import React, { useState, useEffect } from 'react';
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
import { getCurrentUser } from '../services/authService'; // Import auth helper

function IssuedDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New fetch logic to get documents from the backend
  useEffect(() => {
    const fetchIssuedDocuments = async () => {
      const currentUser = getCurrentUser();
      const password = sessionStorage.getItem('temp_pass');
      
      if (!currentUser || !password) {
        setError("Session expired. Please log in.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8080/api/documents/my-documents', {
          headers: {
            'Authorization': 'Basic ' + btoa(`${currentUser.email}:${password}`)
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch documents. Status: ${response.status}`);
        }

        const data = await response.json();
        // Filter only approved documents that have a VC
        const issuedDocs = data.filter(doc => doc.status === 'APPROVED' && doc.verifiableCredential);
        setDocuments(issuedDocs);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIssuedDocuments();
  }, [navigate]);

  const handleDownloadVC = (vcString, documentName) => {
    try {
        // Create a Blob from the VC JSON string
        const blob = new Blob([vcString], { type: 'application/ld+json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentName.replace(/\s/g, '_')}_VC.jsonld`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the URL object
    } catch (e) {
        alert("Failed to create download file.");
        console.error("Download error:", e);
    }
  };

  if (isLoading) {
    return <Box sx={{ p: 4 }}>Loading issued documents...</Box>;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Error: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header (omitted for brevity, assume unchanged) */}
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
          <Typography variant="h6" sx={{ mb: 3 }}>My Verifiable Credentials</Typography>
          
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
                          <Typography variant="subtitle1">{document.documentName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Blockchain CID: {document.ipfsCid}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Status: {document.status}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', display: 'flex', gap: 1 }}>
                        <Chip
                          label={'APPROVED'}
                          color='success'
                          size="small"
                        />
                        {document.verifiableCredential && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadVC(document.verifiableCredential, document.documentName)}
                          >
                            Download Credential
                          </Button>
                        )}
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