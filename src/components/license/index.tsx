import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const License: React.FC = () => {
  const [license, setLicense] = useState("");
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Adiciona controle de carregamento
  const navigate = useNavigate();

  const loadLicense = async () => {
    try {
      const result = await window.pyloid.LicenseStorageAPI.load_license();
      console.log("Carregando licença:", result);

      if (result.success && result.data.licenseValidation) {
        setLicense(result.data.licenseKey || "");
        setValidationResult(result.data.licenseValidation);

        // Redireciona para a Home se ainda não estiver nela
        if (window.location.pathname !== "/") {
          navigate("/", { replace: true });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar a licença:", error);
    } finally {
      setIsLoading(false); // Finaliza o carregamento
    }
  };

  useEffect(() => {
    loadLicense();
  }, []); // Executa apenas uma vez ao montar o componente

  const validateLicense = async () => {
    try {
      console.log("Validando licença:", license);
      const result = await window.pyloid.DecodeHash.decode_license(license);
      console.log("Resultado da validação:", result);

      if (result.success) {
        const validationMessage = `Licença válida! ID: ${result.id}, Data de Expiração: ${result.expirationDate}`;
        setValidationResult(validationMessage);

        // Salva os dados no sistema de arquivos
        const saveResult = await window.pyloid.LicenseStorageAPI.save_license(
          license,
          validationMessage
        );
        console.log("Resultado do salvamento:", saveResult);

        // Recarrega a licença para redirecionar
        loadLicense();
      } else {
        const errorMessage = result.message || "Licença inválida ou expirada.";
        setValidationResult(errorMessage);

        // Remove dados inválidos
        await window.pyloid.LicenseStorageAPI.save_license("", "");
      }
    } catch (error) {
      const errorMessage = "Erro ao comunicar com o backend.";
      setValidationResult(errorMessage);

      // Remove dados em caso de erro
      await window.pyloid.LicenseStorageAPI.save_license("", "");
      console.error("Erro durante a validação:", error);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>; // Exibe um carregador enquanto verifica a licença
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Validação de Licença</h1>
      <input
        type="text"
        value={license}
        onChange={(e) => setLicense(e.target.value)}
        placeholder="Digite sua licença"
        style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
      />
      <button
        onClick={validateLicense}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Validar Licença
      </button>
      {validationResult && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          {validationResult}
        </div>
      )}
    </div>
  );
};

export default License;
