import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, Select, MenuItem, FormControl, Alert 
} from '@mui/material';
import { AccessTime, CheckCircle, Cancel } from '@mui/icons-material';

const IncomingRequests = ({ userEmail }) => {
  const [requests, setRequests] = useState([]);
  const [durations, setDurations] = useState({}); // Stores selected duration for each row

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
        // Only show PENDING requests
        setRequests(data.filter(r => r.status === 'PENDING'));
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleDurationChange = (reqId, minutes) => {
    setDurations({ ...durations, [reqId]: minutes });
  };

  const handleResponse = async (reqId, status) => {
    const password = sessionStorage.getItem('temp_pass');
    const duration = durations[reqId] || 60; // Default to 60 mins

    const payload = {
      requestId: reqId,
      status: status,
      durationInMinutes: duration
    };

    try {
      await fetch('http://localhost:8080/api/user/respond-request', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${userEmail}:${password}`)
        },
        body: JSON.stringify(payload)
      });
      
      // Remove from list
      setRequests(requests.filter(r => r.id !== reqId));
      alert(`Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}!`);
      
    } catch (error) {
      console.error("Error updating request:", error);
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
                  <TableCell><strong>Document</strong></TableCell>
                  <TableCell><strong>Access Duration</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                        <Typography variant="body2" fontWeight="bold">{req.verifierEmail}</Typography>
                        <Typography variant="caption">{new Date(req.requestDate).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell>{req.document ? req.document.documentName : "Unknown Doc"}</TableCell>
                    
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
                          <MenuItem value={10080}>7 Days</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Buttons */}
                    <TableCell align="right">
                      <Button 
                        variant="contained" color="success" size="small" 
                        startIcon={<CheckCircle />}
                        onClick={() => handleResponse(req.id, 'APPROVED')}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outlined" color="error" size="small" 
                        startIcon={<Cancel />}
                        onClick={() => handleResponse(req.id, 'REJECTED')}
                      >
                        Reject
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