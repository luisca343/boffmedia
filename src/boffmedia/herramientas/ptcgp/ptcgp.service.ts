import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PtcgpService {
  private readonly filePath = path.join(__dirname, '../../public/data/ptgcp/sets.json');

  async getSets(): Promise<any> {
    console.log(this.filePath)
    // Check if the file exists
    if (fs.existsSync(this.filePath)) {
      console.log('Se encontró el archivo');
      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(fileContent);
    } else {
      console.log('No se encontró el archivo');
      return this.getFromSerebii();
    }
  }

  private async getFromSerebii(): Promise<any> {
    const url = 'https://www.serebii.net/tcgpocket/sets.shtml';
    
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const result = {};
      let currentSection = null;

      $('h2, table').each((index, element) => {
        if (element.tagName === 'h2') {
          currentSection = $(element).text().trim();
          result[currentSection] = [];
        } else if (element.tagName === 'table' && currentSection) {
          $(element).find('tr').slice(1).each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 4) {  // Changed from 5 to 4 to include rows with missing data
              const packData = {
                logo: $(cells[0]).find('img').attr('src') || '',
                icon: $(cells[1]).find('img').attr('src') || '',
                setName: $(cells[2]).text().trim(),
                numberOfCards: $(cells[3]).text().trim(),
                releaseDate: cells.length >= 5 ? $(cells[4]).text().trim() : 'N/A',
              };
              
              // Convert relative URLs to absolute URLs
              if (packData.logo && !packData.logo.startsWith('http')) {
                packData.logo = `https://www.serebii.net${packData.logo}`;
              }
              if (packData.icon && !packData.icon.startsWith('http')) {
                packData.icon = `https://www.serebii.net${packData.icon}`;
              }

              // Only add non-empty sets
              if (packData.setName) {
                result[currentSection].push(packData);
              }
            }
          });
        }
      });

      // Remove empty sections
      Object.keys(result).forEach(key => {
        if (result[key].length === 0) {
          delete result[key];
        }
      });

      // Ensure the directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the result to a JSON file
      fs.writeFileSync(this.filePath, JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error('Error scraping Serebii:', error);
      throw new Error('Failed to scrape data from Serebii');
    }
  }
}