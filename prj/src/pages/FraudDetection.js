import React, { useState } from 'react';
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
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SafeIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Timeline as TimelineIcon,
  PersonOff as SuspiciousIcon,
  Shield as ShieldIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

function FraudDetection() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');

  // Mock fraud detection data
  const [suspiciousActivities] = useState([
    {
      id: 1,
      userId: 'USR001',
      userName: 'John Suspicious',
      email: 'john.sus@email.com',
      activityType: 'Document Tampering',
      riskScore: 95,
      detectionTime: '2024-09-14T14:30:00',
      status: 'Under Investigation',
      details: {
        documentType: 'National ID',
        tamperedFields: ['Date of Birth', 'ID Number'],
        confidence: 97,
        evidenceCount: 3
      },
      flags: ['Digital Manipulation Detected', 'Inconsistent Font', 'Modified Metadata']
    },
    {
      id: 2,
      userId: 'USR045',
      userName: 'Alice Fake',
      email: 'alice.fake@email.com',
      activityType: 'Duplicate Submission',
      riskScore: 78,
      detectionTime: '2024-09-14T13:15:00',
      status: 'Flagged',
      details: {
        documentType: 'Passport',
        duplicateCount: 3,
        confidence: 89,
        evidenceCount: 2
      },
      flags: ['Multiple Identical Submissions', 'Same Document Hash']
    },
    {
      id: 3,
      userId: 'USR023',
      userName: 'Bob Fraudster',
      email: 'bob.fraud@email.com',
      activityType: 'Identity Theft',
      riskScore: 88,
      detectionTime: '2024-09-14T11:45:00',
      status: 'Blocked',
      details: {
        documentType: 'Driver License',
        stolenFromUser: 'Robert Johnson (USR567)',
        confidence: 94,
        evidenceCount: 4
      },
      flags: ['Known Stolen Document', 'Blacklisted ID Number', 'Cross-Reference Match']
    },
    {
      id: 4,
      userId: 'USR098',
      userName: 'Carol Phish',
      email: 'carol.phish@email.com',
      activityType: 'Template Mismatch',
      riskScore: 65,
      detectionTime: '2024-09-14T10:20:00',
      status: 'Under Review',
      details: {
        documentType: 'Birth Certificate',
        expectedTemplate: 'State Template v2.1',
        actualTemplate: 'Unknown/Custom',
        confidence: 72,
        evidenceCount: 2
      },
      flags: ['Template Not Recognized', 'Unusual Layout']
    }
  ]);

  const [systemLogs] = useState([
    {
      id: 1,
      timestamp: '2024-09-14T14:30:15',
      level: 'Critical',
      module: 'Fraud Detection Engine',
      message: 'High-risk document tampering detected',
      userId: 'USR001',
      action: 'Document flagged for manual review'
    },
    {
      id: 2,
      timestamp: '2024-09-14T14:25:30',
      level: 'Warning',
      module: 'OCR Service',
      message: 'Low confidence OCR result',
      userId: 'USR045',
      action: 'Verification routed to human verifier'
    },
    {
      id: 3,
      timestamp: '2024-09-14T14:20:45',
      level: 'Info',
      module: 'Blockchain Verifier',
      message: 'Document successfully recorded on blockchain',
      userId: 'USR012',
      action: 'Verification completed'
    },
    {
      id: 4,
      timestamp: '2024-09-14T14:15:12',
      level: 'Critical',
      module: 'Identity Verification',
      message: 'Potential identity theft detected',
      userId: 'USR023',
      action: 'User account suspended'
    },
    {
      id: 5,
      timestamp: '2024-09-14T14:10:33',
      level: 'Warning',
      module: 'Template Matching',
      message: 'Document template not in approved database',
      userId: 'USR098',
      action: 'Escalated to admin'
    }
  ]);

  const [fraudStats] = useState({
    totalDetected: 247,
    highRisk: 23,
    underInvestigation: 8,
    resolved: 216,
    falsePositives: 12,
    detectionRate: 94.2
  });

  const getRiskColor = (score) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    return 'success';
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 40) return 'Low Risk';
    return 'Safe';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'under investigation': return 'warning';
      case 'flagged': return 'error';
      case 'blocked': return 'error';
      case 'under review': return 'info';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getLogLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  };

  const handleDownloadReport = () => {
    // Mock download functionality
    const reportData = suspiciousActivities.map(activity => 
      `${activity.userName},${activity.email},${activity.activityType},${activity.riskScore},${activity.status},${activity.detectionTime}`
    ).join('\n');
    
    const blob = new Blob([`Name,Email,Activity Type,Risk Score,Status,Detection Time\n${reportData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud_detection_report.csv';
    a.click();
  };

  const filteredActivities = suspiciousActivities.filter(activity => {
    if (riskFilter === 'all') return true;
    if (riskFilter === 'high' && activity.riskScore >= 80) return true;
    if (riskFilter === 'medium' && activity.riskScore >= 60 && activity.riskScore < 80) return true;
    if (riskFilter === 'low' && activity.riskScore < 60) return true;
    return false;
  });

  const StatCard = ({ title, value, icon, color = 'primary', description }) => (
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
            {description && (
              <Typography variant="body2" color="textSecondary">
                {description}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, height: 56, width: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon /> Fraud Detection & Security Monitoring
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor suspicious activities and security threats in real-time
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Detected"
            value={fraudStats.totalDetected}
            icon={<SecurityIcon />}
            color="primary"
            description="All time detections"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="High Risk Cases"
            value={fraudStats.highRisk}
            icon={<ErrorIcon />}
            color="error"
            description="Requiring immediate attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Under Investigation"
            value={fraudStats.underInvestigation}
            icon={<WarningIcon />}
            color="warning"
            description="Currently being reviewed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Detection Rate"
            value={`${fraudStats.detectionRate}%`}
            icon={<ShieldIcon />}
            color="success"
            description="System accuracy"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Suspicious Activities" />
            <Tab label="System Logs" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Suspicious Activities Tab */}
        {currentTab === 0 && (
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  label="Risk Level"
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="high">High Risk</MenuItem>
                  <MenuItem value="medium">Medium Risk</MenuItem>
                  <MenuItem value="low">Low Risk</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Activity Type</TableCell>
                    <TableCell>Risk Score</TableCell>
                    <TableCell>Detection Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Flags</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: getRiskColor(activity.riskScore) + '.main' }}>
                            <SuspiciousIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{activity.userName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activity.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{activity.activityType}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2">{activity.riskScore}</Typography>
                          </Box>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={activity.riskScore} 
                              color={getRiskColor(activity.riskScore)}
                            />
                          </Box>
                          <Chip 
                            label={getRiskLabel(activity.riskScore)} 
                            color={getRiskColor(activity.riskScore)} 
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(activity.detectionTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={activity.status} 
                          color={getStatusColor(activity.status)} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {activity.flags.slice(0, 2).map((flag, index) => (
                            <Chip key={index} label={flag} color="warning" size="small" />
                          ))}
                          {activity.flags.length > 2 && (
                            <Chip label={`+${activity.flags.length - 2} more`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleActivityClick(activity)}
                        >
                          <ViewIcon />
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

        {/* System Logs Tab */}
        {currentTab === 1 && (
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6">Recent System Activity</Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time monitoring of security events and system alerts
              </Typography>
            </Box>

            <List>
              {systemLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <ListItem>
                    <ListItemIcon>
                      {log.level === 'Critical' && <ErrorIcon color="error" />}
                      {log.level === 'Warning' && <WarningIcon color="warning" />}
                      {log.level === 'Info' && <SafeIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{log.message}</Typography>
                          <Chip 
                            label={log.level} 
                            color={getLogLevelColor(log.level)} 
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Module: {log.module} | User: {log.userId} | Action: {log.action}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < systemLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        )}

        {/* Analytics Tab */}
        {currentTab === 2 && (
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>Security Analytics</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">System Health</Typography>
                  <Typography variant="body2">
                    All security modules are operational. Last scan completed 2 minutes ago.
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Active Threats</Typography>
                  <Typography variant="body2">
                    {fraudStats.highRisk} high-risk cases require immediate attention.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Detection Statistics</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {fraudStats.resolved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved Cases
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {fraudStats.underInvestigation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Under Investigation
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {fraudStats.falsePositives}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    False Positives
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {fraudStats.detectionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accuracy Rate
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Activity Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon />
            Suspicious Activity Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedActivity.activityType}</Typography>
                  <Typography color="text.secondary">
                    User: {selectedActivity.userName} ({selectedActivity.email})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Risk Score:</strong> {selectedActivity.riskScore}/100
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedActivity.status}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Detection Time:</strong> {new Date(selectedActivity.detectionTime).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>Details</Typography>
              <Typography variant="body2">
                <strong>Document Type:</strong> {selectedActivity.details.documentType}<br/>
                <strong>Confidence:</strong> {selectedActivity.details.confidence}%<br/>
                <strong>Evidence Count:</strong> {selectedActivity.details.evidenceCount}
              </Typography>

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Security Flags</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedActivity.flags.map((flag, index) => (
                  <Chip key={index} label={flag} color="error" />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button variant="contained" color="error">
            Block User
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FraudDetection;