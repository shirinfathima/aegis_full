// src/components/DashboardLayout.js
import React from 'react';
import { Box, Grid, Container } from '@mui/material';

const DashboardLayout = ({ sidebar, children }) => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Sidebar for Profile/Quick Actions */}
        <Grid item xs={12} md={4}>
          <Box>{sidebar}</Box>
        </Grid>
        
        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          <Box>{children}</Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardLayout;