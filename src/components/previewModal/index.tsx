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

  const toggleColumn = (column: string) => {
    setExcludedColumns(
      excludedColumns.includes(column)
        ? excludedColumns.filter((col) => col !== column)
        : [...excludedColumns, column]
    );
  };

  const handleSave = async () => {
    try {
      const response =
        await window.pyloid.XMLProcessingAPI.save_excluded_columns(
          JSON.stringify(excludedColumns)
        );
      console.log("Colunas excluídas salvas no backend:", response);
    } catch (error) {
      console.error("Erro ao salvar colunas excluídas no backend:", error);
    }
    onSave(excludedColumns);
    externalWindow.current?.close();
  };

  useEffect(() => {
    // Abre a nova janela
    externalWindow.current = window.open(
      "",
      "_blank",
      "width=800,height=600,resizable,scrollbars"
    );

    if (externalWindow.current) {
      const container = document.createElement("div");
      containerEl.current = container;
      externalWindow.current.document.body.appendChild(container);

      const title = externalWindow.current.document.createElement("title");
      title.innerText = "Pré-visualização dos Dados";
      externalWindow.current.document.head.appendChild(title);

      const style = externalWindow.current.document.createElement("link");
      style.rel = "stylesheet";
      style.href =
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
      externalWindow.current.document.head.appendChild(style);

      const root = ReactDOM.createRoot(container);
      root.render(
        <Modal show onHide={() => externalWindow.current?.close()} centered>
          <Modal.Header closeButton>
            <Modal.Title>Pré-visualização dos Dados</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>
                      <Form.Check
                        type="checkbox"
                        id={`checkbox-${col}`}
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
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => externalWindow.current?.close()}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Salvar
            </Button>
          </Modal.Footer>
        </Modal>
      );

      externalWindow.current.onbeforeunload = () => onClose();
    }

    return () => {
      externalWindow.current?.close();
    };
  }, []);

  return null;
};

export default PreviewModal;
