import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Select, MenuItem, FormControl, Alert, Chip, CircularProgress 
} from '@mui/material';
import { AccessTime, CheckCircle, Cancel, Security, Visibility } from '@mui/icons-material';

const IncomingRequests = ({ userEmail }) => {
  const [requests, setRequests] = useState([]);
  const [durations, setDurations] = useState({}); 
  const [processingId, setProcessingId] = useState(null); // To show loading spinner

  useEffect(() => {
    if(userEmail) fetchRequests();
  }, [userEmail]);

  const fetchRequests = async () => {
    const password = sessionStorage.getItem('temp_pass');
    try {
      const response = await fetch(`http://localhost:8080/api/user/requests?email=${userEmail}`, {
        headers: { 'Authorization': 'Basic ' + btoa(`${userEmail}:${password}`) }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.filter(r => r.status === 'PENDING'));
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleDurationChange = (reqId, minutes) => {
    setDurations({ ...durations, [reqId]: minutes });
  };

  const handleResponse = async (request, status) => {
    setProcessingId(request.id); // Start loading
    const password = sessionStorage.getItem('temp_pass');
    const duration = durations[request.id] || 60; // Default 1 hour
    let proofData = null;

    try {
      // --- 1. IF ZKP REQUEST, GENERATE PROOF FIRST ---
      if (status === 'APPROVED' && request.accessType === 'ZKP_AGE') {
        console.log("Generating ZK Proof for Document ID:", request.document.id);
        
        const proofRes = await fetch(`http://localhost:8080/api/user/generate-proof/age?documentId=${request.document.id}`, {
             method: 'POST',
             headers: { 'Authorization': 'Basic ' + btoa(`${userEmail}:${password}`) }
        });
        
        if (!proofRes.ok) throw new Error("Failed to generate Zero-Knowledge Proof");
        proofData = await proofRes.text(); // Get proof JSON string
      }

      // --- 2. SEND RESPONSE TO BACKEND ---
      const payload = {
        requestId: request.id,
        status: status,
        durationInMinutes: duration,
        generatedProof: proofData // Attach proof (will be null for normal requests)
      };

      await fetch('http://localhost:8080/api/user/respond-request', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${userEmail}:${password}`)
        },
        body: JSON.stringify(payload)
      });
      
      // Remove from list
      setRequests(requests.filter(r => r.id !== request.id));
      
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Error: " + error.message);
    } finally {
      setProcessingId(null); // Stop loading
    }
  };

  return (
    <Card sx={{ mt: 3, mb: 3, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
          <AccessTime /> Incoming Access Requests
        </Typography>
        
        {requests.length === 0 ? (
          <Alert severity="info">No pending requests.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Requester</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Access Duration</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                        <Typography variant="body2" fontWeight="bold">{req.verifierEmail}</Typography>
                        <Typography variant="caption">{req.document?.documentName}</Typography>
                    </TableCell>
                    
                    {/* Access Type Badge */}
                    <TableCell>
                        {req.accessType === 'ZKP_AGE' ? (
                            <Chip icon={<Security />} label="ZK Proof" color="success" size="small" variant="outlined" />
                        ) : (
                            <Chip icon={<Visibility />} label="Full View" color="primary" size="small" variant="outlined" />
                        )}
                    </TableCell>
                    
                    {/* Duration Selector */}
                    <TableCell>
                      <FormControl size="small">
                        <Select
                          value={durations[req.id] || 60}
                          onChange={(e) => handleDurationChange(req.id, e.target.value)}
                          sx={{ minWidth: 120, bgcolor: 'white' }}
                        >
                          <MenuItem value={15}>15 Minutes</MenuItem>
                          <MenuItem value={60}>1 Hour</MenuItem>
                          <MenuItem value={1440}>24 Hours</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Buttons */}
                    <TableCell align="right">
                      <Button 
                        variant="contained" color="success" size="small" 
                        disabled={processingId === req.id}
                        startIcon={processingId === req.id ? <CircularProgress size={16} color="inherit"/> : <CheckCircle />}
                        onClick={() => handleResponse(req, 'APPROVED')}
                        sx={{ mr: 1 }}
                      >
                        {req.accessType === 'ZKP_AGE' ? "Gen Proof" : "Approve"}
                      </Button>
                      <Button 
                        variant="outlined" color="error" size="small" 
                        disabled={processingId === req.id}
                        startIcon={<Cancel />}
                        onClick={() => handleResponse(req, 'REJECTED')}
                      >
                        Deny
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomingRequests;