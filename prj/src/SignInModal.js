// SignInModal.js - REPLACE ENTIRE FILE
import React, { useState } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Link, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { login } from './services/authService';
import { useNavigate } from 'react-router-dom';

const StyledModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  outline: 'none',
}));

function SignInModal({ open, onClose, onSignUpClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const navigate = useNavigate();

  const handleSignUpRedirect = () => {
    onClose();
    onSignUpClick();
  };

  const handleLogin = async () => {
    try {
      const user = await login(email, password);
      setSubmissionMessage(`Login successful as ${user.role}`);
      
      if (user) {
        onClose();
        // Use the role from the returned user object
        const role = user.role.toLowerCase(); 
        
        switch(role) {
          case 'issuer':
            navigate('/issuer/dashboard');
            break;
          case 'verifier':
            navigate('/verifier/dashboard');
            break;
          case 'user':
          default:
            navigate('/user');
        }
      }
    } catch (error) {
      setSubmissionMessage('Login failed. Invalid credentials.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="sign-in-modal-title"
      aria-describedby="sign-in-modal-description"
    >
      <StyledModalContent>
        <Typography id="sign-in-modal-title" variant="h5" fontWeight="bold" textAlign="center">
          Welcome Back
        </Typography>
        <Typography id="sign-in-modal-description" variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
          Sign in to access your digital identity dashboard
        </Typography>

        {submissionMessage && (
          <Alert severity={submissionMessage.includes("successful") ? "success" : "error"}>
            {submissionMessage}
          </Alert>
        )}

        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button variant="contained" fullWidth sx={{ mt: 2, py: 1.5 }} onClick={handleLogin}>
          Sign In
        </Button>

        <Link
          component="button"
          variant="body2"
          onClick={handleSignUpRedirect}
          sx={{ mt: 1, textAlign: 'center', textDecoration: 'underline' }}
        >
          Don't have an account? Sign up
        </Link>
      </StyledModalContent>
    </Modal>
  );
}

export default SignInModal;