import React, { useState } from 'react';
import './RequestAccessModal.css';

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

    // --- FIX STARTS HERE ---
    // 1. Get Password from Session Storage (just like the Dashboard does)
    const password = sessionStorage.getItem('temp_pass');
    
    // 2. Create the Auth Header
    const authHeader = 'Basic ' + btoa(`${verifierEmail}:${password}`);
    // --- FIX ENDS HERE ---

    const payload = {
      verifierEmail,
      userEmail,
      documentId: document?.id,
      accessType,
      allowedFields: accessType === 'REDACTED' ? selectedFields.join(',') : "ALL"
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = await fetch('http://localhost:8080/api/verifier/request-access', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader // <--- THIS WAS MISSING
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
          
          <div className="selection-grid">
            <div 
              className={`option-card ${accessType === 'FULL' ? 'active' : ''}`}
              onClick={() => setAccessType('FULL')}
            >
              <div className="card-icon">👁️</div>
              <div className="card-info">
                <h4>Full View</h4>
                <p>See the entire original document.</p>
              </div>
              <div className="check-circle"></div>
            </div>

            <div 
              className={`option-card ${accessType === 'REDACTED' ? 'active' : ''}`}
              onClick={() => setAccessType('REDACTED')}
            >
              <div className="card-icon">✂️</div>
              <div className="card-info">
                <h4>Redacted</h4>
                <p>Hide sensitive info, request specific fields.</p>
              </div>
              <div className="check-circle"></div>
            </div>
          </div>

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