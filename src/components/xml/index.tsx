import { useState } from "react";
import PreviewModal from "../previewModal";
import "./index.css";

const Xml = () => {
  const [inputDirectory, setInputDirectory] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [outputFileName, setOutputFileName] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Novo estado para mensagens de erro
  interface PreviewData {
    [key: string]: string | number | boolean;
    id: number;
    name: string;
  }

  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [excludedColumns, setExcludedColumns] = useState<string[]>([]);
  const [previewFileName, setPreviewFileName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const selectInputDirectory = async () => {
    try {
      const message =
        await window.pyloid.XMLProcessingAPI.select_input_directory();
      setInputDirectory(message);
      setErrorMessage(""); // Limpa erros anteriores
    } catch (error) {
      const errorText = "Erro ao selecionar o diretório de entrada: " + error;
      setErrorMessage(errorText);
    }
  };

  const selectOutputDirectory = async () => {
    try {
      const message =
        await window.pyloid.XMLProcessingAPI.select_output_directory();
      setOutputDirectory(message);
      setErrorMessage(""); // Limpa erros anteriores
    } catch (error) {
      const errorText = "Erro ao selecionar o diretório de saída: " + error;
      setErrorMessage(errorText);
    }
  };

  const previewFile = async () => {
    try {
      const response = await window.pyloid.XMLProcessingAPI.preview_file();
      if (response.error) {
        setProcessingMessage(response.error);
        setErrorMessage(""); // Limpa erros anteriores, pois a mensagem de erro já está no processamento
        return;
      }

      setPreviewData(response.data);
      setColumns(response.columns);
      setPreviewFileName(response.file_name);
      setExcludedColumns([]);
      setIsPreviewOpen(true);
      setErrorMessage(""); // Limpa erros anteriores
    } catch (error) {
      const errorText = "Erro ao visualizar o arquivo: " + error;
      setErrorMessage(errorText);
    }
  };

  const processFiles = async () => {
    try {
      console.log("Enviando colunas excluídas:", excludedColumns);
      const message = await window.pyloid.XMLProcessingAPI.process_files();
      setProcessingMessage(message);
      setErrorMessage("");
    } catch (error) {
      const errorText = "Erro ao processar arquivos: " + error;
      setErrorMessage(errorText);
    }
  };

  const handleSaveExcludedColumns = async () => {
    try {
      const response =
        await window.pyloid.XMLProcessingAPI.save_excluded_columns(
          excludedColumns
        );
      console.log("Colunas excluídas salvas com sucesso:", response);
    } catch (error) {
      console.error("Erro ao salvar colunas excluídas:", error);
    }
  };

  return (
    <div className="xml-container">
      <h1>Processador de XML</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}{" "}
      {/* Mostra mensagem de erro */}
      <div>
        <button onClick={selectInputDirectory}>
          Selecionar Diretório de Entrada
        </button>
        <p>{inputDirectory}</p>
      </div>
      <div>
        <button onClick={selectOutputDirectory}>
          Selecionar Diretório de Saída
        </button>
        <p>{outputDirectory}</p>
      </div>
      <div>
        <input
          type="text"
          placeholder="Nome do Arquivo de Saída"
          value={outputFileName}
          onChange={(e) => setOutputFileName(e.target.value)}
        />
      </div>
      <div>
        <button onClick={previewFile}>Visualizar Dados</button>
        {previewFileName && <p>Arquivo: {previewFileName}</p>}
      </div>
      <div>
        <button onClick={processFiles}>Processar Arquivos</button>
        <p>{processingMessage}</p>
      </div>
      {isPreviewOpen && (
        <PreviewModal
          data={previewData}
          columns={columns}
          excludedColumns={excludedColumns}
          setExcludedColumns={setExcludedColumns}
          onSave={handleSaveExcludedColumns}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default Xml;
