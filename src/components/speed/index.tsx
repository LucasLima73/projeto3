import { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Alert } from "react-bootstrap";
import "./index.css";

const Speed = () => {
  const [selectedFilesMessage, setSelectedFilesMessage] = useState("");
  const [selectedDirectoryMessage, setSelectedDirectoryMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [recordNumbers, setRecordNumbers] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");

  const selectFiles = async () => {
    try {
      const response = await window.pyloid.CustomAPI.select_files();
      setSelectedFilesMessage(response.message);
    } catch (error) {
      console.error("Erro ao selecionar arquivos:", error);
    }
  };

  const selectDirectory = async () => {
    try {
      const response = await window.pyloid.CustomAPI.select_directory();
      setSelectedDirectoryMessage(response.message);
    } catch (error) {
      console.error("Erro ao selecionar diretório:", error);
    }
  };

  const processFiles = async () => {
    if (!fileName || !recordNumbers) {
      setProcessingMessage("O nome do arquivo e os números dos registros são obrigatórios.");
      return;
    }
    try {
      const response = await window.pyloid.CustomAPI.process_files(fileName, recordNumbers);
      setProcessingMessage(response.message);
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
    }
  };

  return (
    <Container className="speed-container">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="mt-4">
            <Card.Body>
              <Card.Title className="text-center">Processamento de Arquivos SPED</Card.Title>
              <hr />
              {processingMessage && (
                <Alert variant={processingMessage.includes("Erro") ? "danger" : "success"}>
                  {processingMessage}
                </Alert>
              )}
              <Form>
                <Form.Group className="mb-3">
                  <Button variant="primary" onClick={selectFiles}>
                    Selecionar Arquivos
                  </Button>
                  {selectedFilesMessage && <Form.Text>{selectedFilesMessage}</Form.Text>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Button variant="secondary" onClick={selectDirectory}>
                    Selecionar Diretório
                  </Button>
                  {selectedDirectoryMessage && <Form.Text>{selectedDirectoryMessage}</Form.Text>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nome do Arquivo de Saída</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Digite o nome do arquivo"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Números dos Registros (separados por vírgula)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Exemplo: 001, 002, 003"
                    value={recordNumbers}
                    onChange={(e) => setRecordNumbers(e.target.value)}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="success" size="lg" onClick={processFiles}>
                    Iniciar Processamento
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Speed;
