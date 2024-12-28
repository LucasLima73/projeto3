// Interface para os dados que serão incorporados à licença
export interface LicenseData {
    id: string;
    expirationDate: string;
  }
  
  // Função para converter Base64 de volta para texto
  function decodeBase64(input: string): string {
    return decodeURIComponent(escape(atob(input)));
  }
  
  // Decodifica a licença para obter os dados originais
  export function decodeLicense(license: string): LicenseData | null {
    try {
      // Remove hífens e caracteres de preenchimento
      const strippedLicense = license.replace(/-/g, '').replace(/X+$/, '');
  
      // Decodifica o Base64 para texto original
      const decodedData = decodeBase64(strippedLicense);
  
      // Divide os dados em ID e data
      const [id, expirationDate] = decodedData.split(':');
  
      // Verifica se o formato é válido
      if (!id || !expirationDate) {
        throw new Error('Formato inválido.');
      }
  
      // Reconstrói a data de expiração no formato YYYY-MM-DD
      const formattedDate = `${expirationDate.slice(0, 4)}-${expirationDate.slice(4, 6)}-${expirationDate.slice(6, 8)}`;
  
      return { id, expirationDate: formattedDate };
    } catch (error) {
      console.error(error);
      return null; // Retorna null em caso de erro
    }
  }
  