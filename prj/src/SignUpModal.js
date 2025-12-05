import React, { useState } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Divider, Link,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { register } from './services/authService';
import { useNavigate } from 'react-router-dom';

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
    role: 'user',
  });
  const [submissionMessage, setSubmissionMessage] = useState('');
  const navigate = useNavigate();

  const handleSignInRedirect = () => {
    onClose();
    onSignInClick();
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setSubmissionMessage('Passwords do not match!');
      return;
    }

    try {
      // The register function now returns the user object on success
      const user = await register(formData.fullName, formData.email, formData.password, formData.role);
      
      if (user && user.id) {
        setSubmissionMessage('User registered successfully');
        onClose(); // Close the modal

        // Redirect to the correct dashboard based on the user's role
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
      // The authService throws an error on failure, which we catch here
      setSubmissionMessage(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="sign-up-modal-title"
      aria-describedby="sign-up-modal-description"
    >
      <StyledModalContent>
        <Typography id="sign-up-modal-title" variant="h5" fontWeight="bold" textAlign="center">
          Create Account
        </Typography>
        <Typography id="sign-up-modal-description" variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
          Join TrustNet to start verifying your identity
        </Typography>

        {submissionMessage && (
          <Alert severity={submissionMessage === 'User registered successfully' ? "success" : "error"}>
            {submissionMessage}
          </Alert>
        )}

        <TextField
            fullWidth
            label="Full Name"
            margin="normal"
            variant="outlined"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            required
          />

        <TextField
          label="Email"
          type="email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formData.email}
          onChange={handleInputChange('email')}
          required
        />

        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formData.password}
          onChange={handleInputChange('password')}
          required
        />

        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            value={formData.role}
            onChange={handleInputChange('role')}
            label="Role"
          >
            <MenuItem value="USER">User</MenuItem>
            <MenuItem value="VERIFIER">Verifier</MenuItem>
            <MenuItem value="ISSUER">Issuer</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3, py: 1.5 }}
          onClick={handleSubmit}
        >
          Sign Up
        </Button>

        <Link
          component="button"
          variant="body2"
          onClick={handleSignInRedirect}
          sx={{ mt: 1, textAlign: 'center', textDecoration: 'underline' }}
        >
          Already have an account? Sign in
        </Link>
      </StyledModalContent>
    </Modal>
  );
}

export default SignUpModal;