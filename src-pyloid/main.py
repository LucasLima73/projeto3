from pyloid import Pyloid, PyloidAPI, Bridge, is_production, get_production_path
import os
import pandas as pd
import xml.etree.ElementTree as ET
import json
import base64
import platform  
from cryptography.fernet import Fernet
from typing import Optional, Dict

# Configuração do Pyloid
app = Pyloid(app_name="IVFTax", single_instance=True)

if is_production():
    app.set_icon(os.path.join(get_production_path(), "icons/icon.png"))
    app.set_tray_icon(os.path.join(get_production_path(), "icons/icon.png"))
    splash_image_path = os.path.join(get_production_path(), "icons/icon.png")
    production_path = get_production_path()
    
else:
    app.set_icon("src-pyloid/icons/icon.png")
    app.set_tray_icon("src-pyloid/icons/icon.png")
    splash_image_path = "src-pyloid/icons/splash.png"
  

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
                message = f"{len(self.selected_files)} arquivo(s) selecionado(s)."
                app.show_notification(
                    title="Arquivos Selecionados",
                    message=message,
                )
                return {"success": True, "message": message}
            app.show_notification(
                title="Nenhum Arquivo Selecionado",
                message="Nenhum arquivo foi selecionado.",
            )
            return {"success": False, "message": "Nenhum arquivo selecionado."}
        except Exception as e:
            app.show_notification(
                title="Erro ao Selecionar Arquivos",
                message=f"Erro: {str(e)}",
            )
            return {"success": False, "message": f"Erro ao selecionar arquivos: {e}"}

    @Bridge(result=str)
    def select_directory(self):
        """Seleciona o diretório de salvamento."""
        try:
            directory = app.select_directory_dialog(dir=os.getcwd())
            if directory:
                self.save_directory = directory
                message = f"Diretório selecionado: {self.save_directory}"
                app.show_notification(
                    title="Diretório Selecionado",
                    message=message,
                )
                return {"success": True, "message": message}
            app.show_notification(
                title="Nenhum Diretório Selecionado",
                message="Nenhum diretório foi selecionado.",
            )
            return {"success": False, "message": "Nenhum diretório selecionado."}
        except Exception as e:
            app.show_notification(
                title="Erro ao Selecionar Diretório",
                message=f"Erro: {str(e)}",
            )
            return {"success": False, "message": f"Erro ao selecionar diretório: {e}"}

    @Bridge(result=str)
    def save_file(self):
        """Abre diálogo para salvar arquivo."""
        try:
            save_path = app.save_file_dialog(
                dir=self.save_directory or os.getcwd(),
                filter="Arquivos TXT (*.txt)"
            )
            if save_path:
                message = f"Arquivo será salvo em: {save_path}"
                app.show_notification(
                    title="Arquivo Salvo",
                    message=message,
                )
                return {"success": True, "message": message}
            app.show_notification(
                title="Salvamento Cancelado",
                message="O processo de salvamento foi cancelado.",
            )
            return {"success": False, "message": "Salvamento cancelado."}
        except Exception as e:
            app.show_notification(
                title="Erro ao Salvar Arquivo",
                message=f"Erro: {str(e)}",
            )
            return {"success": False, "message": f"Erro ao salvar arquivo: {e}"}

    @Bridge(str, result=str)
    def convert_excel_to_sped(self, excel_file: str):
        """Converte arquivo Excel para SPED."""
        try:
            if not self.save_directory:
                raise ValueError("Nenhum diretório selecionado para salvar o arquivo.")

            # Carrega o arquivo Excel
            df = pd.read_excel(excel_file, header=None)

            # Gera as linhas no formato SPED
            sped_lines = ["|" + "|".join(map(str, row)) + "|" for row in df.values]

            # Salva o resultado no formato SPED
            save_path = os.path.join(
                self.save_directory, 
                os.path.splitext(os.path.basename(excel_file))[0] + ".txt"
            )
            with open(save_path, "w") as file:
                file.write("\n".join(sped_lines))

            app.show_notification(
                title="Conversão Concluída",
                message=f"Arquivo SPED gerado em: {save_path}",
            )
            return {"success": True, "message": f"Arquivo SPED salvo em: {save_path}"}
        except Exception as e:
            app.show_notification(
                title="Erro na Conversão",
                message=f"Erro: {str(e)}",
            )
            return {"success": False, "message": f"Erro na conversão: {e}"}

    @Bridge(str, result=str)
    def convert_excel_to_sped(self, excel_file: str):
        """Converte arquivo Excel para SPED."""
        try:
            if not self.save_directory:
                raise ValueError("Nenhum diretório selecionado para salvar o arquivo.")

            # Carrega o arquivo Excel
            df = pd.read_excel(excel_file, header=None)

            # Gera as linhas no formato SPED
            sped_lines = ["|" + "|".join(map(str, row)) + "|" for row in df.values]

            # Salva o resultado no formato SPED
            save_path = os.path.join(
                self.save_directory, 
                os.path.splitext(os.path.basename(excel_file))[0] + ".txt"
            )
            with open(save_path, "w") as file:
                file.write("\n".join(sped_lines))

            app.show_notification(
                title="Conversão Concluída",
                message=f"Arquivo SPED gerado em: {save_path}",
            )
            return {"success": True, "message": f"Arquivo SPED salvo em: {save_path}"}
        except Exception as e:
            app.show_notification(
                title="Erro na Conversão",
                message=f"Erro: {str(e)}",
            )
            return {"success": False, "message": f"Erro na conversão: {e}"}

    @Bridge(str, str, result=str)
    def process_files(self, file_name: str, record_numbers: str):
        """Processa arquivos SPED com base nos números de registro fornecidos."""
        try:
            if not self.selected_files:
                raise ValueError("Nenhum arquivo selecionado para processar.")
            if not self.save_directory:
                raise ValueError("Nenhum diretório selecionado para salvar o arquivo.")
            if not file_name:
                raise ValueError("O nome do arquivo de saída é obrigatório.")

            records = [record.strip() for record in record_numbers.split(",") if record.strip()]
            if not records:
                raise ValueError("Por favor, insira ao menos um número de registro válido.")

            dataframes = {}
            for file_path in self.selected_files:
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

            if not dataframes:
                raise ValueError("Nenhum registro correspondente encontrado.")

            save_path = os.path.join(
                self.save_directory, file_name if file_name.endswith(".xlsx") else f"{file_name}.xlsx"
            )
            with pd.ExcelWriter(save_path, engine="openpyxl") as writer:
                for record_type, data in dataframes.items():
                    max_columns = max(len(row) for row in data)
                    columns = [f"Campo {i}" for i in range(1, max_columns + 1)]
                    df = pd.DataFrame(data, columns=columns)
                    df.to_excel(writer, sheet_name=record_type, index=False)

            app.show_notification(
                title="Processamento Concluído",
                message=f"Arquivo salvo em: {save_path}",
            )
            return {"success": True, "message": f"Processo concluído! Arquivo salvo em: {save_path}"}
        except Exception as e:
            app.show_notification(
                title="Erro no Processamento",
                message=f"Erro: {str(e)}",
            )
            return {"success": False, "message": f"Erro no processamento: {e}"}

    @Bridge(result=bool)
    def is_production(self):
        """Verifica se o ambiente é de produção."""
        return is_production()
        
    @Bridge(result=str)
    def get_production_path(self):
        """Retorna o caminho de produção."""
        try:
            return get_production_path() if is_production() else ""
        except Exception as e:
            print(f"Erro ao obter o caminho de produção: {e}")
            return ""

# Classe para Processamento de XML
class XMLProcessingAPI(PyloidAPI):
    input_directory = ""
    output_directory = ""
    excluded_columns = []  # Armazena as colunas excluídas

    @Bridge(result=str)
    def select_input_directory(self):
        """Seleciona o diretório dos arquivos XML."""
        try:
            self.input_directory = app.select_directory_dialog(dir=os.getcwd())
            if self.input_directory:
                print(f"Diretório de entrada selecionado: {self.input_directory}")
                return f"Diretório de entrada selecionado: {self.input_directory}"
            print("Nenhum diretório de entrada selecionado.")
            return "Nenhum diretório de entrada selecionado."
        except Exception as e:
            print(f"Erro ao selecionar o diretório de entrada: {e}")
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
            print(f"Erro ao selecionar o diretório de saída: {e}")
            return f"Erro ao selecionar o diretório de saída: {e}"

    @Bridge(result=dict)
    def preview_file(self):
        """Carrega a pré-visualização dos dados do primeiro arquivo XML."""
        try:
            if not self.input_directory:
                return {"error": "Nenhum diretório de entrada selecionado."}

            for file_name in os.listdir(self.input_directory):
                if file_name.lower().endswith(".xml"):  # Suporte para .XML e .xml
                    file_path = os.path.join(self.input_directory, file_name)
                    print(f"Pré-visualizando arquivo: {file_path}")
                    extracted_data = self.extract_fields_from_xml(file_path)
                    if extracted_data:
                        print(f"Dados extraídos: {extracted_data}")
                        return {
                            "data": [extracted_data],  # Retorna os dados como uma lista de dicionários
                            "columns": list(extracted_data.keys()),  # Retorna as chaves como colunas
                            "file_name": file_name  # Nome do arquivo para referência
                        }

            print("Nenhum arquivo XML encontrado no diretório.")
            return {"error": "Nenhum arquivo XML encontrado no diretório."}
        except Exception as e:
            print(f"Erro ao carregar a pré-visualização: {e}")
            return {"error": f"Erro ao carregar a pré-visualização: {e}"}

    @Bridge(list, result=str)
    def save_excluded_columns(self, columns):
        """Salva as colunas excluídas recebidas do cliente."""
        if not isinstance(columns, list) or not all(isinstance(col, str) for col in columns):
            return "Erro: Colunas excluídas devem ser uma lista de strings."

        print(f"Salvando colunas excluídas: {columns}")
        self.excluded_columns = columns
        return "Colunas excluídas salvas com sucesso."

    @Bridge(result=str)
    def process_files(self):
        """Processa os arquivos XML e salva o resultado."""
        if not self.input_directory:
            return "Nenhum diretório de entrada selecionado."
        if not self.output_directory:
            return "Nenhum diretório de saída selecionado."

        print(f"Processando arquivos XML no diretório: {self.input_directory}")
        print(f"Colunas excluídas: {self.excluded_columns}")

        all_data = []
        for file_name in os.listdir(self.input_directory):
            if file_name.lower().endswith(".xml"):
                file_path = os.path.join(self.input_directory, file_name)
                extracted_data = self.extract_fields_from_xml(file_path)
                if extracted_data:
                    all_data.append(
                        {
                            key: value
                            for key, value in extracted_data.items()
                            if key not in self.excluded_columns
                        }
                    )

        if not all_data:
            return "Nenhum dado encontrado nos arquivos XML selecionados."

        output_file = os.path.join(self.output_directory, "notas_fiscais_extracao.xlsx")
        try:
            df = pd.DataFrame(all_data)
            df.to_excel(output_file, index=False)
            print(f"Processo concluído! Arquivo salvo em: {output_file}")

            # Notificação de sucesso
            app.show_notification(
                title="Processamento Concluído",
                message=f"Arquivo salvo em: {output_file}",
            )
            return f"Processo concluído! Arquivo salvo em: {output_file}"
        except Exception as e:
            print(f"Erro ao salvar o arquivo Excel: {e}")

            # Notificação de erro
            app.show_notification(
                title="Erro no Processamento",
                message=f"Erro ao salvar o arquivo: {e}",
            )
            return f"Erro ao salvar o arquivo Excel: {e}"

    def extract_fields_from_xml(self, file_path):
        """Extrai os campos de um arquivo XML."""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            namespace = {"nfe": "http://www.portalfiscal.inf.br/nfe"}
            data = {}

            for elem in root.findall(".//nfe:*", namespace):
                tag = elem.tag.split("}")[1]
                text = elem.text.strip() if elem.text else ""
                data[tag] = text

            return data
        except Exception as e:
            print(f"Erro ao processar o arquivo {file_path}: {e}")
            return None





class SpreadsheetProcessingAPI(PyloidAPI):
    selected_files = [None, None]  # Lista para armazenar os dois arquivos (Arquivo 1 e Arquivo 2)
    sheet_names = {}
    column_names = {}

    @Bridge(int, result=str)
    def select_file(self, file_index: int):
        print(f"Tentando selecionar o arquivo no índice: {file_index}")
        try:
            file_path = app.open_file_dialog(
                dir=os.getcwd(), filter="Arquivos Excel (*.xlsx)"
            )
            if file_path:
                self.selected_files[file_index] = file_path
                print(f"Arquivo selecionado: {file_path}")
                return f"Arquivo {file_index + 1} selecionado: {file_path}"
            print(f"Nenhum arquivo foi selecionado no índice: {file_index}")
            return f"Arquivo {file_index + 1} não foi selecionado."
        except Exception as e:
            print(f"Erro ao selecionar o arquivo {file_index + 1}: {e}")
            return f"Erro ao selecionar o arquivo {file_index + 1}: {e}"




    @Bridge(int, result=dict)
    def load_sheet_names(self, file_index: int):
        print(f"Carregando nomes das abas para o arquivo no índice: {file_index}")
        file_path = self.selected_files[file_index]
        if not file_path:
            print("Nenhum arquivo foi selecionado.")
            return {"error": "Nenhum arquivo foi selecionado."}
        try:
            sheets = pd.ExcelFile(file_path).sheet_names
            print(f"Nomes das abas carregadas: {sheets}")
            return {"file": file_path, "sheets": sheets}
        except Exception as e:
            print(f"Erro ao carregar nomes das abas: {e}")
            return {"error": f"Erro ao carregar as abas: {e}"}



    @Bridge(int, str,result=list)
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

    @Bridge(list, list, str, result=str)
    def process_cross_reference(self, sheet_names: list, columns: list, save_path: str):
        """Realiza o cruzamento entre duas planilhas e salva o resultado."""
        try:
            file1, file2 = self.selected_files
            sheet1, sheet2 = sheet_names
            column1, column2 = columns

            # Carrega os DataFrames das planilhas especificadas
            df1 = pd.read_excel(file1, sheet_name=sheet1)
            df2 = pd.read_excel(file2, sheet_name=sheet2)

            print("DataFrame 1:")
            print(df1.head())
            print("DataFrame 2:")
            print(df2.head())

            # Verifica se as colunas selecionadas existem nos DataFrames
            if column1 not in df1.columns or column2 not in df2.columns:
                return f"Erro: Coluna '{column1}' ou '{column2}' não encontrada."

            # Realiza o cruzamento entre os DataFrames usando as colunas selecionadas
            result_df = pd.merge(df1, df2, left_on=column1, right_on=column2, how="inner")

            print("DataFrame resultante:")
            print(result_df.head())

            # Salva o resultado no arquivo especificado
            result_df.to_excel(save_path, index=False)

            # Notificação de sucesso
            app.show_notification(
                title="Cruzamento Concluído",
                message=f"Arquivo salvo em: {save_path}",
            )
            return f"Cruzamento concluído! Arquivo salvo em: {save_path}"
        except Exception as e:
            # Notificação de erro
            app.show_notification(
                title="Erro no Cruzamento",
                message=f"Erro ao realizar o cruzamento: {str(e)}",
            )
            print(f"Erro no processamento: {e}")
            return f"Erro ao realizar o cruzamento: {e}"

    @Bridge(result=str)
    def save_file(self):
        """Abre o diálogo para salvar o arquivo Excel."""
        try:
            save_path = app.save_file_dialog(
                dir=os.getcwd(),
                filter="Arquivos Excel (*.xlsx)"
            )
            if save_path:
                if not save_path.endswith(".xlsx"):  # Garante que a extensão esteja presente
                    save_path += ".xlsx"
                print(f"Arquivo salvo em: {save_path}")
                return save_path
            print("Salvamento cancelado pelo usuário.")
            return ""
        except Exception as e:
            print(f"Erro ao abrir o diálogo de salvamento: {e}")
            return f"Erro ao abrir o diálogo de salvamento: {e}"

    @Bridge(result=str)
    def open_window(self, params: dict):
        title = params.get("title", "Nova Janela")
        width = params.get("width", 600)
        height = params.get("height", 400)
        url = params.get("url", "http://localhost:3000")

        window = app.create_window(title=title, width=width, height=height)
        window.load_url(url)
        window.show_and_focus()

        return "Nova janela aberta com sucesso"
    
class DecodeHash(PyloidAPI):
    @Bridge(str, result=str)
    def decode_base64(self, input: str) -> str:
        """
        Decodifica uma string Base64 para texto original.
        """
        try:
            # Adiciona padding necessário para Base64 válido
            missing_padding = len(input) % 4
            if missing_padding:
                input += '=' * (4 - missing_padding)
            return base64.b64decode(input.encode('utf-8')).decode('utf-8')
        except Exception as e:
            raise ValueError(f"Erro ao decodificar Base64: {e}")
    
    @Bridge(str, result=dict)
    def decode_license(self, license: str) -> dict:
        """
        Decodifica uma licença para obter os dados originais.

        Args:
            license (str): A licença no formato XXXXX-XXXXX-XXXXX-XXXXX.

        Returns:
            dict: Resultado da validação com sucesso ou mensagem de erro.
        """
        try:
            # Remove hífens e caracteres de preenchimento 'X'
            stripped_license = license.replace("-", "").rstrip("X")

            # Decodifica a string Base64
            decoded_data = self.decode_base64(stripped_license)

            # Divide os dados em ID e data
            id_part, expiration_date = decoded_data.split(":")

            # Valida os dados
            if not id_part or not expiration_date:
                raise ValueError("Formato inválido.")

            # Reconstrói a data no formato YYYY-MM-DD
            formatted_date = f"{expiration_date[:4]}-{expiration_date[4:6]}-{expiration_date[6:8]}"

            return {"success": True, "id": id_part, "expirationDate": formatted_date}
        except Exception as e:
            print(f"Erro ao decodificar a licença: {e}")
            return {"success": False, "message": "Licença inválida ou expirada."}
        
class LicenseStorageAPI(PyloidAPI):
    APP_NAME = "IVFTax"
    
    # Diretório de armazenamento baseado no sistema operacional
    if platform.system() == "Windows":
        BASE_DIR = os.path.join(os.getenv("LOCALAPPDATA"), APP_NAME)
    else:
        BASE_DIR = os.path.expanduser(f"~/.{APP_NAME}")
    
    FILE_PATH = os.path.join(BASE_DIR, "license_data.json")

    @staticmethod
    def ensure_directory():
        """Garante que o diretório de armazenamento existe."""
        if not os.path.exists(LicenseStorageAPI.BASE_DIR):
            os.makedirs(LicenseStorageAPI.BASE_DIR, exist_ok=True)

    @staticmethod
    def save_data(data: dict):
        """Salva os dados em um arquivo JSON sem criptografia."""
        try:
            LicenseStorageAPI.ensure_directory()
            with open(LicenseStorageAPI.FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            return {"success": True, "message": "Dados salvos com sucesso."}
        except Exception as e:
            return {"success": False, "message": f"Erro ao salvar dados: {e}"}

    @staticmethod
    def load_data():
        """Carrega os dados do arquivo JSON sem criptografia."""
        try:
            if not os.path.exists(LicenseStorageAPI.FILE_PATH):
                return {"success": False, "message": "Arquivo não encontrado."}
            with open(LicenseStorageAPI.FILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {"success": True, "data": data}
        except Exception as e:
            return {"success": False, "message": f"Erro ao carregar dados: {e}"}

    @Bridge(str, str, result=str)
    def save_license(self, license_key: str, validation_result: str):
        """Salva a licença e o resultado da validação."""
        data = {
            "licenseKey": license_key,
            "licenseValidation": validation_result,
        }
        return LicenseStorageAPI.save_data(data)

    @Bridge(result=dict)
    def load_license(self):
        """Carrega a licença salva."""
        return LicenseStorageAPI.load_data()


# Configuração Principal do Pyloid
from PySide6.QtCore import QThread
import time

# Configuração Principal do Pyloid
try:
    if is_production():
        # Configura a janela principal
        window = app.create_window(
            title="IVFTax",
            js_apis=[CustomAPI(), XMLProcessingAPI(), SpreadsheetProcessingAPI(), DecodeHash(), LicenseStorageAPI()],
        )
        # Configura a splash screen
        window.set_static_image_splash_screen(
            image_path=splash_image_path,
            close_on_load=False,  # A splash não fecha automaticamente
            stay_on_top=True,
            clickable=False,
            position="center",
        )

        # Worker para carregar o conteúdo principal
        class SplashWorkerThread(QThread):
            def run(self):
                # Simula operações de inicialização (ex.: conexão com BD, carregamento de recursos)
                time.sleep(2)  # Simula um carregamento de 2 segundos

        # Callback após a conclusão do carregamento
        def finish_callback():
            window.load_file(os.path.join(get_production_path(), "build/index.html"))
            window.set_position_by_anchor("center")
            window.show_and_focus()
            window.close_splash_screen()

        # Cria e inicia o worker thread
        splash_worker = SplashWorkerThread()
        splash_worker.finished.connect(finish_callback)
        splash_worker.start()
    else:
        # Configura a janela principal para ambiente de desenvolvimento
        window = app.create_window(
            title="IVFTax",
            js_apis=[CustomAPI(), XMLProcessingAPI(), SpreadsheetProcessingAPI(), DecodeHash(), LicenseStorageAPI()],
            dev_tools=True,
        )
        # Configura a splash screen
        window.set_static_image_splash_screen(
            image_path="src-pyloid/icons/icon.png",
            close_on_load=False,  # A splash não fecha automaticamente
            stay_on_top=True,
            clickable=False,
            position="center",
        )

        # Worker para carregar o conteúdo principal
        class SplashWorkerThread(QThread):
            def run(self):
                # Simula operações de inicialização (ex.: conexão com BD, carregamento de recursos)
                time.sleep(2)  # Simula um carregamento de 2 segundos

        # Callback após a conclusão do carregamento
        def finish_callback():
            window.load_url("http://localhost:5173")
            window.set_position_by_anchor("center")
            window.show_and_focus()
            window.close_splash_screen()

        # Cria e inicia o worker thread
        splash_worker = SplashWorkerThread()
        splash_worker.finished.connect(finish_callback)
        splash_worker.start()
except Exception as e:
    print(f"Erro ao inicializar a janela principal: {e}")

# Executa o aplicativo Pyloid
app.run()

