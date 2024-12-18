import React, { useState } from "react";

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
      console.log(`Iniciando seleção de arquivo para o índice: ${fileIndex}`);
  
      const response = await window.pyloid.SpreadsheetProcessingAPI.select_file(
        fileIndex
      );
  
      console.log("Resposta de select_file:", response);
  
      // Verifique se o arquivo foi selecionado corretamente
      if (!response.startsWith(`Arquivo ${fileIndex + 1} selecionado`)) {
        console.error("Erro ao selecionar arquivo:", response);
        setErrorMessage(response);
        return;
      }
  
      console.log("Chamando load_sheet_names...");
      const sheetData =
        await window.pyloid.SpreadsheetProcessingAPI.load_sheet_names(
          fileIndex
        );
  
      console.log("Resposta de load_sheet_names:", sheetData);
  
      if (sheetData.error) {
        console.error("Erro ao carregar nomes das abas:", sheetData.error);
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
      console.error("Erro ao selecionar arquivo:", error);
      setErrorMessage(
        "Erro ao selecionar arquivo: " + (error as Error).message
      );
    }
  };
  
  
  const loadColumns = async (fileIndex: number, sheetName: string) => {
    try {
      console.log(
        `Carregando colunas: Arquivo ${fileIndex}, Aba: ${sheetName}`
      );
      const response =
        await window.pyloid.SpreadsheetProcessingAPI.load_columns(
          fileIndex,
          sheetName
        );
      console.log("Colunas retornadas:", response);
      if (fileIndex === 0) {
        setColumns1(response);
      } else {
        setColumns2(response);
      }
    } catch (error) {
      console.error("Erro ao carregar colunas:", error);
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
    } catch (error) {
      setErrorMessage(
        "Erro ao processar arquivos: " + (error as Error).message
      );
    }
  };

  return (
    <div>
      <button onClick={() => selectFile(0)}>Selecionar Arquivo 1</button>
      <button onClick={() => selectFile(1)}>Selecionar Arquivo 2</button>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

      {sheet1 && (
        <div>
          <h3>Arquivo 1: {sheet1.file}</h3>
          <select onChange={(e) => { setSelectedSheet1(e.target.value); loadColumns(0, e.target.value); }}>
            <option value="">Selecione uma aba</option>
            {sheet1.sheets.map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName}
              </option>
            ))}
          </select>
        </div>
      )}

      {sheet2 && (
        <div>
          <h3>Arquivo 2: {sheet2.file}</h3>
          <select onChange={(e) => { setSelectedSheet2(e.target.value); loadColumns(1, e.target.value); }}>
            <option value="">Selecione uma aba</option>
            {sheet2.sheets.map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName}
              </option>
            ))}
          </select>
        </div>
      )}

      {columns1.length > 0 && (
        <div>
          <h4>Colunas do Arquivo 1:</h4>
          <select onChange={(e) => setSelectedColumn1(e.target.value)}>
            <option value="">Selecione uma coluna</option>
            {columns1.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      )}

      {columns2.length > 0 && (
        <div>
          <h4>Colunas do Arquivo 2:</h4>
          <select onChange={(e) => setSelectedColumn2(e.target.value)}>
            <option value="">Selecione uma coluna</option>
            {columns2.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedColumn1 && selectedColumn2 && (
        <button onClick={processFiles}>Processar Arquivos</button>
      )}
    </div>
  );
};

export default SpreadsheetProcessor;
