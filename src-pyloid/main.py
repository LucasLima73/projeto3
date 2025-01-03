from pyloid import Pyloid, PyloidAPI, Bridge, is_production, get_production_path
import os
import pandas as pd
import xml.etree.ElementTree as ET
import json
import base64
import platform
from PySide6.QtWidgets import QFileDialog
from cryptography.fernet import Fernet
from typing import Optional, Dict
from PySide6.QtCore import QObject, QThread , Signal, Slot
from concurrent.futures import ThreadPoolExecutor

import traceback
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

executor = ThreadPoolExecutor(max_workers=2)
class WorkerSignals(QObject):
    finished = Signal(object)  # Signal for completion (can send data)
    error = Signal(str)       # Signal for errors
    progress = Signal(int)     # Signal for progress updates
    notification = Signal(str, str) #Signal for notifications

# Classe API Customizada
class CustomAPI(PyloidAPI,QObject):
    selected_files = []
    save_directory = ""

    def __init__(self):
        super().__init__()
        self.worker_signals = WorkerSignals()
        self.worker_signals.finished.connect(self.handle_finished)
        self.worker_signals.error.connect(self.handle_error)
        self.worker_signals.notification.connect(self.handle_notification)

    def long_task(self, file_name, record_numbers, selected_columns, relate_c100_c170):
        try:
            print("Iniciando long_task...")
            result = self.process_files(
                file_name=file_name,
                record_numbers=record_numbers,
                selected_columns=selected_columns,
                relate_c100_c170=relate_c100_c170,
            )
            print("Emitindo sinal finished...")
            self.worker_signals.finished.emit(result)

            if result.get("success"):
                print("Emitindo notificação de sucesso...")
                self.worker_signals.notification.emit("Processamento Concluído", result.get("message"))
                self.worker_signals.finished.emit(result)
            else:
                print("Emitindo notificação de erro...")
                self.worker_signals.notification.emit("Erro no Processamento", result.get("message"))
        except Exception as e:
            error_message = traceback.format_exc()
            print(f"Erro em long_task: {error_message}")
            self.worker_signals.error.emit(f"Erro durante o processamento: {error_message}")
            self.worker_signals.notification.emit("Erro no Processamento", f"Erro durante o processamento: {error_message}")



    @Bridge(str, str, list, bool, result=dict)
    def process_files_with_thread(self, file_name, record_numbers, selected_columns, relate_c100_c170):
        """Inicia o processamento em uma thread e conecta os sinais."""
        if not self.selected_files or not self.save_directory:
            return {"success": False, "message": "Arquivos ou diretório não selecionados."}

        executor.submit(self.long_task, file_name, record_numbers, selected_columns, relate_c100_c170)
        return {"success": True, "message": "Processamento iniciado."}

    @Slot(dict)
    def handle_finished(self, result):
        if result.get("success"):
            print("Processo finalizado com sucesso")
        else:
            print("Processo finalizado com erro")
        #Aqui você pode fazer algo com o resultado, como atualizar a UI
        pass

    @Slot(str)
    def handle_error(self, message):
        print(f"Erro: {message}")
        #Aqui você pode fazer algo com o erro, como mostrar uma mensagem na UI
        pass

    @Slot(str, str)
    def handle_notification(self, title, message):
        app.show_notification(title=title, message=message)


    @Bridge(result=list)
    def select_multiple_files(self):
        """Abre um diálogo para selecionar múltiplos arquivos."""
        file_dialog = QFileDialog()
        file_dialog.setFileMode(QFileDialog.ExistingFiles)
        file_dialog.setNameFilter("Arquivos TXT (*.txt)")
        if file_dialog.exec():
            self.selected_files = file_dialog.selectedFiles()  # Atualiza self.selected_files
            app.show_notification(
                title="Arquivos Selecionados",
                message=f"{len(self.selected_files)} arquivo(s) selecionado(s)."
            )
            return self.selected_files
        app.show_notification(
            title="Nenhum Arquivo Selecionado",
            message="Nenhum arquivo foi selecionado."
        )
        return []
    
    @Bridge(str,result=list)
    def select_multiple_files_convert(self, file_type: str = "txt"):
        """
        Abre um diálogo para selecionar múltiplos arquivos com base no tipo.
        """
        try:
            file_dialog = QFileDialog()
            file_dialog.setFileMode(QFileDialog.ExistingFiles)

            # Define o filtro com base no tipo do arquivo
            if file_type == "txt":
                file_dialog.setNameFilter("Arquivos TXT (*.txt)")
            elif file_type == "excel":
                file_dialog.setNameFilter("Arquivos Excel (*.xlsx)")

            if file_dialog.exec():
                self.selected_files = file_dialog.selectedFiles()
                app.show_notification(
                    title="Arquivos Selecionados",
                    message=f"{len(self.selected_files)} arquivo(s) selecionado(s)."
                )
                return self.selected_files

            app.show_notification(
                title="Nenhum Arquivo Selecionado",
                message="Nenhum arquivo foi selecionado."
            )
            return []
        except Exception as e:
            app.show_notification(
                title="Erro ao Selecionar Arquivos",
                message=f"Erro: {str(e)}",
            )
            return []



    @Bridge(result=str)
    def select_files(self):
        """Seleciona arquivos SPED."""
        try:
            file_paths = app.open_file_dialog(
                dir=os.getcwd(),
                filter="Arquivos TXT (*.txt)",
                multi=True
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
        """Converte arquivo Excel com múltiplas abas para SPED."""
        try:
            if not self.save_directory:
                raise ValueError("Nenhum diretório selecionado para salvar o arquivo.")

            # Construir o caminho completo do arquivo
            excel_file_path = os.path.join(self.save_directory, excel_file)

            # Verificar se o arquivo existe
            if not os.path.isfile(excel_file_path):
                raise FileNotFoundError(f"Arquivo não encontrado: {excel_file_path}")

            # Carregar todas as abas do Excel
            sheets = pd.read_excel(excel_file_path, sheet_name=None, header=None)

            sped_lines = []

            # Iterar por cada aba e processar os dados
            for sheet_name, df in sheets.items():
                for _, row in df.iterrows():
                    sped_lines.append("|" + "|".join(map(str, row)) + "|")

            # Define o caminho para salvar o arquivo SPED
            save_path = os.path.join(
                self.save_directory,
                os.path.splitext(os.path.basename(excel_file_path))[0] + ".txt"
            )

            # Salvar o resultado no formato SPED
            with open(save_path, "w") as file:
                file.write("\n".join(sped_lines))

            app.show_notification(
                title="Conversão Concluída",
                message=f"Arquivo SPED gerado em: {save_path}",
            )
            return {"success": True, "message": f"Arquivo SPED salvo em: {save_path}"}
        except FileNotFoundError as e:
            app.show_notification(
                title="Erro na Conversão",
                message=str(e),
            )
            return {"success": False, "message": str(e)}
        except Exception as e:
            app.show_notification(
                title="Erro na Conversão",
                message=f"Erro: {str(e)}",
            )
            return {"success": False, "message": f"Erro na conversão: {e}"}

    @Bridge(str, str, list, bool, result=str)
    def process_files(self, file_name: str, record_numbers: str, selected_columns: list, relate_c100_c170: bool):
        """
        Processa múltiplos arquivos SPED com base nos números de registro fornecidos,
        nas colunas selecionadas e com a opção de relacionar C100 e C170.
        """
        try:
            if not self.selected_files:
                raise ValueError("Nenhum arquivo selecionado para processar.")
            if not self.save_directory:
                raise ValueError("Nenhum diretório selecionado para salvar o arquivo.")
            if not file_name:
                raise ValueError("O nome do arquivo de saída é obrigatório.")

            # Garante que o diretório existe
            if not os.path.exists(self.save_directory):
                raise FileNotFoundError(f"Diretório não encontrado: {self.save_directory}")

            # Lista de registros a serem filtrados
            records = [record.strip() for record in record_numbers.split(",") if record.strip()]
            if not records:
                raise ValueError("Por favor, insira ao menos um número de registro válido.")

            # Prepara um dicionário para armazenar os dados por tipo de registro
            dataframes = {}
            c100_to_c170 = {}  # Relacionamento C100 e C170

            for file_path in self.selected_files:
                with open(file_path, "r", encoding="latin1") as f:
                    content = f.readlines()
                    current_c100 = None

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

                            # Lógica para relacionar C100 e C170, se ativada
                            if relate_c100_c170:
                                if record_type == "C100":
                                    current_c100 = tuple(fields)
                                    if current_c100 not in c100_to_c170:
                                        c100_to_c170[current_c100] = []
                                elif record_type == "C170" and current_c100:
                                    c100_to_c170[current_c100].append(tuple(fields))

                            if record_type in records:
                                if record_type not in dataframes:
                                    dataframes[record_type] = []
                                dataframes[record_type].append(fields)

            if not dataframes:
                raise ValueError("Nenhum registro correspondente encontrado.")

            # Filtra as colunas selecionadas, se fornecidas
            for record_type in dataframes:
                if selected_columns:
                    selected_columns_indices = [int(column_index) for column_index in selected_columns]
                    dataframes[record_type] = [
                        [field for idx, field in enumerate(row) if idx in selected_columns_indices]
                        for row in dataframes[record_type]
                    ]

            # Define o caminho de salvamento, garantindo que tenha extensão .xlsx
            save_path = os.path.join(
                self.save_directory,
                file_name if file_name.endswith(".xlsx") else f"{file_name}.xlsx"
            )

            # Salva os registros no arquivo Excel
            with pd.ExcelWriter(save_path, engine="openpyxl") as writer:
                for record_type, data in dataframes.items():
                    if data:  # Certifique-se de que há conteúdo para salvar
                        df = pd.DataFrame(data)
                        df.to_excel(writer, sheet_name=record_type, index=False, header=False)

                # Adiciona aba para o relacionamento C100 e C170, se ativado
                if relate_c100_c170 and c100_to_c170:
                    c100_c170_data = []
                    for c100, c170_list in c100_to_c170.items():
                        for c170 in c170_list:
                            c100_c170_data.append(list(c100) + list(c170))

                    if c100_c170_data:
                        df = pd.DataFrame(c100_c170_data)
                        df.to_excel(writer, sheet_name="C100_C170", index=False, header=False)

            app.show_notification(
                title="Processamento Concluído",
                message=f"Arquivo salvo em: {save_path}",
            )
            

            return {"success": True, "message": f"Processo concluído! Arquivo salvo em: {save_path}"}
            
        except FileNotFoundError as e:
            error_message = f"Erro no Diretório: {str(e)}"
            app.show_notification(title="Erro no Diretório", message=error_message)
            
            return {"success": False, "message": error_message}
        except Exception as e:
            error_message = f"Erro no Processamento: {str(e)}"
            app.show_notification(title="Erro no Processamento", message=error_message)
            
            return {"success": False, "message": error_message}






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
    @Bridge(result=dict)
    def get_columns(self):
        """Analisa os arquivos selecionados e retorna os números de registro disponíveis."""
        try:
            if not self.selected_files:
                raise ValueError("Nenhum arquivo selecionado para analisar.")

            record_numbers = set()
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
                        if len(fields) > 0:
                            record_numbers.add(fields[0])

            if not record_numbers:
                raise ValueError("Nenhum número de registro encontrado nos arquivos.")

            return {"success": True, "recordNumbers": sorted(record_numbers)}
        except Exception as e:
            return {"success": False, "message": f"Erro ao identificar números de registro: {e}"}
    
    @Bridge(result=dict)
    def convert_txt_to_excel_bulk(self):
        """
        Converte múltiplos arquivos TXT para Excel, criando uma aba para cada registro.
        """
        try:
            if not self.selected_files:
                raise ValueError("Nenhum arquivo selecionado para conversão.")
            if not self.save_directory:
                raise ValueError("Nenhum diretório de salvamento selecionado.")

            # Função para limpar os nomes das abas
            def sanitize_sheet_name(name):
                invalid_chars = ['*', '/', '\\', '?', '[', ']', ':']
                for char in invalid_chars:
                    name = name.replace(char, "_")  # Substitui caracteres inválidos por "_"
                return name[:31]  # Limita o nome da aba a 31 caracteres

            for txt_file_path in self.selected_files:
                try:
                    # Tenta abrir o arquivo com codificação UTF-8
                    with open(txt_file_path, "r", encoding="utf-8") as txt_file:
                        lines = txt_file.readlines()
                except UnicodeDecodeError:
                    # Se falhar, tenta abrir com ISO-8859-1
                    with open(txt_file_path, "r", encoding="latin1") as txt_file:
                        lines = txt_file.readlines()

                # Dicionário para armazenar os dados organizados por registro
                records = {}

                # Processa as linhas e organiza por tipo de registro
                for line in lines:
                    line = "".join(char if char.isprintable() else " " for char in line)
                    line = line.strip()
                    if not line:
                        continue

                    fields = line.split("|")
                    if len(fields) > 1:  # Verifica se há pelo menos um registro válido
                        record_type = fields[1]  # O tipo de registro está no segundo campo (após o delimitador "|")
                        if record_type not in records:
                            records[record_type] = []
                        records[record_type].append(fields)

                # Define o caminho de saída
                output_file = os.path.join(
                    self.save_directory,
                    os.path.splitext(os.path.basename(txt_file_path))[0] + ".xlsx"
                )

                # Salva os dados em um arquivo Excel com abas separadas
                with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
                    for record_type, data in records.items():
                        if data:
                            # Sanitiza o nome da aba e limita a 31 caracteres
                            sheet_name = sanitize_sheet_name(record_type)
                            df = pd.DataFrame(data)
                            df.to_excel(writer, sheet_name=sheet_name, index=False, header=False)

            return {"success": True, "message": "Todos os arquivos TXT foram convertidos para Excel com abas por registro."}
        except Exception as e:
            return {"success": False, "message": f"Erro ao converter TXT para Excel: {e}"}





    @Bridge(result=dict)
    def convert_excel_to_txt_bulk(self):
        """
        Converte múltiplos arquivos Excel para um único arquivo TXT por Excel,
        preservando zeros à esquerda.
        """
        try:
            if not self.selected_files:
                raise ValueError("Nenhum arquivo selecionado para conversão.")
            if not self.save_directory:
                raise ValueError("Nenhum diretório de salvamento selecionado.")

            for excel_file_path in self.selected_files:
                # Carregar todas as abas do Excel
                sheets = pd.read_excel(excel_file_path, sheet_name=None, header=None, dtype=str)

                # Concatenar todas as abas em um único DataFrame
                combined_df = pd.concat(sheets.values(), ignore_index=True)

                # Substituir valores NaN por strings vazias
                combined_df.fillna("", inplace=True)

                # Gera linhas no formato TXT
                lines = []
                for row in combined_df.values:
                    # Converte os valores para strings e preserva todos os dados
                    cleaned_row = list(map(str, row))

                    # Remove campos vazios do final da linha
                    while cleaned_row and cleaned_row[-1] == "":
                        cleaned_row.pop()

                    # Adiciona a linha formatada ao resultado
                    lines.append("|".join(cleaned_row) + "|")

                # Define o caminho de saída
                output_file = os.path.join(
                    self.save_directory,
                    f"{os.path.splitext(os.path.basename(excel_file_path))[0]}.txt"
                )

                # Salva no formato TXT
                with open(output_file, "w", encoding="utf-8") as txt_file:
                    txt_file.write("\n".join(lines))

            return {"success": True, "message": "Todos os arquivos Excel foram convertidos para TXT."}
        except Exception as e:
            return {"success": False, "message": f"Erro ao converter Excel para TXT: {e}"}

    @Bridge(result=dict)
    def get_signals(self):
        """Retorna os sinais disponíveis."""
        return {
            "finished": self.worker_signals.finished,
            "error": self.worker_signals.error,
            "notification": self.worker_signals.notification,
        }


        
    @Bridge(result=str)
    def select_directory_convert(self):
        """Seleciona o diretório de salvamento."""
        try:
            directory = app.select_directory_dialog(dir=os.getcwd())
            if directory:
                self.save_directory = directory
                app.show_notification(
                    title="Diretório Selecionado",
                    message=f"Diretório selecionado: {self.save_directory}",
                )
                return self.save_directory
            app.show_notification(
                title="Nenhum Diretório Selecionado",
                message="Nenhum diretório foi selecionado.",
            )
            return ""
        except Exception as e:
            app.show_notification(
                title="Erro ao Selecionar Diretório",
                message=f"Erro: {str(e)}",
            )
            return ""


#Na inicialização da sua aplicação
api_instance = CustomAPI() #Instancia a classe
api_instance.worker_signals.finished.connect(api_instance.handle_finished)
api_instance.worker_signals.error.connect(api_instance.handle_error)
api_instance.worker_signals.notification.connect(api_instance.handle_notification)


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

