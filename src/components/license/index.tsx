import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import './index.css';  // Importando o CSS para centralização

const License: React.FC = () => {
  const [license, setLicense] = useState("");
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadLicense = async () => {
      try {
        const result = await window.pyloid.LicenseStorageAPI.load_license();
        console.log("Carregando licença:", result);

        if (result.success && result.data.licenseValidation) {
          setLicense(result.data.licenseKey || "");
          setValidationResult(result.data.licenseValidation);

          // Verifica se a rota atual é diferente de `/license`
          if (window.location.pathname !== "/license") {
            const expirationDate = new Date(result.data.licenseValidation);
            const today = new Date();

            if (expirationDate >= today) {
              // Redireciona apenas se a licença for válida e a rota não for `/license`
              navigate("/", { replace: true });
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar a licença:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLicense();
  }, []);

  const validateLicense = async () => {
    setIsValidating(true);
    try {
      console.log("Validando licença:", license);
      const result = await window.pyloid.DecodeHash.decode_license(license);
      console.log("Resultado da validação:", result);

      if (result.success) {
        const validationMessage = `${result.expirationDate}`;
        setValidationResult(validationMessage);

        await window.pyloid.LicenseStorageAPI.save_license(
          license,
          validationMessage
        );

        const expirationDate = new Date(result.expirationDate);
        const today = new Date();

        if (expirationDate >= today) {
          navigate("/", { replace: true });
        }
      } else {
        const errorMessage = result.message || "Licença inválida ou expirada.";
        setValidationResult(errorMessage);
        await window.pyloid.LicenseStorageAPI.save_license("", "");
      }
    } catch (error) {
      const errorMessage = "Erro ao comunicar com o backend.";
      setValidationResult(errorMessage);
      await window.pyloid.LicenseStorageAPI.save_license("", "");
      console.error("Erro durante a validação:", error);
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) {
    return (
      <Container fluid className="license-container">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="license-container">
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={4} className="bg-light p-4 rounded shadow">
          <h1 className="text-center mb-4">Validação de Licença</h1>
          <Form>
            <Form.Group controlId="licenseInput">
              <Form.Label>Digite sua licença</Form.Label>
              <Form.Control
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="Digite sua licença aqui"
              />
            </Form.Group>
            <div className="d-grid gap-2 mt-3">
              <Button
                variant="primary"
                onClick={validateLicense}
                disabled={isValidating || !license.trim()}
              >
                {isValidating ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Validar Licença"
                )}
              </Button>
            </div>
          </Form>
          {validationResult && (
            <Alert
              className="mt-4"
              variant={validationResult.includes("válida") ? "success" : "danger"}
            >
              {validationResult.includes("válida")
                ? "Licença válida"
                : `Sua licença expirou em ${new Date(validationResult + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}, contate o administrador do sistema`}
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default License;
