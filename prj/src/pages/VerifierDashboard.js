import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tabs,
  Tab,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  VerifiedUser as VerifierIcon,
  Assignment as DocumentIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Schedule as PendingIcon,
  Done as DoneIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import DashboardLayout from '../components/DashboardLayout';

function VerifierDashboard() {
  const navigate = useNavigate();
  // ALL HOOKS MOVED TO THE TOP
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(1);
  const [completedVerifications, setCompletedVerifications] = useState([
    {
      id: 4,
      userName: 'Alice Brown',
      documentType: 'National ID',
      completedDate: '2024-09-13T16:20:00',
      decision: 'Approved',
      remarks: 'All information verified successfully'
    },
    {
      id: 5,
      userName: 'Bob Wilson',
      documentType: 'Passport',
      completedDate: '2024-09-13T14:15:00',
      decision: 'Rejected',
      remarks: 'Document appears to be tampered with'
    }
  ]);
  const [verifierStats] = useState({
    assignedToday: 8,
    completedToday: 5,
    pendingReview: 3,
    approvalRate: 87.5,
    avgProcessingTime: '12 minutes'
  });

  // Role enforcement logic
  useEffect(() => {
    if (!currentUser || currentUser.role.toUpperCase() !== 'VERIFIER') {
      if (currentUser && currentUser.role.toUpperCase() === 'ISSUER') {
        navigate('/issuer/dashboard');
      } else if (currentUser && currentUser.role.toUpperCase() === 'USER') {
        navigate('/user');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  // CONDITIONAL RETURN IS NOW AFTER ALL HOOKS
  if (!currentUser || currentUser.role.toUpperCase() !== 'VERIFIER') {
    return <Box sx={{ p: 4 }}>Checking authorization...</Box>;
  }


  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'done':
        return 'success';
      case 'pending':
      case 'pending review':
      case 'in progress':
        return 'warning';
      case 'suspended':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, height: 56, width: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const verifierSidebar = (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar
            sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}
          >
            <VerifierIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6">{currentUser.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentUser.email}
          </Typography>
          <Chip label={currentUser.role} color="primary" size="small" />
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<PersonIcon />}
              onClick={() => navigate('/profile-details')}
              fullWidth
            >
              My Profile
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
            <List sx={{ width: '100%' }}>
                <ListItem
                    button
                    sx={{ py: 0 }}
                    onClick={() => {
                        logout();
                        navigate('/');
                    }}
                >
                    <ListItemIcon>
                        <LogoutIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Statistics</Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <DoneIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Completed Today" secondary={verifierStats.completedToday} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <PendingIcon color="warning" />
              </ListItemIcon>
              <ListItemText primary="Pending Queue" secondary={verifierStats.pendingReview} />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <DashboardLayout sidebar={verifierSidebar}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifierIcon /> Verifier Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and verify user-submitted documents
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Today"
            value={verifierStats.assignedToday}
            icon={<DocumentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={verifierStats.completedToday}
            icon={<DoneIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Review"
            value={verifierStats.pendingReview}
            icon={<PendingIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approval Rate"
            value={`${verifierStats.approvalRate}%`}
            icon={<ApproveIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab
              label={
                  <Badge badgeContent={verifierStats.pendingReview} color="error">
                    Review Queue
                  </Badge>
              }
            />
            <Tab label="Completed Verifications" />
            <Tab label="Performance" />
          </Tabs>
        </Box>

        {currentTab === 0 && (
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <AssessmentIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }}/>
                <Typography variant="h5" sx={{ mb: 1 }}>
                    Pending Documents ({verifierStats.pendingReview})
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Access the dedicated page to begin or continue document reviews.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/verifier/document-review')}
                    startIcon={<ViewIcon />}
                >
                    Document Review
                </Button>
            </CardContent>
        )}

        {currentTab === 1 && (
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Completed Date</TableCell>
                    <TableCell>Decision</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedVerifications.map((verification) => (
                    <TableRow key={verification.id}>
                      <TableCell>{verification.userName}</TableCell>
                      <TableCell>{verification.documentType}</TableCell>
                      <TableCell>
                        {new Date(verification.completedDate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={verification.decision}
                          color={verification.decision === 'Approved' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{verification.remarks || 'No remarks'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {currentTab === 2 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Performance Metrics</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Approval Rate</Typography>
                  <Typography variant="h6">{verifierStats.approvalRate}%</Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Average Processing Time</Typography>
                  <Typography variant="h6">{verifierStats.avgProcessingTime}</Typography>
                </Alert>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Recent Activity</Typography>
            <List>
              {completedVerifications.slice(0, 5).map((verification) => (
                <ListItem key={verification.id}>
                  <ListItemIcon>
                    {verification.decision === 'Approved' ?
                      <ApproveIcon color="success" /> :
                      <RejectIcon color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={`${verification.decision} ${verification.documentType} for ${verification.userName}`}
                    secondary={new Date(verification.completedDate).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        )}
      </Card>
    </DashboardLayout>
  );
}

export default VerifierDashboard;