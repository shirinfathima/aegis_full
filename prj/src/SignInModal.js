// SignInModal.js - REPLACE ENTIRE FILE
import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Link, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { login } from './services/authService';
import { useNavigate } from 'react-router-dom';

const cardGradient = 'linear-gradient(135deg, #1a3f4a 0%, #2d5a63 50%, #3d7a8f 100%)';
const accentColor = '#438b98';

const StyledModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 420,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  padding: theme.spacing(4),
  borderRadius: 20,
  display: 'flex', flexDirection: 'column', gap: theme.spacing(2),
  outline: 'none'
}));

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: accentColor,
      boxShadow: '0 0 0 3px rgba(67, 139, 152, 0.2)'
    }
  }
};

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
      onClose();
      const role = user.role.toLowerCase();
      if (role === 'issuer') navigate('/issuer/dashboard');
      else if (role === 'verifier') navigate('/verifier/dashboard');
      else navigate('/user');
    } catch {
      setSubmissionMessage('Login failed. Invalid credentials.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="sign-in-modal-title">
      <StyledModalContent>
        <Typography
          id="sign-in-modal-title"
          variant="h5"
          textAlign="center"
          sx={{
            background: cardGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
          }}
        >
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Sign in to access your digital identity dashboard
        </Typography>

        {submissionMessage && (
          <Alert severity={submissionMessage.includes('successful') ? 'success' : 'error'}>
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
          sx={fieldSx}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={fieldSx}
        />

        <Button variant="contained" fullWidth sx={{ mt: 2, py: 1.5, background: cardGradient }} onClick={handleLogin}>
          Sign In
        </Button>

        <Link
          component="button"
          variant="body2"
          onClick={handleSignUpRedirect}
          sx={{ mt: 1, textAlign: 'center', color: accentColor, textDecoration: 'underline' }}
        >
          Don't have an account? Sign up
        </Link>
      </StyledModalContent>
    </Modal>
  );
}

export default SignInModal;