import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Avatar,
  Chip
} from '@mui/material';
import {
  ContactSupport as ContactIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as FaqIcon,
  Support as SupportIcon,
  Chat as ChatIcon,
  Description as DocIcon
} from '@mui/icons-material';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Mock form submission
    console.log('Form submitted:', formData);
    setShowSuccess(true);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      category: '',
      message: ''
    });
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const contactMethods = [
    {
      icon: <EmailIcon />,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@trustnet.com',
      responseTime: 'Response within 24 hours'
    },
    {
      icon: <PhoneIcon />,
      title: 'Phone Support',
      description: 'Speak with our experts',
      contact: '+1 (555) 123-4567',
      responseTime: 'Mon-Fri, 9 AM - 6 PM PST'
    },
    {
      icon: <ChatIcon />,
      title: 'Live Chat',
      description: 'Real-time assistance',
      contact: 'Available on website',
      responseTime: 'Mon-Fri, 9 AM - 6 PM PST'
    },
    {
      icon: <DocIcon />,
      title: 'Documentation',
      description: 'Self-service help center',
      contact: 'docs.trustnet.com',
      responseTime: 'Available 24/7'
    }
  ];

  const faqs = [
    {
      question: 'How long does document verification take?',
      answer: 'Most documents are verified within 2-5 minutes using our AI-powered system. Complex cases that require manual review may take up to 24 hours.'
    },
    {
      question: 'What document types are supported?',
      answer: 'We support over 50 document types including National IDs, Passports, Driver Licenses, Birth Certificates, and more. Our system supports documents from 190+ countries.'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes, we use enterprise-grade encryption and blockchain technology to ensure your data is completely secure. We comply with GDPR, CCPA, and other privacy regulations.'
    },
    {
      question: 'What if my document is rejected?',
      answer: 'If your document is rejected, you will receive detailed feedback on the reason. You can then re-upload a clearer image or contact our support team for assistance.'
    },
    {
      question: 'Can I verify documents for my business?',
      answer: 'Yes, we offer enterprise solutions with API integration, bulk verification, and custom workflows. Contact our sales team for business inquiries.'
    },
    {
      question: 'What is the accuracy rate of your system?',
      answer: 'Our AI-powered verification system has an accuracy rate of 99.2% and a fraud detection rate of 99.7%. We continuously improve our algorithms based on new data.'
    },
    {
      question: 'How much does verification cost?',
      answer: 'We offer flexible pricing plans starting from $0.50 per verification for individuals and custom pricing for enterprises. Contact us for detailed pricing information.'
    },
    {
      question: 'Can I integrate TrustNet with my application?',
      answer: 'Yes, we provide comprehensive APIs and SDKs for easy integration. Our developer documentation includes code examples and integration guides.'
    }
  ];

  const officeLocations = [
    {
      city: 'San Francisco',
      address: '123 Innovation Drive, Suite 500, San Francisco, CA 94105',
      type: 'Headquarters'
    },
    {
      city: 'New York',
      address: '456 Business Plaza, Floor 12, New York, NY 10001',
      type: 'East Coast Office'
    },
    {
      city: 'London',
      address: '789 Tech Park, Canary Wharf, London E14 5AB, UK',
      type: 'European Office'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <ContactIcon sx={{ fontSize: 40 }} />
          Contact & Support
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          We're here to help! Get in touch with our support team or find answers to your questions.
        </Typography>
      </Box>

      {/* Success Alert */}
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Thank you for contacting us! We've received your message and will respond within 24 hours.
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SendIcon />
                Send us a Message
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Subject"
                      value={formData.subject}
                      onChange={handleInputChange('subject')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={handleInputChange('category')}
                        label="Category"
                      >
                        <MenuItem value="technical">Technical Support</MenuItem>
                        <MenuItem value="billing">Billing & Pricing</MenuItem>
                        <MenuItem value="general">General Inquiry</MenuItem>
                        <MenuItem value="bug">Bug Report</MenuItem>
                        <MenuItem value="feature">Feature Request</MenuItem>
                        <MenuItem value="business">Business Partnership</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Message"
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      placeholder="Please describe your question or issue in detail..."
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<SendIcon />}
                      fullWidth
                    >
                      Send Message
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Methods */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SupportIcon />
                Contact Methods
              </Typography>
              
              <List>
                {contactMethods.map((method, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        {method.icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={method.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.primary">
                            {method.contact}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {method.responseTime}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Office Hours */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon />
                Support Hours
              </Typography>
              
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Monday - Friday" 
                    secondary="9:00 AM - 6:00 PM PST" 
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Saturday" 
                    secondary="10:00 AM - 2:00 PM PST" 
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Sunday" 
                    secondary="Closed" 
                  />
                </ListItem>
              </List>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Emergency technical support is available 24/7 for enterprise customers.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FAQ Section */}
      <Card sx={{ mt: 6 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaqIcon />
            Frequently Asked Questions
          </Typography>
          
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Office Locations */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon />
            Our Offices
          </Typography>
          
          <Grid container spacing={3}>
            {officeLocations.map((office, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {office.city}
                  </Typography>
                  <Chip 
                    label={office.type} 
                    color={office.type === 'Headquarters' ? 'primary' : 'default'} 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {office.address}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Additional Resources
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<HelpIcon />}
                href="#" 
                sx={{ py: 2 }}
              >
                Help Center
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<DocIcon />}
                href="#" 
                sx={{ py: 2 }}
              >
                API Documentation
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<ChatIcon />}
                href="#" 
                sx={{ py: 2 }}
              >
                Community Forum
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<SendIcon />}
                href="#" 
                sx={{ py: 2 }}
              >
                Status Page
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Contact;