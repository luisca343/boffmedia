import { useState } from 'react'

interface JsonItem {
    [key: string]: any;
}

interface JsonData {
    results: {
        items: JsonItem[];
    }[];
}

export function useJsonToDbUnit() {
  const [tableName, setTableName] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [xmlOutput, setXmlOutput] = useState('')

  const convertToXml = () => {
    try {
      const jsonData: JsonData = JSON.parse(jsonInput);
      const items: JsonItem[] = jsonData.results[0].items;

      let xml = `<dataset>\n`;
      items.forEach((item: JsonItem) => {
        xml += `  <${tableName.toUpperCase()} `;
        Object.entries(item).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            let formattedValue = value;
            if (typeof value === 'string' && value.includes('/')) {
              const [day, month, year] = value.split('/');
              formattedValue = `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;
            }
            xml += `${key.toUpperCase()}="${formattedValue}" `;
          }
        });
        xml += `/>\n`;
      });
      xml += `</dataset>`;
      setXmlOutput(xml);
    } catch (error) {
      setXmlOutput('Error al analizar JSON. Por favor, revisa tu entrada.');
    }
  };

  return {
    tableName,
    setTableName,
    jsonInput,
    setJsonInput,
    xmlOutput,
    convertToXml
  }
}