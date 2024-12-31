import React, { createContext, useState, useEffect, ReactNode } from "react";

// Tipos do Contexto
interface LicenseContextType {
  hasValidLicense: boolean;
  setHasValidLicense: (isValid: boolean) => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasValidLicense, setHasValidLicense] = useState(false);

  useEffect(() => {
    const loadLicense = async () => {
      const result = await window.pyloid.LicenseStorageAPI.load_license();
      if (result.success && result.data.licenseValidation) {
        setHasValidLicense(true);
      } else {
        setHasValidLicense(false);
      }
    };
    loadLicense();
  }, []);

  return (
    <LicenseContext.Provider value={{ hasValidLicense, setHasValidLicense }}>
      {children}
    </LicenseContext.Provider>
  );
};

export default LicenseContext;
