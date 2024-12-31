import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import "./index.css";

const Home = () => {
  const [show, setShow] = useState(false);
  const [licenseExpirationDate, setLicenseExpirationDate] = useState("");

  useEffect(() => {
    // Carrega a licença usando a API do Pyloid
    const fetchLicenseData = async () => {
      try {
        const response = await window.pyloid.LicenseStorageAPI.load_license();
        if (response.success && response.data.licenseValidation) {
          setLicenseExpirationDate(formatDate(response.data.licenseValidation));
        } else {
          setLicenseExpirationDate("Não disponível");
        }
      } catch (error) {
        console.error("Erro ao carregar a licença:", error);
        setLicenseExpirationDate("Erro ao carregar a licença");
      }
    };

    fetchLicenseData();
  }, []);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Abre uma nova janela usando Pyloid
  const openInNewWindow = () => {
    window.pyloid.open_window({
      title: "Nova Janela - Modal",
      width: 600,
      height: 400,
      url: "http://localhost:3000", // Substitua pelo URL da rota que contém o modal
    });
  };

  // Função para formatar a data no formato DD-MM-AAAA
  const formatDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}-${year}`;
    } catch {
      return "Data inválida"; // Mensagem padrão em caso de erro
    }
  };

  // Função para formatar a data no formato DD-MM-AAAA
  const formatDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}-${year}`;
    } catch {
      return "Data inválida"; // Mensagem padrão em caso de erro
    }
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Home Page</h1>
        <p className="home-text">
          Bem-vindo à página inicial! Explore nossas funcionalidades e aproveite
          a experiência.
        </p>
        <Button
          className="home-button"
          variant="primary"
          onClick={() => {
            handleShow();
            openInNewWindow(); // Abre nova janela
          }}
        >
          Saiba Mais
        </Button>
      </div>

      {/* Modal */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Mais Informações</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Aqui estão mais informações sobre a nossa aplicação. Aproveite a
          experiência!
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rodapé */}
      <footer className="footer">
        <p className="footer-text">
          Data de Expiração da Licença: {licenseExpirationDate || "Não disponível"}
        </p>
      </footer>
    </div>
  );
};

export default Home;
