import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  ProgressBar,
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
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProcess, setActiveProcess] = useState<
    "processFiles" | "convertExcelToSped" | null
  >(null);
  useEffect(() => {
    console.log("window.pyloid:", window.pyloid);
    console.log("window.pyloid?.emitter:", window.pyloid?.emitter);

    if (window.pyloid?.emitter) { // Verificação crucial
        // ... (adicionar os listeners aqui)
    } else {
        console.error("Emitter não está disponível!");
    }

    // ... (resto do useEffect)
}, []);
  useEffect(() => {
    const handleProgress = (progress) => {
      setProgress(progress);
    };

    const handleFinished = (event) => {
      console.log("Evento Finished Recebido:", event);
      setProcessingMessage(event.message || "Processo finalizado!");
      setIsProcessing(false); // Desativa o spinner
      setActiveProcess(null);
    };

    const handleError = (event) => {
      console.error("Evento de Erro:", event);
      setProcessingMessage(event.message || "Erro no processamento.");
      setIsProcessing(false);
      setActiveProcess(null);
    };

    window.pyloid?.emitter?.on("progress", handleProgress);
    window.pyloid?.emitter?.on("finished", handleFinished);
    window.pyloid?.emitter?.on("error", handleError);

    return () => {
      window.pyloid?.emitter?.off("progress", handleProgress);
      window.pyloid?.emitter?.off("finished", handleFinished);
      window.pyloid?.emitter?.off("error", handleError);
    };
  }, []);

  const selectFiles = async () => {
    try {
      const selectedFiles =
        await window.pyloid.CustomAPI.select_multiple_files();
      if (selectedFiles.length > 0) {
        setSelectedFilesMessage(
          `${selectedFiles.length} arquivo(s) selecionado(s).`
        );
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

  const fetchAvailableRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await window.pyloid.CustomAPI.get_columns();
      if (response.success) {
        setAvailableRecords(response.recordNumbers);
      } else {
        setProcessingMessage(response.message);
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

  const toggleSelectAllRecords = () => {
    if (selectedRecords.length === availableRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(availableRecords);
    }
  };

  const processFiles = async () => {
    if (!excelFileName || selectedRecords.length === 0) {
      setProcessingMessage(
        "O nome do arquivo Excel e os números dos registros são obrigatórios."
      );
      return;
    }

    try {
      setIsProcessing(true);
      setActiveProcess("processFiles");
      setProgress(0);
      setProcessingMessage("");
      const response = await window.pyloid.CustomAPI.process_files_with_thread(
        excelFileName,
        selectedRecords.join(","),
        [],
        false // Alterar se necessário
      );

      if (!response.success) {
        setProcessingMessage(response.message);
        setIsProcessing(false);
        setActiveProcess(null);
      }
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
      setIsProcessing(false);
      setActiveProcess(null);
    }
  };

  const convertExcelToSped = async () => {
    if (!excelFileName) {
      setProcessingMessage(
        "Por favor, insira o nome do arquivo Excel para conversão."
      );
      return;
    }

    try {
      setIsProcessing(true);
      setActiveProcess("convertExcelToSped");
      setProgress(0);
      setProcessingMessage("");
      const response = await window.pyloid.CustomAPI.convert_excel_to_sped(
        `${excelFileName}.xlsx`
      );

      if (!response.success) {
        setProcessingMessage(response.message);
        setIsProcessing(false);
        setActiveProcess(null);
      }
    } catch (error) {
      console.error("Erro ao converter Excel para SPED:", error);
      setIsProcessing(false);
      setActiveProcess(null);
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
                    onClick={fetchAvailableRecords}
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
                        Carregando Registros...
                      </>
                    ) : (
                      "Carregar Registros"
                    )}
                  </Button>
                </Form.Group>

                {availableRecords.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <Form.Check
                        type="checkbox"
                        label="Selecionar Todos"
                        checked={
                          selectedRecords.length === availableRecords.length
                        }
                        onChange={toggleSelectAllRecords}
                      />
                    </Form.Label>
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

                <div className="d-grid gap-2 mb-3">
                  <Button
                    variant="success"
                    onClick={processFiles}
                    disabled={
                      isProcessing || activeProcess === "convertExcelToSped"
                    }
                  >
                    {isProcessing && activeProcess === "processFiles" ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      "Processar Arquivos"
                    )}
                  </Button>
                </div>

                <div className="d-grid">
                  <Button
                    variant="warning"
                    onClick={convertExcelToSped}
                    disabled={isProcessing || activeProcess === "processFiles"}
                  >
                    {activeProcess === "convertExcelToSped" ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      "Converter Excel para SPED"
                    )}
                  </Button>
                </div>

                {isProcessing && (
                  <div className="mt-3">
                    <ProgressBar now={progress} label={`${progress}%`} />
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Speed;
