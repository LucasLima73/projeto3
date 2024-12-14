from pyloid import Pyloid, PyloidAPI, Bridge, is_production, get_production_path
import os
import pandas as pd
import xml.etree.ElementTree as ET

# Configuração do Pyloid
app = Pyloid(app_name="Pyloid-App", single_instance=True)

if is_production():
    app.set_icon(os.path.join(get_production_path(), "icons/icon.png"))
    app.set_tray_icon(os.path.join(get_production_path(), "icons/icon.png"))
else:
    app.set_icon("src-pyloid/icons/icon.png")
    app.set_tray_icon("src-pyloid/icons/icon.png")

# Classe API Customizada
class CustomAPI(PyloidAPI):
    selected_files = []
    save_directory = ""

    @Bridge(result=str)
    def select_files(self):
        """Seleciona arquivos SPED."""
        try:
            file_paths = app.open_file_dialog(
                dir=os.getcwd(),
                filter="Arquivos TXT (*.txt)"
            )
            if file_paths:
                self.selected_files = file_paths if isinstance(file_paths, list) else [file_paths]
                return {"success": True, "message": f"{len(self.selected_files)} arquivo(s) selecionado(s)."}
            return {"success": False, "message": "Nenhum arquivo selecionado."}
        except Exception as e:
            return {"success": False, "message": f"Erro ao selecionar arquivos: {e}"}

    @Bridge(result=str)
    def select_directory(self):
        """Seleciona o diretório de salvamento."""
        try:
            directory = app.select_directory_dialog(dir=os.getcwd())
            if directory:
                self.save_directory = directory
                return {"success": True, "message": f"Diretório selecionado: {self.save_directory}"}
            return {"success": False, "message": "Nenhum diretório selecionado."}
        except Exception as e:
            return {"success": False, "message": f"Erro ao selecionar diretório: {e}"}

    @Bridge(result=str)
    def save_file(self):
        """Abre diálogo para salvar arquivo."""
        try:
            save_path = app.save_file_dialog(
                dir=self.save_directory or os.getcwd(),
                filter="Arquivos Excel (*.xlsx)"
            )
            if save_path:
                return {"success": True, "message": f"Arquivo será salvo em: {save_path}"}
            return {"success": False, "message": "Salvamento cancelado."}
        except Exception as e:
            return {"success": False, "message": f"Erro ao salvar arquivo: {e}"}

# Classe para Processamento de XML
class XMLProcessingAPI(PyloidAPI):
    input_directory = ""
    output_directory = ""

    @Bridge(result=str)
    def select_input_directory(self):
        """Seleciona o diretório dos arquivos XML."""
        try:
            self.input_directory = app.select_directory_dialog(dir=os.getcwd())
            if self.input_directory:
                return f"Diretório de entrada selecionado: {self.input_directory}"
            return "Nenhum diretório de entrada selecionado."
        except Exception as e:
            return f"Erro ao selecionar o diretório de entrada: {e}"

    @Bridge(result=str)
    def select_output_directory(self):
        """Seleciona o diretório para salvar os resultados."""
        try:
            self.output_directory = app.select_directory_dialog(dir=os.getcwd())
            if self.output_directory:
                return f"Diretório de saída selecionado: {self.output_directory}"
            return "Nenhum diretório de saída selecionado."
        except Exception as e:
            return f"Erro ao selecionar o diretório de saída: {e}"

    @Bridge(result=str)
    def process_files(self):
        """Processa os arquivos XML e salva o resultado."""
        if not self.input_directory:
            return "Nenhum diretório de entrada selecionado."
        if not self.output_directory:
            return "Nenhum diretório de saída selecionado."

        all_data = []
        for file_name in os.listdir(self.input_directory):
            if file_name.endswith('.XML'):
                file_path = os.path.join(self.input_directory, file_name)
                extracted_data = self.extract_fields_from_xml(file_path)
                if extracted_data:
                    all_data.append(extracted_data)

        if not all_data:
            return "Nenhum dado encontrado nos arquivos XML selecionados."

        output_file = os.path.join(self.output_directory, "notas_fiscais_extracao.xlsx")
        try:
            df = pd.DataFrame(all_data)
            df.to_excel(output_file, index=False)
            return f"Processo concluído! Arquivo salvo em: {output_file}"
        except Exception as e:
            return f"Erro ao salvar o arquivo Excel: {e}"

    def extract_fields_from_xml(self, file_path):
        """Extrai os campos de um arquivo XML."""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            namespace = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
            data = {}

            for elem in root.findall('.//nfe:*', namespace):
                tag = elem.tag.split('}')[1]
                text = elem.text.strip() if elem.text else ''
                data[tag] = text

            return data
        except Exception as e:
            print(f"Erro ao processar o arquivo {file_path}: {e}")
            return None

class SpreadsheetProcessingAPI(PyloidAPI):
    selected_files = [None, None]  # Lista para armazenar os dois arquivos (Arquivo 1 e Arquivo 2)
    sheet_names = {}
    column_names = {}

    @Bridge(result=str)
    def select_file(self, file_index: int):
        """Seleciona um arquivo Excel específico (Arquivo 1 ou 2)."""
        try:
            file_path = self.app.open_file_dialog(
                dir=os.getcwd(), filter="Arquivos Excel (*.xlsx)"
            )
            if file_path:
                self.selected_files[file_index] = file_path
                return f"Arquivo {file_index + 1} selecionado: {file_path}"
            return f"Arquivo {file_index + 1} não foi selecionado."
        except Exception as e:
            return f"Erro ao selecionar arquivo {file_index + 1}: {e}"

    @Bridge(result=dict)
    def load_sheet_names(self, file_index: int):
        """Carrega os nomes das abas do arquivo especificado."""
        file_path = self.selected_files[file_index]
        if not file_path:
            return {"error": "Nenhum arquivo foi selecionado."}
        try:
            sheets = pd.ExcelFile(file_path).sheet_names
            return {"file": file_path, "sheets": sheets}
        except Exception as e:
            return {"error": f"Erro ao carregar as abas: {e}"}

    @Bridge(result=list)
    def load_columns(self, file_index: int, sheet_name: str):
        """Carrega as colunas de uma aba específica."""
        file_path = self.selected_files[file_index]
        if not file_path:
            return ["Nenhum arquivo selecionado."]
        try:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            df.columns = [
                col if pd.notnull(col) and not str(col).startswith("Unnamed") else f"Coluna_{i+1}"
                for i, col in enumerate(df.columns)
            ]
            return df.columns.tolist()
        except Exception as e:
            return [f"Erro ao carregar colunas: {e}"]

    @Bridge(result=str)
    def process_cross_reference(self, sheet_names: list, columns: list, save_path: str):
        """Realiza o cruzamento entre duas planilhas e salva o resultado."""
        try:
            file1, file2 = self.selected_files
            sheet1, sheet2 = sheet_names
            column1, column2 = columns

            df1 = pd.read_excel(file1, sheet_name=sheet1)
            df2 = pd.read_excel(file2, sheet_name=sheet2)

            result_df = pd.merge(df1, df2, left_on=column1, right_on=column2, how="inner")
            result_df.to_excel(save_path, index=False)
            return f"Cruzamento concluído! Arquivo salvo em: {save_path}"
        except Exception as e:
            return f"Erro ao realizar o cruzamento: {e}"

# Configuração Principal do Pyloid
try:
    if is_production():
        window = app.create_window(
            title="Pyloid Browser-production",
            js_apis=[CustomAPI(), XMLProcessingAPI(), SpreadsheetProcessingAPI()],
        )
        window.load_file(os.path.join(get_production_path(), "build/index.html"))
    else:
        window = app.create_window(
            title="Pyloid Browser-dev",
            js_apis=[CustomAPI(), XMLProcessingAPI(), SpreadsheetProcessingAPI()],
            dev_tools=True,
        )
        window.load_url("http://localhost:5173")
    window.show_and_focus()
except Exception as e:
    print(f"Erro ao inicializar a janela principal: {e}")

# Executa o aplicativo Pyloid
app.run()
