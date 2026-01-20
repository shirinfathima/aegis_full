import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { Info, Shield, ContactSupport, ExitToApp } from '@mui/icons-material';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Contact from '../pages/Contact';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 280;

function WelcomeLayout({ roleName, introContent }) {
  const [activeView, setActiveView] = useState('intro');
  const navigate = useNavigate();

  const menuItems = [
    { id: 'intro', text: 'Introduction', icon: <Info /> },
    { id: 'privacy', text: 'Privacy & Terms', icon: <Shield /> },
    { id: 'contact', text: 'Contact Support', icon: <ContactSupport /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Leftmost Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#1a237e',
            color: 'white',
            borderRight: 'none',
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>
            AegisID
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {roleName} Portal
          </Typography>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ mt: 2 }}>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.id} 
              onClick={() => setActiveView(item.id)}
              sx={{
                mb: 1,
                mx: 1,
                borderRadius: 2,
                bgcolor: activeView === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <ListItem button onClick={() => navigate('/')} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ color: 'white' }}><ExitToApp /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, color: '#333' }}>
          {menuItems.find(i => i.id === activeView).text}
        </Typography>
        
        {activeView === 'intro' && introContent}
        {activeView === 'privacy' && <PrivacyPolicy />}
        {activeView === 'contact' && <Contact />}
      </Box>
    </Box>
  );
}

export default WelcomeLayout;