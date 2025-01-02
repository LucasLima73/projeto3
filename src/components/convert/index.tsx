import React, { useState } from "react";
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

const Convert: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [outputDirectory, setOutputDirectory] = useState<string>("");
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentConversion, setCurrentConversion] = useState<"txtToExcel" | "excelToTxt" | null>(null);
  const [fileType, setFileType] = useState<"txt" | "excel" | null>(null);

  const handleFileSelect = async (type: "txt" | "excel") => {
    try {
      const files = await window.pyloid.CustomAPI.select_multiple_files_convert(
        type === "txt" ? "txt" : "excel" // Passa o tipo de arquivo ao backend
      );
      if (files.length > 0) {
        setSelectedFiles(files);
        setFileType(type);
        setProcessingMessage(`${files.length} arquivo(s) selecionado(s).`);
      } else {
        setProcessingMessage("Nenhum arquivo foi selecionado.");
      }
    } catch (error) {
      console.error(`Erro ao selecionar arquivos ${type}:`, error);
      setProcessingMessage("Erro ao selecionar arquivos.");
    }
  };
  

  const handleDirectorySelect = async () => {
    try {
      const directory = await window.pyloid.CustomAPI.select_directory_convert();
      if (directory) {
        setOutputDirectory(directory);
        setProcessingMessage("Diretório de salvamento selecionado.");
      } else {
        setProcessingMessage("Nenhum diretório foi selecionado.");
      }
    } catch (error) {
      console.error("Erro ao selecionar diretório:", error);
      setProcessingMessage("Erro ao selecionar diretório.");
    }
  };

  const convertFiles = (conversionType: "txtToExcel" | "excelToTxt") => {
    if (selectedFiles.length === 0 || !outputDirectory) {
      setProcessingMessage(
        "Por favor, selecione os arquivos e o diretório de salvamento."
      );
      return;
    }

    setLoading(true);
    setCurrentConversion(conversionType);

    // Usando `setTimeout` para permitir a atualização da interface
    setTimeout(async () => {
      try {
        const response =
          conversionType === "txtToExcel"
            ? await window.pyloid.CustomAPI.convert_txt_to_excel_bulk()
            : await window.pyloid.CustomAPI.convert_excel_to_txt_bulk();

        setProcessingMessage(response.message);
      } catch (error) {
        console.error("Erro ao converter arquivos:", error);
        setProcessingMessage("Erro durante a conversão.");
      } finally {
        setLoading(false);
        setCurrentConversion(null);
      }
    }, 3); // Executa a função de forma não bloqueante
  };

  return (
    <Container className="convert-container">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="mt-4">
            <Card.Body>
              <Card.Title className="text-center">
                Conversor de Arquivos
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
                  <Button
                    variant="primary"
                    onClick={() => handleFileSelect("txt")}
                  >
                    Selecionar Arquivo(s) TXT
                  </Button>
                  {fileType === "txt" && selectedFiles.length > 0 && (
                    <Form.Text className="d-block">
                      {selectedFiles.length} arquivo(s) TXT selecionado(s).
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleFileSelect("excel")}
                  >
                    Selecionar Arquivo(s) Excel
                  </Button>
                  {fileType === "excel" && selectedFiles.length > 0 && (
                    <Form.Text className="d-block">
                      {selectedFiles.length} arquivo(s) Excel selecionado(s).
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Button variant="info" onClick={handleDirectorySelect}>
                    Selecionar Diretório de Salvamento
                  </Button>
                  {outputDirectory && (
                    <Form.Text className="d-block">
                      Diretório Selecionado: {outputDirectory}
                    </Form.Text>
                  )}
                </Form.Group>

                <div className="d-grid gap-2 mb-3">
                  <Button
                    variant="success"
                    onClick={() => convertFiles("txtToExcel")}
                    disabled={fileType !== "txt" || loading || !outputDirectory}
                  >
                    {loading && currentConversion === "txtToExcel" ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        Convertendo TXT para Excel...
                      </>
                    ) : (
                      "Converter TXT para Excel"
                    )}
                  </Button>
                </div>

                <div className="d-grid">
                  <Button
                    variant="warning"
                    onClick={() => convertFiles("excelToTxt")}
                    disabled={
                      fileType !== "excel" || loading || !outputDirectory
                    }
                  >
                    {loading && currentConversion === "excelToTxt" ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        Convertendo Excel para TXT...
                      </>
                    ) : (
                      "Converter Excel para TXT"
                    )}
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

export default Convert;
