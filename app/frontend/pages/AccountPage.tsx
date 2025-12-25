import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <h1>Account Information</h1>
          <p>Manage your account settings and information</p>
        </div>

        <div className="account-content">
          <div className="info-section">
            <h2>User Details</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>User ID</label>
                <span className="info-value">#{user?.id}</span>
              </div>
              <div className="info-item">
                <label>Authentication Method</label>
                <span className="info-value">WebAuthn Passkey</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2>Security</h2>
            <div className="security-info">
              <div className="security-item">
                <div className="security-icon">🔐</div>
                <div className="security-content">
                  <h3>Passkey Authentication</h3>
                  <p>
                    Your account is secured with WebAuthn Passkeys, providing 
                    passwordless authentication that's both secure and convenient.
                  </p>
                </div>
              </div>
              <div className="security-item">
                <div className="security-icon">🛡️</div>
                <div className="security-content">
                  <h3>Data Protection</h3>
                  <p>
                    Your todos are private and only accessible to you. 
                    All data is encrypted and securely stored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .account-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .account-container {
          background: white;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
          overflow: hidden;
        }

        .account-header {
          padding: 2rem;
          border-bottom: 1px solid #e1e5e9;
          background: #f6f8fa;
        }

        .account-header h1 {
          margin: 0 0 0.5rem 0;
          color: #24292f;
          font-size: 1.75rem;
          font-weight: 600;
        }

        .account-header p {
          margin: 0;
          color: #656d76;
          font-size: 1rem;
        }

        .account-content {
          padding: 2rem;
        }

        .info-section {
          margin-bottom: 2rem;
        }

        .info-section:last-child {
          margin-bottom: 0;
        }

        .info-section h2 {
          margin: 0 0 1rem 0;
          color: #24292f;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-item label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #656d76;
        }

        .info-value {
          font-size: 1rem;
          color: #24292f;
          font-weight: 500;
        }

        .security-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .security-item {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: #f6f8fa;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .security-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .security-content h3 {
          margin: 0 0 0.5rem 0;
          color: #24292f;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .security-content p {
          margin: 0;
          color: #656d76;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .account-header,
          .account-content {
            padding: 1.5rem;
          }

          .security-item {
            flex-direction: column;
            text-align: center;
          }

          .security-icon {
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
}