import React, { useState } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Link,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { register } from './services/authService';
import { useNavigate } from 'react-router-dom';

const cardGradient = 'linear-gradient(135deg, #1a3f4a 0%, #2d5a63 50%, #3d7a8f 100%)';
const accentColor = '#438b98';

const StyledModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  outline: 'none',
  maxHeight: '80vh',
  overflowY: 'auto',
}));

function SignUpModal({ open, onClose, onSignInClick }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [submissionMessage, setSubmissionMessage] = useState('');
  const navigate = useNavigate();

  const handleSignInRedirect = () => {
    onClose();
    onSignInClick();
  };

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setSubmissionMessage('Passwords do not match!');
      return;
    }

    try {
      const user = await register(formData.fullName, formData.email, formData.password, formData.role);
      if (user && user.id) {
        setSubmissionMessage('User registered successfully');
        onClose();
        const role = user.role.toLowerCase();
        if (role === 'issuer') navigate('/issuer/dashboard');
        else if (role === 'verifier') navigate('/verifier/dashboard');
        else navigate('/user');
      }
    } catch (error) {
      setSubmissionMessage(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="sign-up-modal-title">
      <StyledModalContent>
        <Typography
          id="sign-up-modal-title"
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
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Join TrustNet to start verifying your identity
        </Typography>

        {submissionMessage && (
          <Alert severity={submissionMessage === 'User registered successfully' ? 'success' : 'error'}>
            {submissionMessage}
          </Alert>
        )}

        <TextField fullWidth label="Full Name" margin="normal" variant="outlined" value={formData.fullName} onChange={handleInputChange('fullName')} required />
        <TextField fullWidth label="Email" type="email" margin="normal" variant="outlined" value={formData.email} onChange={handleInputChange('email')} required />
        <TextField fullWidth label="Password" type="password" margin="normal" variant="outlined" value={formData.password} onChange={handleInputChange('password')} required />
        <TextField fullWidth label="Confirm Password" type="password" margin="normal" variant="outlined" value={formData.confirmPassword} onChange={handleInputChange('confirmPassword')} required />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select value={formData.role} onChange={handleInputChange('role')} label="Role">
            <MenuItem value="USER">User</MenuItem>
            <MenuItem value="VERIFIER">Verifier</MenuItem>
            <MenuItem value="ISSUER">Issuer</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" fullWidth sx={{ mt: 3, py: 1.5, background: cardGradient }} onClick={handleSubmit}>
          Sign Up
        </Button>

        <Link component="button" variant="body2" onClick={handleSignInRedirect} sx={{ mt: 1, textAlign: 'center', color: accentColor, textDecoration: 'underline' }}>
          Already have an account? Sign in
        </Link>
      </StyledModalContent>
    </Modal>
  );
}

export default SignUpModal;