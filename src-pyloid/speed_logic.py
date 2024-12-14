from pyloid import PyloidAPI, Bridge
import os
import pandas as pd
from tkinter import filedialog

class SpedLogic(PyloidAPI):
    selected_files = []
    save_directory = ""

    @Bridge()
    def select_files(self):
        # Abre um diálogo para selecionar arquivos SPED
        files = filedialog.askopenfilenames(
            title="Selecione os arquivos SPED", filetypes=[("Arquivos TXT", "*.txt")]
        )
        if files:
            self.selected_files = list(files)
            return {"success": True, "message": f"{len(self.selected_files)} arquivo(s) selecionado(s)."}
        return {"success": False, "message": "Nenhum arquivo selecionado."}

    @Bridge()
    def select_directory(self):
        # Abre um diálogo para selecionar um diretório de salvamento
        directory = filedialog.askdirectory(title="Selecione o diretório para salvar o arquivo")
        if directory:
            self.save_directory = directory
            return {"success": True, "message": f"Diretório selecionado: {self.save_directory}"}
        return {"success": False, "message": "Nenhum diretório selecionado."}

    @Bridge()
    def process_files(self, file_name: str, record_numbers: str):
        # Validações iniciais
        if not self.selected_files:
            return {"success": False, "message": "Nenhum arquivo selecionado para processar."}
        if not self.save_directory:
            return {"success": False, "message": "Nenhum diretório selecionado para salvar o arquivo."}
        if not file_name:
            return {"success": False, "message": "O nome do arquivo de saída é obrigatório."}

        # Processa os registros
        records = [record.strip() for record in record_numbers.split(",") if record.strip()]
        if not records:
            return {"success": False, "message": "Por favor, insira ao menos um número de registro válido."}

        dataframes = {}
        for file_path in self.selected_files:
            try:
                with open(file_path, "r", encoding="latin1") as f:
                    content = f.readlines()
                    for line in content:
                        line = line.strip()
                        if not line:
                            continue
                        fields = line.split("|")
                        if fields[0] == "":
                            fields = fields[1:]
                        if fields and fields[-1] == "":
                            fields = fields[:-1]
                        if len(fields) > 0:
                            record_type = fields[0]
                            if record_type in records:
                                if record_type not in dataframes:
                                    dataframes[record_type] = []
                                dataframes[record_type].append(fields)
            except Exception as e:
                return {"success": False, "message": f"Erro ao processar o arquivo {file_path}: {str(e)}"}

        # Salva o arquivo processado
        if not dataframes:
            return {"success": False, "message": "Nenhum registro correspondente encontrado."}

        save_path = os.path.join(
            self.save_directory, file_name if file_name.endswith(".xlsx") else f"{file_name}.xlsx"
        )
        try:
            with pd.ExcelWriter(save_path, engine="openpyxl") as writer:
                for record_type, data in dataframes.items():
                    max_columns = max(len(row) for row in data)
                    columns = [f"Campo {i}" for i in range(1, max_columns + 1)]
                    df = pd.DataFrame(data, columns=columns)
                    df.to_excel(writer, sheet_name=record_type, index=False)
            return {"success": True, "message": f"Processo concluído! Arquivo salvo em: {save_path}"}
        except Exception as e:
            return {"success": False, "message": f"Erro ao salvar o arquivo: {str(e)}"}
