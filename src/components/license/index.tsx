import React, { useState, useEffect, useContext } from "react";
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
import LicenseContext from "../../LicenseContext";
import "./index.css"; // Importando o CSS para centralização

const License: React.FC = () => {
  const [license, setLicense] = useState("");
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const { setHasValidLicense } = useContext(LicenseContext)!; // Obtém o setter do contexto
  const navigate = useNavigate();

  useEffect(() => {
    const loadLicense = async () => {
      try {
        const result = await window.pyloid.LicenseStorageAPI.load_license();
        if (result.success && result.data.licenseValidation) {
          setLicense(result.data.licenseKey || "");
          setValidationResult(result.data.licenseValidation);

          const expirationDate = new Date(result.data.licenseValidation);
          const today = new Date();

          if (expirationDate >= today) {
            setHasValidLicense(true); // Atualiza o estado global
            navigate("/dashboard", { replace: true }); // Redireciona para o dashboard
          }
        }
      } catch (error) {
        console.error("Erro ao carregar a licença:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLicense();
  }, [navigate, setHasValidLicense]);

  const validateLicense = async () => {
    setIsValidating(true);
    try {
      const result = await window.pyloid.DecodeHash.decode_license(license);
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
          setHasValidLicense(true); // Atualiza o estado global
          navigate("/dashboard", { replace: true });
        }
      } else {
        const errorMessage = result.message || "Licença inválida ou expirada.";
        setValidationResult(errorMessage);
        await window.pyloid.LicenseStorageAPI.save_license("", "");
      }
    } catch (error) {
      console.error("Erro ao validar a licença:", error);
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
                : `Sua licença expirou em ${new Date(validationResult + "T00:00:00").toLocaleDateString(
                    "pt-BR",
                    { day: "2-digit", month: "long", year: "numeric" }
                  )}, contate o administrador do sistema`}
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default License;
