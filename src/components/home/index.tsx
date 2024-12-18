import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import "./index.css";

const Home = () => {
  const [show, setShow] = useState(false);

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
    </div>
  );
};

export default Home;
