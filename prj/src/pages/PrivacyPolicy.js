import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Paper,
  Grid
} from '@mui/material';
import {
  Security as SecurityIcon,
  Policy as PolicyIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Gavel as LegalIcon,
  Info as InfoIcon
} from '@mui/icons-material';

function PrivacyPolicy() {
  const [currentTab, setCurrentTab] = useState(0);

  const privacyPolicyContent = {
    overview: {
      title: 'Privacy Policy Overview',
      lastUpdated: '2024-09-01',
      content: [
        {
          section: 'Our Commitment to Privacy',
          text: 'At TrustNet, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our identity verification services.'
        },
        {
          section: 'What Information We Collect',
          text: 'We collect personal information necessary for identity verification including: full name, date of birth, identification numbers, addresses, and document images. We also collect technical information such as IP addresses, device information, and usage analytics.'
        },
        {
          section: 'How We Use Your Information',
          text: 'Your information is used solely for: identity verification purposes, fraud prevention and detection, compliance with legal requirements, improving our services, and providing customer support.'
        },
        {
          section: 'Data Security',
          text: 'We employ enterprise-grade security measures including end-to-end encryption, blockchain technology for immutable records, multi-factor authentication, regular security audits, and compliance with international security standards.'
        }
      ]
    },
    dataCollection: {
      title: 'Data Collection & Usage',
      sections: [
        {
          title: 'Personal Information We Collect',
          items: [
            'Full legal name as it appears on official documents',
            'Date of birth and age verification',
            'Government-issued identification numbers',
            'Current and previous addresses',
            'Photographs and scanned copies of identity documents',
            'Biometric data for advanced verification (when applicable)'
          ]
        },
        {
          title: 'Technical Information',
          items: [
            'IP addresses and geolocation data',
            'Device information and browser details',
            'Usage patterns and service interactions',
            'System logs and error reports',
            'Performance metrics and analytics data'
          ]
        },
        {
          title: 'How We Use This Information',
          items: [
            'Verify your identity against official databases',
            'Detect and prevent fraudulent activities',
            'Comply with legal and regulatory requirements',
            'Improve our AI verification algorithms',
            'Provide customer support and service updates',
            'Generate anonymized analytics for service improvement'
          ]
        }
      ]
    },
    dataProtection: {
      title: 'Data Protection & Security',
      sections: [
        {
          title: 'Encryption & Storage',
          items: [
            'AES-256 encryption for all data at rest',
            'TLS 1.3 encryption for data in transit',
            'Blockchain-based immutable verification records',
            'Secure cloud infrastructure with redundancy',
            'Regular automated backups with encryption'
          ]
        },
        {
          title: 'Access Controls',
          items: [
            'Multi-factor authentication for all accounts',
            'Role-based access control for employees',
            'Regular access reviews and audits',
            'Secure API endpoints with rate limiting',
            'Zero-knowledge architecture where possible'
          ]
        },
        {
          title: 'Compliance & Certifications',
          items: [
            'GDPR compliance for European users',
            'CCPA compliance for California residents',
            'SOC 2 Type II certified infrastructure',
            'ISO 27001 information security management',
            'Regular third-party security assessments'
          ]
        }
      ]
    }
  };

  const termsOfServiceContent = {
    overview: {
      title: 'Terms of Service',
      lastUpdated: '2024-09-01',
      content: [
        {
          section: 'Acceptance of Terms',
          text: 'By accessing and using TrustNet services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using our services.'
        },
        {
          section: 'Service Description',
          text: 'TrustNet provides AI-powered identity verification services including document verification, fraud detection, and blockchain-based verification records. Our services are designed for individuals, businesses, and organizations requiring secure identity verification.'
        },
        {
          section: 'User Responsibilities',
          text: 'Users must provide accurate and truthful information, use services only for lawful purposes, maintain the security of their account credentials, and comply with all applicable laws and regulations.'
        },
        {
          section: 'Service Limitations',
          text: 'While we strive for high accuracy, verification results are not guaranteed to be 100% accurate. Users should not rely solely on our verification for critical decisions without additional verification measures.'
        }
      ]
    },
    userObligations: {
      title: 'User Rights & Obligations',
      sections: [
        {
          title: 'Your Rights',
          items: [
            'Right to access your personal data',
            'Right to correct inaccurate information',
            'Right to delete your data (subject to legal requirements)',
            'Right to data portability',
            'Right to object to certain data processing',
            'Right to withdraw consent at any time'
          ]
        },
        {
          title: 'Your Obligations',
          items: [
            'Provide accurate and truthful information',
            'Use services only for legitimate purposes',
            'Maintain confidentiality of account credentials',
            'Report any security incidents immediately',
            'Comply with all applicable laws and regulations',
            'Not attempt to circumvent security measures'
          ]
        },
        {
          title: 'Prohibited Activities',
          items: [
            'Submitting fraudulent or tampered documents',
            'Attempting to verify false identities',
            'Using services for illegal activities',
            'Sharing account access with unauthorized persons',
            'Attempting to reverse engineer our systems',
            'Violating intellectual property rights'
          ]
        }
      ]
    },
    liability: {
      title: 'Liability & Disclaimers',
      sections: [
        {
          title: 'Service Availability',
          items: [
            'Services are provided on an "as-is" and "as-available" basis',
            'We do not guarantee uninterrupted service availability',
            'Scheduled maintenance may temporarily affect services',
            'Emergency maintenance may occur without prior notice',
            'Service performance may vary based on external factors'
          ]
        },
        {
          title: 'Limitation of Liability',
          items: [
            'Our liability is limited to the amount paid for services',
            'We are not liable for indirect or consequential damages',
            'Users assume responsibility for their use of verification results',
            'We are not liable for decisions made based on our results',
            'Force majeure events are excluded from liability'
          ]
        },
        {
          title: 'Indemnification',
          items: [
            'Users agree to indemnify TrustNet against claims arising from their use',
            'Users are responsible for ensuring compliance with applicable laws',
            'Users must not use services in violation of third-party rights',
            'Users are liable for any damages caused by their misconduct'
          ]
        }
      ]
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <Box hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );

  const SectionContent = ({ sections }) => (
    <Box>
      {sections.map((section, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {section.title}
          </Typography>
          <List>
            {section.items.map((item, itemIndex) => (
              <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <PolicyIcon sx={{ fontSize: 40 }} />
          Legal & Privacy
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Our commitment to protecting your privacy and ensuring legal compliance
        </Typography>
      </Box>

      {/* Important Notice */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Important:</strong> These policies are legally binding agreements. 
          Please read them carefully and contact us if you have any questions.
        </Typography>
      </Alert>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Privacy Policy" />
            <Tab label="Data Collection" />
            <Tab label="Data Protection" />
            <Tab label="Terms of Service" />
            <Tab label="User Rights" />
            <Tab label="Liability" />
          </Tabs>
        </Box>

        {/* Privacy Policy Tab */}
        <TabPanel value={currentTab} index={0}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h5">{privacyPolicyContent.overview.title}</Typography>
              <Chip 
                label={`Last Updated: ${privacyPolicyContent.overview.lastUpdated}`} 
                color="primary" 
                size="small" 
              />
            </Box>
            
            {privacyPolicyContent.overview.content.map((item, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {item.section}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {item.text}
                </Typography>
                {index < privacyPolicyContent.overview.content.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </CardContent>
        </TabPanel>

        {/* Data Collection Tab */}
        <TabPanel value={currentTab} index={1}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <InfoIcon color="primary" />
              <Typography variant="h5">{privacyPolicyContent.dataCollection.title}</Typography>
            </Box>
            <SectionContent sections={privacyPolicyContent.dataCollection.sections} />
          </CardContent>
        </TabPanel>

        {/* Data Protection Tab */}
        <TabPanel value={currentTab} index={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <ShieldIcon color="primary" />
              <Typography variant="h5">{privacyPolicyContent.dataProtection.title}</Typography>
            </Box>
            <SectionContent sections={privacyPolicyContent.dataProtection.sections} />
          </CardContent>
        </TabPanel>

        {/* Terms of Service Tab */}
        <TabPanel value={currentTab} index={3}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <LegalIcon color="primary" />
              <Typography variant="h5">{termsOfServiceContent.overview.title}</Typography>
              <Chip 
                label={`Last Updated: ${termsOfServiceContent.overview.lastUpdated}`} 
                color="primary" 
                size="small" 
              />
            </Box>
            
            {termsOfServiceContent.overview.content.map((item, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {item.section}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {item.text}
                </Typography>
                {index < termsOfServiceContent.overview.content.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </CardContent>
        </TabPanel>

        {/* User Rights Tab */}
        <TabPanel value={currentTab} index={4}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <LockIcon color="primary" />
              <Typography variant="h5">{termsOfServiceContent.userObligations.title}</Typography>
            </Box>
            <SectionContent sections={termsOfServiceContent.userObligations.sections} />
          </CardContent>
        </TabPanel>

        {/* Liability Tab */}
        <TabPanel value={currentTab} index={5}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PolicyIcon color="primary" />
              <Typography variant="h5">{termsOfServiceContent.liability.title}</Typography>
            </Box>
            <SectionContent sections={termsOfServiceContent.liability.sections} />
          </CardContent>
        </TabPanel>
      </Card>

      {/* Contact Information */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Privacy Questions?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If you have any questions about our privacy practices or data handling, 
              please contact our Data Protection Officer:
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> privacy@trustnet.com<br/>
              <strong>Phone:</strong> +1 (555) 123-4567<br/>
              <strong>Mail:</strong> TrustNet Privacy Officer<br/>
              123 Innovation Drive, Suite 500<br/>
              San Francisco, CA 94105
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Legal Inquiries
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              For legal matters, terms clarification, or compliance questions, 
              please contact our Legal Department:
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> legal@trustnet.com<br/>
              <strong>Phone:</strong> +1 (555) 123-4568<br/>
              <strong>Response Time:</strong> 2-3 business days<br/>
              <strong>Compliance Issues:</strong> compliance@trustnet.com
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default PrivacyPolicy;