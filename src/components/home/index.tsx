
const Home = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Bem-vindo à página inicial!</p>

      <button onClick={() => window.pyloid.custom.create_window()}>
          Create Window
        </button>
    </div>
  );
};

export default Home;
