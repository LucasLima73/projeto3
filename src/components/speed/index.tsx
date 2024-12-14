import { useState } from "react";

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
      setProcessingMessage(
        "O nome do arquivo e os números dos registros são obrigatórios."
      );
      return;
    }
    try {
      const response = await window.pyloid.CustomAPI.process_files(
        fileName,
        recordNumbers
      );
      setProcessingMessage(response.message);
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Processamento de Arquivos SPED</h1>
      <div>
        <button onClick={selectFiles}>
          Selecionar Arquivos
        </button>
        <p>{selectedFilesMessage}</p>
      </div>
      <div>
        <button onClick={selectDirectory}>Selecionar Diretório</button>
        <p>{selectedDirectoryMessage}</p>
      </div>
      <div>
        <label>
          Nome do Arquivo de Saída:
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Números dos Registros (separados por vírgula):
          <input
            type="text"
            value={recordNumbers}
            onChange={(e) => setRecordNumbers(e.target.value)}
          />
        </label>
      </div>
      <div>
        <button onClick={processFiles}>Iniciar Processamento</button>
        <p>{processingMessage}</p>
      </div>
    </div>
  );
};

export default Speed;
