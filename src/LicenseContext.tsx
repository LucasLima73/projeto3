import React, { createContext, useState, useEffect, ReactNode } from "react";

// Tipos do Contexto
interface LicenseContextType {
  hasValidLicense: boolean;
  isLoading: boolean;
  setHasValidLicense: (isValid: boolean) => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasValidLicense, setHasValidLicense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLicense = async () => {
      try {
        const result = await window.pyloid.LicenseStorageAPI.load_license();
        if (result.success && result.data.licenseValidation) {
          setHasValidLicense(true);
        } else {
          setHasValidLicense(false);
        }
      } catch (error) {
        console.error("Erro ao carregar a licença:", error);
        setHasValidLicense(false);
      } finally {
        setIsLoading(false); // Marca o carregamento como concluído
      }
    };
    loadLicense();
  }, []);

  return (
    <LicenseContext.Provider value={{ hasValidLicense, isLoading, setHasValidLicense }}>
      {children}
    </LicenseContext.Provider>
  );
};

export default LicenseContext;
