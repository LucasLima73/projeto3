import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import "./index.css";

const Speed = () => {
  const [selectedFilesMessage, setSelectedFilesMessage] = useState("");
  const [selectedDirectoryMessage, setSelectedDirectoryMessage] = useState("");
  const [excelFileName, setExcelFileName] = useState("");
  const [availableRecords, setAvailableRecords] = useState<string[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [relateC100C170, setRelateC100C170] = useState(false);

  const selectFiles = async () => {
    try {
      const selectedFiles =
        await window.pyloid.CustomAPI.select_multiple_files();
      if (selectedFiles.length > 0) {
        console.log("Arquivos selecionados:", selectedFiles);
        setSelectedFilesMessage(
          `${selectedFiles.length} arquivo(s) selecionado(s).`
        );
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

  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await window.pyloid.CustomAPI.get_columns();
      if (response.success) {
        setAvailableRecords(response.recordNumbers);
      } else {
        console.error(response.message);
      }
    } catch (error) {
      console.error("Erro ao buscar números de registro:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const toggleRecordSelection = (record: string) => {
    setSelectedRecords((prev) =>
      prev.includes(record)
        ? prev.filter((r) => r !== record)
        : [...prev, record]
    );
  };

  const processSpedToExcel = async () => {
    if (!excelFileName || selectedRecords.length === 0) {
      setProcessingMessage(
        "O nome do arquivo Excel e os números dos registros são obrigatórios."
      );
      return;
    }
    try {
      const response = await window.pyloid.CustomAPI.process_files(
        excelFileName,
        selectedRecords.join(","),
        [],
        relateC100C170
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
                  <Button
                    variant="info"
                    onClick={fetchRecords}
                    disabled={loadingRecords}
                  >
                    {loadingRecords ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        Carregando...
                      </>
                    ) : (
                      "Detectar Números de Registro"
                    )}
                  </Button>
                </Form.Group>

                {availableRecords.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Selecione os Números de Registro</Form.Label>
                    <div
                      style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        padding: "10px",
                        borderRadius: "5px",
                      }}
                    >
                      {availableRecords.map((record, index) => (
                        <Form.Check
                          key={index}
                          type="checkbox"
                          label={`Registro: ${record}`}
                          value={record}
                          checked={selectedRecords.includes(record)}
                          onChange={() => toggleRecordSelection(record)}
                        />
                      ))}
                    </div>
                  </Form.Group>
                )}

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
                  <Form.Check
                    type="checkbox"
                    label="Relacionar registros C100 e C170"
                    checked={relateC100C170}
                    onChange={(e) => setRelateC100C170(e.target.checked)}
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
