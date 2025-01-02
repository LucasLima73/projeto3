/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
} from "react-bootstrap";
import "./index.css";

const Speed = () => {
  const [selectedFilesMessage, setSelectedFilesMessage] = useState("");
  const [selectedDirectoryMessage, setSelectedDirectoryMessage] = useState("");
  const [excelFileName, setExcelFileName] = useState("");
  const [recordNumbers, setRecordNumbers] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");

  const selectFiles = async () => {
    try {
      const selectedFiles =
        await window.pyloid.CustomAPI.select_multiple_files();
      if (selectedFiles.length > 0) {
        console.log("Arquivos selecionados:", selectedFiles);
        // Atualize o estado ou a interface conforme necessário
      } else {
        console.log("Nenhum arquivo foi selecionado.");
      }
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

  const processSpedToExcel = async () => {
    if (!excelFileName || !recordNumbers) {
      setProcessingMessage(
        "O nome do arquivo Excel e os números dos registros são obrigatórios."
      );
      return;
    }
    try {
      const response = await window.pyloid.CustomAPI.process_files(
        excelFileName,
        recordNumbers
      );
      setProcessingMessage(response.message);
    } catch (error) {
      console.error("Erro ao processar arquivos SPED para Excel:", error);
    }
  };

  const convertExcelToSped = async () => {
    if (!excelFileName) {
      setProcessingMessage(
        "Por favor, selecione o arquivo Excel para conversão."
      );
      return;
    }
    try {
      const addName = excelFileName + ".xlsx";
      const response = await window.pyloid.CustomAPI.convert_excel_to_sped(
        addName
      );
      setProcessingMessage(response.message);
    } catch (error) {
      console.error("Erro ao converter Excel para SPED:", error);
      setProcessingMessage("Erro ao converter Excel para SPED.");
    }
  };
  

  return (
    <Container className="speed-container">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="mt-4">
            <Card.Body>
              <Card.Title className="text-center">
                Conversor SPED ↔ Excel
              </Card.Title>
              <hr />
              {processingMessage && (
                <Alert
                  variant={
                    processingMessage.includes("Erro") ? "danger" : "success"
                  }
                >
                  {processingMessage}
                </Alert>
              )}
              <Form>
                <Form.Group className="mb-3">
                  <Button variant="primary" onClick={selectFiles}>
                    Selecionar Arquivos SPED
                  </Button>
                  {selectedFilesMessage && (
                    <Form.Text>{selectedFilesMessage}</Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Button variant="secondary" onClick={selectDirectory}>
                    Selecionar Diretório de Salvamento
                  </Button>
                  {selectedDirectoryMessage && (
                    <Form.Text>{selectedDirectoryMessage}</Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nome do Arquivo Excel de Saída</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Digite o nome do arquivo Excel"
                    value={excelFileName}
                    onChange={(e) => setExcelFileName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Números dos Registros (separados por vírgula)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Exemplo: 001, 002, 003"
                    value={recordNumbers}
                    onChange={(e) => setRecordNumbers(e.target.value)}
                  />
                </Form.Group>

                <div className="d-grid gap-2 mb-3">
                  <Button variant="success" onClick={processSpedToExcel}>
                    Converter SPED para Excel
                  </Button>
                </div>

                <div className="d-grid">
                  <Button variant="warning" onClick={convertExcelToSped}>
                    Converter Excel para SPED
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
