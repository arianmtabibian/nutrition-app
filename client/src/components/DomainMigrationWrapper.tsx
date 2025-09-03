import React, { useState, useEffect } from 'react';
import { migrateUserData } from '../utils/domainMigration';
import LoadingSpinner from './ui/LoadingSpinner';

interface DomainMigrationWrapperProps {
  children: React.ReactNode;
}

const DomainMigrationWrapper: React.FC<DomainMigrationWrapperProps> = ({ children }) => {
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  useEffect(() => {
    const performMigration = async () => {
      try {
        console.log('🔄 Domain migration starting...');
        const result = await migrateUserData();
        console.log('✅ Domain migration completed:', result);
        setMigrationComplete(true);
      } catch (error) {
        console.error('❌ Domain migration failed:', error);
        setMigrationError('Domain migration failed, but continuing...');
        setMigrationComplete(true);
      }
    };

    performMigration();
  }, []);

  if (!migrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Checking domain configuration...</p>
          <p className="text-sm text-gray-500">This ensures you stay logged in across deployments</p>
        </div>
      </div>
    );
  }

  if (migrationError) {
    console.warn('Migration warning:', migrationError);
  }

  return <>{children}</>;
};

export default DomainMigrationWrapper;
