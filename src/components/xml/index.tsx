import { useState } from "react";
import "./index.css";

const Xml = () => {
  const [inputDirectory, setInputDirectory] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [processingMessage, setProcessingMessage] = useState("");

  const selectInputDirectory = async () => {
    try {
      const message =
        await window.pyloid.XMLProcessingAPI.select_input_directory();
      setInputDirectory(message);
    } catch (error) {
      console.error("Erro ao selecionar o diretório de entrada:", error);
    }
  };

  const selectOutputDirectory = async () => {
    try {
      const message =
        await window.pyloid.XMLProcessingAPI.select_output_directory();
      setOutputDirectory(message);
    } catch (error) {
      console.error("Erro ao selecionar o diretório de saída:", error);
    }
  };

  const processFiles = async () => {
    try {
      const message = await window.pyloid.XMLProcessingAPI.process_files();
      setProcessingMessage(message);
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
    }
  };

  return (
    <div className="xml-container">
      <h1>Processador de XML</h1>

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
        <button onClick={processFiles}>Processar Arquivos</button>
        <p>{processingMessage}</p>
      </div>
    </div>
  );
};

export default Xml;
