import React, { useState } from 'react';
import './RequestAccessModal.css';

const cardGradient = 'linear-gradient(135deg, #1a3f4a 0%, #2d5a63 50%, #3d7a8f 100%)';
const accentColor = '#438b98';

const RequestAccessModal = ({ isOpen, onClose, document, verifierEmail, userEmail }) => {
  const [accessType, setAccessType] = useState('FULL');
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error

  if (!isOpen) return null;

  const toggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const sendRequest = async () => {
    setLoading(true);
    setStatus('idle');

    // 1. Get Password & Create Auth Header
    const password = sessionStorage.getItem('temp_pass');
    const authHeader = 'Basic ' + btoa(`${verifierEmail}:${password}`);

    // 2. Determine allowedFields based on selection
    let fieldsToSend = "ALL"; // Default for FULL
    if (accessType === 'REDACTED') {
        fieldsToSend = selectedFields.join(',');
    // 👇 CHANGED: Updated to flow with the new Enrollment ZKP module
    } else if (accessType === 'ZKP') {
        fieldsToSend = "ENROLLMENT_CHECK_ONLY"; // Special flag for ZKP
    }

    const payload = {
      verifierEmail,
      userEmail,
      documentId: document?.id,
      accessType,
      allowedFields: fieldsToSend
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Fake nice delay

      const response = await fetch('http://localhost:8080/api/verifier/request-access', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => { onClose(); setStatus('idle'); }, 2000);
      } else {
        console.error("Server Error:", response.status);
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className={`modal-container ${status === 'success' ? 'celebrate' : ''}`}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="icon-badge">🔐</div>
          <div>
            <h3>Request Access</h3>
            <span className="subtitle">to {document?.documentType || "Document"}</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="instruction-text">How would you like to view this credential?</p>
          
          {/* 👇 UPDATED GRID: Now holds 3 Cards */}
          <div className="selection-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            
            {/* Option 1: Full View */}
            <div 
              className={`option-card ${accessType === 'FULL' ? 'active' : ''}`}
              onClick={() => setAccessType('FULL')}
            >
              <div className="card-icon">👁️</div>
              <div className="card-info">
                <h4>Full View</h4>
                <p>See original document.</p>
              </div>
              <div className="check-circle"></div>
            </div>

            {/* Option 2: Redacted */}
            <div 
              className={`option-card ${accessType === 'REDACTED' ? 'active' : ''}`}
              onClick={() => setAccessType('REDACTED')}
            >
              <div className="card-icon">✂️</div>
              <div className="card-info">
                <h4>Redacted</h4>
                <p>Select specific fields.</p>
              </div>
              <div className="check-circle"></div>
            </div>

            {/* 👇 CHANGED: Updated Option 3 to ZK Enrollment Proof */}
            <div 
              className={`option-card ${accessType === 'ZKP' ? 'active' : ''}`}
              onClick={() => setAccessType('ZKP')}
            >
              <div className="card-icon">🎓</div>
              <div className="card-info">
                <h4>ZK Proof</h4>
                <p>Verify enrollment status.</p>
              </div>
              <div className="check-circle"></div>
            </div>

          </div>

          {/* Redaction Area (Only visible if Redacted selected) */}
          <div className={`redaction-area ${accessType === 'REDACTED' ? 'open' : ''}`}>
            <p className="mini-label">TAP TO SELECT FIELDS:</p>
            <div className="chip-container">
              {['Name', 'Date of Birth', 'Reg No', 'Photo', 'Address'].map((field) => (
                <button 
                  key={field}
                  className={`chip ${selectedFields.includes(field) ? 'selected' : ''}`}
                  onClick={() => toggleField(field)}
                >
                  {selectedFields.includes(field) ? '✓ ' : '+ '} {field}
                </button>
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {status === 'success' && <div className="status-banner success">🎉 Request Sent Successfully!</div>}
          {status === 'error' && <div className="status-banner error">⚠️ Authorization Failed or Server Error.</div>}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            className={`btn-primary ${loading ? 'loading' : ''}`} 
            onClick={sendRequest}
            disabled={loading}
          >
            {loading ? 'Sending 🚀' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestAccessModal;