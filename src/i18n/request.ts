import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers'; 
import path from 'path';
import fs from 'fs';

// Custom deep merge function to properly combine nested translation objects
interface DeepObject {
  [key: string]: any;
}

function deepMerge(...objects: DeepObject[]): DeepObject {
  const isObject = (obj: any): obj is DeepObject => obj && typeof obj === 'object' && !Array.isArray(obj);
  
  return objects.reduce((prev: DeepObject, obj: DeepObject) => {
    if (!obj) return prev;
    
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];
      
      if (isObject(pVal) && isObject(oVal)) {
        prev[key] = deepMerge(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });
    
    return prev;
  }, {});
}

// Function to recursively find all JSON files in a directory
interface FileSearchResult {
  results: string[];
}

function findJsonFiles(dir: string): string[] {
  let results: string[] = [];
  const items: string[] = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath: string = path.join(dir, item);
    const stat: fs.Stats = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findJsonFiles(fullPath));
    } else if (item.endsWith('.json')) {
      results.push(fullPath);
    }
  });

  return results;
}

// Function to safely load JSON file contents
interface JsonContent {
  [key: string]: any;
}

function loadJsonFile(filePath: string): JsonContent {
  try {
    const content: string = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error: unknown) {
    console.error(`Error loading file ${filePath}:`, error);
    return {};
  }
}

const locales = ['es', 'en']; // Add all your supported locales here

export default getRequestConfig(async ({requestLocale}:any) => {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || requestLocale || 'es';

  const localeDir = path.join(process.cwd(), 'locales', locale ); 
  
  try {
    const jsonFiles = findJsonFiles(localeDir);
    const translationModules = jsonFiles.map(file => loadJsonFile(file));
    const messages = deepMerge({}, ...translationModules);

    return {
      locale,
      messages
    };
  } catch (error) {
    console.error("Error loading translation files:", error);
    return {
      locale: 'es',
      messages: {}
    };
  }
});