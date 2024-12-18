import React, { useState } from "react";
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

interface SheetData {
  file: string;
  sheets: string[];
}

const SpreadsheetProcessor: React.FC = () => {
  const [sheet1, setSheet1] = useState<SheetData | null>(null);
  const [sheet2, setSheet2] = useState<SheetData | null>(null);
  const [columns1, setColumns1] = useState<string[]>([]);
  const [columns2, setColumns2] = useState<string[]>([]);
  const [selectedSheet1, setSelectedSheet1] = useState("");
  const [selectedSheet2, setSelectedSheet2] = useState("");
  const [selectedColumn1, setSelectedColumn1] = useState("");
  const [selectedColumn2, setSelectedColumn2] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectFile = async (fileIndex: number) => {
    try {
      const response = await window.pyloid.SpreadsheetProcessingAPI.select_file(
        fileIndex
      );
      if (!response.startsWith(`Arquivo ${fileIndex + 1} selecionado`)) {
        setErrorMessage(response);
        return;
      }

      const sheetData =
        await window.pyloid.SpreadsheetProcessingAPI.load_sheet_names(
          fileIndex
        );
      if (sheetData.error) {
        setErrorMessage(sheetData.error);
        return;
      }

      if (fileIndex === 0) {
        setSheet1(sheetData);
      } else {
        setSheet2(sheetData);
      }
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        "Erro ao selecionar arquivo: " + (error as Error).message
      );
    }
  };

  const loadColumns = async (fileIndex: number, sheetName: string) => {
    try {
      const response =
        await window.pyloid.SpreadsheetProcessingAPI.load_columns(
          fileIndex,
          sheetName
        );
      if (fileIndex === 0) {
        setColumns1(response);
      } else {
        setColumns2(response);
      }
    } catch {
      setErrorMessage("Erro ao carregar colunas.");
    }
  };

  const processFiles = async () => {
    try {
      const savePath = await window.pyloid.SpreadsheetProcessingAPI.save_file();
      if (!savePath) {
        setErrorMessage("Operação cancelada pelo usuário.");
        return;
      }

      const response =
        await window.pyloid.SpreadsheetProcessingAPI.process_cross_reference(
          [selectedSheet1, selectedSheet2],
          [selectedColumn1, selectedColumn2],
          savePath
        );

      setSuccessMessage(response);
      setErrorMessage("");
    } catch {
      setErrorMessage("Erro ao processar arquivos.");
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col md={12}>
          <h2 className="text-center mb-4">Processador de Planilhas</h2>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
        </Col>

        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Selecionar Arquivo 1</Card.Title>
              <Button variant="primary" onClick={() => selectFile(0)}>
                Escolher Arquivo
              </Button>

              {sheet1 && (
                <Form.Group className="mt-3">
                  <Form.Label>Selecione uma Aba</Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      setSelectedSheet1(e.target.value);
                      loadColumns(0, e.target.value);
                    }}
                  >
                    <option value="">Selecione...</option>
                    {sheet1.sheets.map((sheetName) => (
                      <option key={sheetName} value={sheetName}>
                        {sheetName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {columns1.length > 0 && (
                <Form.Group className="mt-3">
                  <Form.Label>Colunas do Arquivo 1</Form.Label>
                  <Form.Select
                    onChange={(e) => setSelectedColumn1(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {columns1.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Selecionar Arquivo 2</Card.Title>
              <Button variant="primary" onClick={() => selectFile(1)}>
                Escolher Arquivo
              </Button>

              {sheet2 && (
                <Form.Group className="mt-3">
                  <Form.Label>Selecione uma Aba</Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      setSelectedSheet2(e.target.value);
                      loadColumns(1, e.target.value);
                    }}
                  >
                    <option value="">Selecione...</option>
                    {sheet2.sheets.map((sheetName) => (
                      <option key={sheetName} value={sheetName}>
                        {sheetName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {columns2.length > 0 && (
                <Form.Group className="mt-3">
                  <Form.Label>Colunas do Arquivo 2</Form.Label>
                  <Form.Select
                    onChange={(e) => setSelectedColumn2(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {columns2.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} className="text-center">
          {selectedColumn1 && selectedColumn2 && (
            <Button variant="success" size="lg" onClick={processFiles}>
              Processar Arquivos
            </Button>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SpreadsheetProcessor;
