import { useContext } from "react";
import LicenseContext from "./LicenseContext";

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
};
