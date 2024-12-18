import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Modal, Button, Table, Form } from "react-bootstrap";

interface PreviewModalProps {
  data: { [key: string]: string | number | boolean }[];
  columns: string[];
  excludedColumns: string[];
  setExcludedColumns: (columns: string[]) => void;
  onSave: (excludedColumns: string[]) => void;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  data,
  columns,
  excludedColumns,
  setExcludedColumns,
  onSave,
  onClose,
}) => {
  const externalWindow = useRef<Window | null>(null);
  const containerEl = useRef<HTMLDivElement | null>(null);

  // Alternar colunas
  const toggleColumn = React.useCallback((column: string) => {
    setExcludedColumns(
      excludedColumns.includes(column)
        ? excludedColumns.filter((col) => col !== column)
        : [...excludedColumns, column]
    );
  }, [excludedColumns, setExcludedColumns]);

  // Fechar janela modal
  const closeWindow = React.useCallback(() => {
    if (externalWindow.current) {
      externalWindow.current.close();
      externalWindow.current = null;
      onClose();
    }
  }, [onClose]);

  // Salvar colunas e fechar o modal
  const handleSave = React.useCallback(() => {
    onSave(excludedColumns);
    closeWindow();
  }, [excludedColumns, onSave, closeWindow]);

  useEffect(() => {
    // Abrir nova janela
    externalWindow.current = window.open(
      "",
      "_blank",
      "width=800,height=600,resizable,scrollbars"
    );

    if (externalWindow.current) {
      const container = document.createElement("div");
      containerEl.current = container;
      externalWindow.current.document.body.appendChild(container);

      // Adicionar estilo Bootstrap
      const style = externalWindow.current.document.createElement("link");
      style.rel = "stylesheet";
      style.href =
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
      externalWindow.current.document.head.appendChild(style);

      const root = ReactDOM.createRoot(container);
      root.render(
        <Modal show onHide={closeWindow} centered>
          <Modal.Header closeButton>
            <Modal.Title>Pré-visualização dos Dados</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ overflowX: "auto" }}>
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
                  {data.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {columns.map((col) => (
                        <td key={col}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeWindow}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Salvar
            </Button>
          </Modal.Footer>
        </Modal>
      );

      externalWindow.current.onbeforeunload = closeWindow;
    }

    return () => closeWindow();
  }, [data, columns, excludedColumns, closeWindow, handleSave, toggleColumn]);

  return null;
};

export default PreviewModal;
