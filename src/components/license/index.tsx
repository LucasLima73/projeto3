import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { decodeLicense } from "../../utils/licenseUtils";

const License: React.FC = () => {
  const [license, setLicense] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateLicense = () => {
    console.log("Licença recebida:", license);

    const decoded = decodeLicense(license);
    console.log("Decodificação da licença:", decoded);

    if (!decoded || !decoded.expirationDate) {
      setError("Licença inválida ou corrompida.");
      return;
    }

    const today = new Date();
    const expirationDate = new Date(decoded.expirationDate);

    console.log("Hoje:", today.toISOString());
    console.log("Data de expiração:", expirationDate.toISOString());

    if (expirationDate.getTime() < today.getTime()) {
      setError("Licença expirada. Contate o administrador do sistema.");
    } else {
      // Salvar a data de expiração no localStorage
      localStorage.setItem("licenseExpirationDate", decoded.expirationDate);
      console.log("Licença válida. Redirecionando para a página Home...");

      // Redirecionar para a página Home
      navigate("/");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Validação de Licença</h1>
      <div>
        <label>Insira sua licença:</label>
        <input
          type="text"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          placeholder="Digite a licença aqui"
          style={{
            width: "100%",
            padding: "8px",
            margin: "10px 0",
            fontSize: "16px",
          }}
        />
        <button
          onClick={validateLicense}
          style={{ padding: "10px 20px", fontSize: "16px" }}
        >
          Validar Licença
        </button>
      </div>
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <strong>{error}</strong>
        </div>
      )}
    </div>
  );
};

export default License;
