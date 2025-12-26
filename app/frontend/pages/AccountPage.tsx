import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card overflow-hidden">
        <div className="p-8 border-b border-gray-border-light bg-gray-light">
          <h1 className="m-0 mb-2 text-gray-dark text-2xl font-semibold">Account Information</h1>
          <p className="m-0 text-gray-text text-base">Manage your account settings and information</p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="m-0 mb-4 text-gray-dark text-xl font-semibold">User Details</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-text">User ID</label>
                <span className="text-base text-gray-dark font-medium">#{user?.id}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-text">Authentication Method</label>
                <span className="text-base text-gray-dark font-medium">WebAuthn Passkey</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="m-0 mb-4 text-gray-dark text-xl font-semibold">Security</h2>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 p-6 bg-gray-light rounded-lg border border-gray-border-light sm:flex-row flex-col sm:text-left text-center">
                <div className="text-4xl shrink-0 sm:self-start self-center">🔐</div>
                <div>
                  <h3 className="m-0 mb-2 text-gray-dark text-lg font-semibold">Passkey Authentication</h3>
                  <p className="m-0 text-gray-text leading-relaxed">
                    Your account is secured with WebAuthn Passkeys, providing
                    passwordless authentication that's both secure and convenient.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-6 bg-gray-light rounded-lg border border-gray-border-light sm:flex-row flex-col sm:text-left text-center">
                <div className="text-4xl shrink-0 sm:self-start self-center">🛡️</div>
                <div>
                  <h3 className="m-0 mb-2 text-gray-dark text-lg font-semibold">Data Protection</h3>
                  <p className="m-0 text-gray-text leading-relaxed">
                    Your todos are private and only accessible to you.
                    All data is encrypted and securely stored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
