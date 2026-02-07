import { styled } from '@mui/material/styles';
import { Box, Card, IconButton } from '@mui/material';

// Modern Gradient Card for Profile/Header sections
export const ModernCard = styled(Box)(({ theme, gradient }) => ({
  background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '20px',
  padding: theme.spacing(3),
  color: 'white',
  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none',
  },
}));

// Glassmorphism Card
export const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
  },
}));

// Stat Card with custom gradients
export const StatCard = styled(Box)(({ gradient, theme }) => ({
  background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '20px',
  padding: theme.spacing(3),
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.02)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
}));

// Modern Action Button with Gradient
export const ActionIconButton = styled(IconButton)(({ theme }) => ({
  padding: '8px',
  borderRadius: '10px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

// Progress Card with Gradient Border
export const ProgressCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)',
  },
}));

// Gradient Presets
export const gradients = {
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  pink: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  cyan: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  sunset: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
};
