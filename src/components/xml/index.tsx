import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Modal,
  Table,
} from "react-bootstrap";
import "./index.css";

const Xml = () => {
  const [inputDirectory, setInputDirectory] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [outputFileName, setOutputFileName] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewData, setPreviewData] = useState<
    Record<string, string | number | boolean>[]
  >([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [excludedColumns, setExcludedColumns] = useState<string[]>([]);
  const [previewFileName, setPreviewFileName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Função para selecionar diretório de entrada
  const selectInputDirectory = async () => {
    try {
      const message =
        await window.pyloid.XMLProcessingAPI.select_input_directory();
      setInputDirectory(message);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Erro ao selecionar o diretório de entrada: " + error);
    }
  };

  // Função para selecionar diretório de saída
  const selectOutputDirectory = async () => {
    try {
      const message =
        await window.pyloid.XMLProcessingAPI.select_output_directory();
      setOutputDirectory(message);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Erro ao selecionar o diretório de saída: " + error);
    }
  };

  // Função para pré-visualizar arquivo
  const previewFile = async () => {
    try {
      const response = await window.pyloid.XMLProcessingAPI.preview_file();
      if (response.error) {
        setProcessingMessage(response.error);
        return;
      }

      setPreviewData(response.data);
      setColumns(response.columns);
      setPreviewFileName(response.file_name);
      setExcludedColumns([]);
      setIsPreviewOpen(true);
    } catch (error) {
      setErrorMessage("Erro ao visualizar o arquivo: " + error);
    }
  };

  // Função para processar arquivos
  const processFiles = async () => {
    try {
      if (!outputFileName) {
        setErrorMessage("O nome do arquivo de saída é obrigatório.");
        return;
      }
      const message = await window.pyloid.XMLProcessingAPI.process_files();
      setProcessingMessage(message);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Erro ao processar arquivos: " + error);
    }
  };

  // Alternar colunas excluídas
  const toggleColumn = (column: string) => {
    setExcludedColumns((prevExcludedColumns) =>
      prevExcludedColumns.includes(column)
        ? prevExcludedColumns.filter((col) => col !== column)
        : [...prevExcludedColumns, column]
    );
  };

  return (
    <Container className="xml-container">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="mt-4">
            <Card.Body>
              <Card.Title>Processador de XML</Card.Title>
              <hr />
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              {processingMessage && (
                <Alert variant="success">{processingMessage}</Alert>
              )}

              <Form>
                <Form.Group className="mb-3">
                  <Button
                    onClick={selectInputDirectory}
                    variant="primary"
                    className="w-100"
                  >
                    Selecionar Diretório de Entrada
                  </Button>
                  {inputDirectory && <Form.Text>{inputDirectory}</Form.Text>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Button
                    onClick={selectOutputDirectory}
                    variant="secondary"
                    className="w-100"
                  >
                    Selecionar Diretório de Saída
                  </Button>
                  {outputDirectory && <Form.Text>{outputDirectory}</Form.Text>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nome do Arquivo de Saída</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Exemplo: output.xlsx"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Button
                    onClick={previewFile}
                    variant="info"
                    className="w-100"
                  >
                    Visualizar Dados
                  </Button>
                  {previewFileName && (
                    <Form.Text>Arquivo: {previewFileName}</Form.Text>
                  )}
                </Form.Group>

                <Button
                  onClick={processFiles}
                  variant="success"
                  className="w-100"
                >
                  Processar Arquivos
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Preview Modal */}
      <Modal
        show={isPreviewOpen}
        onHide={() => setIsPreviewOpen(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Pré-visualização dos Dados</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ overflowX: "auto" }}>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>
                    <Form.Check
                      type="checkbox"
                      label={col}
                      checked={!excludedColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 5).map((row, index) => (
                <tr key={index}>
                  {columns.map((col) => (
                    <td key={col}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>
            Fechar
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                // Envia as colunas excluídas para o backend
                const response =
                  await window.pyloid.XMLProcessingAPI.save_excluded_columns(
                    excludedColumns
                  );
                console.log("Colunas excluídas salvas no backend:", response);
                setProcessingMessage("Colunas excluídas salvas com sucesso!");
                setErrorMessage("");
              } catch (error) {
                setErrorMessage("Erro ao salvar colunas excluídas: " + error);
              }
              setIsPreviewOpen(false);
            }}
          >
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Xml;
