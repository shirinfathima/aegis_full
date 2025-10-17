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
  Avatar,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import {
  AdminPanelSettings as IssuerIcon,
  People as UsersIcon,
  Assignment as TaskIcon,
  Assessment as ReportsIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function IssuerDashboard() {
  const navigate = useNavigate();
  // ALL HOOKS MOVED TO THE TOP
  const [currentUser] = useState(getCurrentUser());
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      role: 'User',
      status: 'Active',
      joinDate: '2024-09-01',
      verificationStatus: 'Approved',
      documentsCount: 3,
      avatar: null
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@email.com',
      role: 'Verifier',
      status: 'Active',
      joinDate: '2024-08-15',
      verificationStatus: 'Pending',
      documentsCount: 1,
      avatar: null
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@email.com',
      role: 'User',
      status: 'Suspended',
      joinDate: '2024-07-20',
      verificationStatus: 'Rejected',
      documentsCount: 2,
      avatar: null
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@email.com',
      role: 'User',
      status: 'Active',
      joinDate: '2024-09-10',
      verificationStatus: 'Approved',
      documentsCount: 2,
      avatar: null
    }
  ]);
  const [verifications] = useState([
    {
      id: 1,
      userId: 1,
      userName: 'John Doe',
      documentType: 'National ID',
      submittedDate: '2024-09-14',
      status: 'Pending Review',
      assignedTo: 'Jane Smith',
      priority: 'Normal'
    },
    {
      id: 2,
      userId: 4,
      userName: 'Alice Brown',
      documentType: 'Passport',
      submittedDate: '2024-09-13',
      status: 'In Progress',
      assignedTo: 'Jane Smith',
      priority: 'High'
    },
    {
      id: 3,
      userId: 3,
      userName: 'Bob Johnson',
      documentType: 'Driver License',
      submittedDate: '2024-09-12',
      status: 'Rejected',
      assignedTo: 'System',
      priority: 'Normal'
    }
  ]);
  const [systemStats] = useState({
    totalUsers: 1247,
    activeUsers: 1158,
    pendingVerifications: 23,
    completedToday: 67,
    successRate: 94.2,
    averageProcessingTime: '2.3 minutes'
  });

  // Role enforcement logic
  useEffect(() => {
    if (!currentUser || currentUser.role.toUpperCase() !== 'ISSUER') {
      // Redirect unauthorized users
      if (currentUser && currentUser.role.toUpperCase() === 'VERIFIER') {
        navigate('/verifier/dashboard');
      } else if (currentUser && currentUser.role.toUpperCase() === 'USER') {
        navigate('/user');
      } else {
        // Not logged in or unknown role, redirect to home/login page
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  // CONDITIONAL RETURN IS NOW AFTER ALL HOOKS
  if (!currentUser || currentUser.role.toUpperCase() !== 'ISSUER') {
    // Prevent rendering the dashboard while redirecting
    return <Box sx={{ p: 4 }}>Checking authorization...</Box>;
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
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

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'normal':
        return 'primary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleExportUsers = () => {
    // Mock export functionality
    const csvData = users.map(user =>
      `${user.name},${user.email},${user.role},${user.status},${user.joinDate}`
    ).join('\n');

    const blob = new Blob([`Name,Email,Role,Status,Join Date\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_report.csv';
    a.click();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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

  const issuerSidebar = (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar
            sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}
          >
            <IssuerIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6">{currentUser.name}</Typography> 
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentUser.email}
          </Typography>
        </CardContent>
      </Card>
      {/* NEW: Standalone Logout Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
            <List sx={{ width: '100%' }}>
                <ListItem 
                    button 
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
      {/* END NEW: Standalone Logout Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>System Overview</Typography>
          <StatCard
            title="Total Users"
            value={systemStats.totalUsers}
            icon={<UsersIcon />}
            color="primary"
          />
          <Box sx={{ my: 2 }}>
            <StatCard
              title="Active Users"
              value={systemStats.activeUsers}
              icon={<UsersIcon />}
              color="success"
            />
          </Box>
          <StatCard
            title="Pending Verifications"
            value={systemStats.pendingVerifications}
            icon={<TaskIcon />}
            color="warning"
          />
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <DashboardLayout sidebar={issuerSidebar}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IssuerIcon /> Issuer Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, monitor verifications, and generate reports
        </Typography>
      </Box>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="User Management" />
            <Tab label="Verification Queue" />
            <Tab label="System Reports" />
          </Tabs>
        </Box>

        {/* User Management Tab */}
        {currentTab === 0 && (
          <CardContent>
            {/* Search and Filter Controls */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportUsers}
              >
                Export CSV
              </Button>
            </Box>

            {/* Users Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Verification Status</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar>{user.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="subtitle2">{user.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={user.role} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.verificationStatus}
                          color={getStatusColor(user.verificationStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.documentsCount}</TableCell>
                      <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleUserClick(user)}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <BlockIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Verification Queue Tab */}
        {currentTab === 1 && (
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h6">Pending Verifications</Typography>
              <Chip label={`${verifications.length} items`} color="primary" />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {verification.userName}
                        </Typography>
                      </TableCell>
                      <TableCell>{verification.documentType}</TableCell>
                      <TableCell>
                        {new Date(verification.submittedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={verification.status}
                          color={getStatusColor(verification.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={verification.priority}
                          color={getPriorityColor(verification.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{verification.assignedTo}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="success">
                          <ApproveIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <RejectIcon />
                        </IconButton>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* System Reports Tab */}
        {currentTab === 2 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>System Performance</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Success Rate</Typography>
                  <Typography variant="h6">{systemStats.successRate}%</Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Avg. Processing Time</Typography>
                  <Typography variant="h6">{systemStats.averageProcessingTime}</Typography>
                </Alert>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Generate Reports</Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Button variant="outlined" startIcon={<DownloadIcon />}>
                    User Activity Report
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="outlined" startIcon={<DownloadIcon />}>
                    Verification Statistics
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="outlined" startIcon={<DownloadIcon />}>
                    System Performance
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="outlined" startIcon={<DownloadIcon />}>
                    Fraud Detection Report
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        )}
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Typography color="text.secondary">{selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Role:</strong> {selectedUser.role}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedUser.status}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Join Date:</strong> {new Date(selectedUser.joinDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Documents:</strong> {selectedUser.documentsCount}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Close</Button>
          <Button variant="contained">Edit User</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default IssuerDashboard;