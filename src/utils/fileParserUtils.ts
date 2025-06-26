// Utility functions for parsing different file types

import { SimpleZipReader } from './zipUtils'
import { extractWordDocumentText, isWordDocumentXml } from './xmlUtils'

export interface ParsedFileContent {
  content: string
  wordCount: number
  characterCount: number
  fileType: string
  encoding?: string
  isValid: boolean
  warnings?: string[]
}

// Detect text encoding
function detectEncoding(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer)
  
  // Check for BOM (Byte Order Mark)
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    return 'utf-8'
  }
  if (uint8Array.length >= 2 && uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
    return 'utf-16le'
  }
  if (uint8Array.length >= 2 && uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
    return 'utf-16be'
  }
  
  // Default to UTF-8
  return 'utf-8'
}

// Validate if text contains readable content
function validateTextContent(text: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Check for excessive binary characters
  const binaryChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g)
  if (binaryChars && binaryChars.length > text.length * 0.1) {
    warnings.push('Texto contém muitos caracteres binários. Considere usar arquivo .txt')
    return { isValid: false, warnings }
  }
  
  // Check for readable words
  const words = text.match(/[a-zA-ZÀ-ÿ]{3,}/g)
  if (!words || words.length < 10) {
    warnings.push('Poucos textos legíveis encontrados. Verifique o formato do arquivo')
    return { isValid: false, warnings }
  }
  
  // Check for excessive repeated characters
  const repeatedChars = text.match(/(.)\1{10,}/g)
  if (repeatedChars && repeatedChars.length > 5) {
    warnings.push('Texto contém caracteres repetidos excessivamente')
  }
  
  return { isValid: true, warnings }
}

// Clean and normalize text content
function cleanTextContent(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove control characters but keep basic formatting
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove excessive punctuation repetition
    .replace(/[.,;:!?]{3,}/g, '...')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Parse plain text files with encoding detection
export async function parseTextFile(file: File): Promise<ParsedFileContent> {
  const buffer = await file.arrayBuffer()
  const encoding = detectEncoding(buffer)
  
  let content: string
  try {
    const decoder = new TextDecoder(encoding)
    content = decoder.decode(buffer)
  } catch (error) {
    // Fallback to UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: false })
    content = decoder.decode(buffer)
  }
  
  const cleanContent = cleanTextContent(content)
  const validation = validateTextContent(cleanContent)
  
  return {
    content: cleanContent,
    wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
    characterCount: cleanContent.length,
    fileType: 'txt',
    encoding,
    isValid: validation.isValid,
    warnings: validation.warnings
  }
}

// Parse CSV files - extract text content from all cells
export async function parseCsvFile(file: File): Promise<ParsedFileContent> {
  const buffer = await file.arrayBuffer()
  const encoding = detectEncoding(buffer)
  
  let csvContent: string
  try {
    const decoder = new TextDecoder(encoding)
    csvContent = decoder.decode(buffer)
  } catch (error) {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    csvContent = decoder.decode(buffer)
  }
  
  // Simple CSV parsing - split by lines and commas, join all text
  const lines = csvContent.split('\n')
  const allText = lines
    .map(line => {
      // Split by comma and remove quotes, join with space
      return line.split(',')
        .map(cell => cell.replace(/^["']|["']$/g, '').trim())
        .filter(cell => cell.length > 0)
        .join(' ')
    })
    .filter(line => line.length > 0)
    .join('\n')

  const cleanContent = cleanTextContent(allText)
  const validation = validateTextContent(cleanContent)

  return {
    content: cleanContent,
    wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
    characterCount: cleanContent.length,
    fileType: 'csv',
    encoding,
    isValid: validation.isValid,
    warnings: validation.warnings
  }
}

// Completely rewritten DOCX parser with robust ZIP and XML handling
export async function parseDocxFile(file: File): Promise<ParsedFileContent> {
  const warnings: string[] = []
  
  try {
    const buffer = await file.arrayBuffer()
    console.log('Processing DOCX file:', file.name, 'Size:', buffer.byteLength, 'bytes')
    
    if (buffer.byteLength === 0) {
      throw new Error('Arquivo DOCX está vazio')
    }

    // Step 1: Extract document.xml from ZIP
    const zipReader = new SimpleZipReader(buffer)
    let documentXml = zipReader.extractFile('word/document.xml')
    
    if (!documentXml || documentXml.length === 0) {
      console.log('Primary extraction failed, trying alternatives...')
      
      // Try alternative file paths
      const alternatives = [
        'word/document.xml',
        'word\\document.xml',
        'document.xml',
        'content.xml'
      ]
      
      for (const altPath of alternatives) {
        documentXml = zipReader.extractFile(altPath)
        if (documentXml && documentXml.length > 0) {
          console.log('Found document XML at:', altPath)
          break
        }
      }
    }
    
    if (!documentXml || documentXml.length === 0) {
      throw new Error('Não foi possível extrair o arquivo document.xml do DOCX. Verifique se o arquivo não está corrompido.\n\nTente:\n1. Abrir o arquivo no Microsoft Word\n2. Salvar como "Texto Simples (*.txt)"\n3. Fazer upload do arquivo .txt')
    }
    
    console.log('Successfully extracted document.xml, size:', documentXml.length, 'bytes')
    
    // Step 2: Convert XML bytes to string with encoding detection
    let xmlContent: string
    try {
      // Try UTF-8 first (most common)
      xmlContent = new TextDecoder('utf-8', { fatal: true }).decode(documentXml)
      console.log('Successfully decoded as UTF-8')
    } catch (error) {
      console.log('UTF-8 decode failed, trying alternatives...')
      try {
        // Try UTF-16 Little Endian
        xmlContent = new TextDecoder('utf-16le', { fatal: false }).decode(documentXml)
        console.log('Successfully decoded as UTF-16LE')
      } catch {
        try {
          // Try Windows-1252 (legacy)
          xmlContent = new TextDecoder('windows-1252', { fatal: false }).decode(documentXml)
          console.log('Successfully decoded as Windows-1252')
        } catch {
          // Last resort - try without fatal flag
          xmlContent = new TextDecoder('utf-8', { fatal: false }).decode(documentXml)
          console.log('Decoded with UTF-8 (non-fatal)')
        }
      }
    }
    
    if (!xmlContent || xmlContent.length < 10) {
      throw new Error('Conteúdo XML extraído está vazio ou corrompido')
    }
    
    console.log('XML content length:', xmlContent.length)
    console.log('XML preview (first 300 chars):', xmlContent.substring(0, 300))
    
    // Step 3: Validate XML content
    if (!isWordDocumentXml(xmlContent)) {
      console.log('Warning: Content may not be a valid Word document')
      warnings.push('Conteúdo pode não ser um documento Word válido')
    }
    
    // Step 4: Extract text from XML
    let extractedText: string
    try {
      extractedText = extractWordDocumentText(xmlContent)
    } catch (xmlError) {
      console.error('XML text extraction failed:', xmlError)
      throw new Error(`Erro ao processar XML do documento: ${xmlError instanceof Error ? xmlError.message : 'Erro desconhecido'}\n\nO arquivo pode estar corrompido ou usar um formato não suportado.`)
    }
    
    if (!extractedText || extractedText.length < 5) {
      throw new Error('Não foi possível extrair texto legível do documento.\n\nSugestões:\n1. Abra o arquivo no Microsoft Word\n2. Verifique se há conteúdo de texto no documento\n3. Salve como arquivo .txt\n4. Tente fazer upload do arquivo .txt')
    }
    
    console.log('Text extraction successful, length:', extractedText.length)
    
    // Step 5: Clean and validate extracted text
    const cleanContent = cleanTextContent(extractedText)
    
    // More lenient validation for DOCX
    const readableWords = cleanContent.match(/[a-zA-ZÀ-ÿ]{2,}/g)
    const wordCount = readableWords ? readableWords.length : 0
    const isValid = wordCount >= 3 // Very lenient threshold
    
    if (isValid) {
      warnings.push(`Texto extraído com sucesso: ${wordCount} palavras reconhecidas`)
      warnings.push('Arquivo DOCX processado com descompactação ZIP avançada')
    } else {
      warnings.push('Texto extraído pode estar incompleto ou corrompido')
    }
    
    return {
      content: cleanContent,
      wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
      characterCount: cleanContent.length,
      fileType: 'docx',
      encoding: 'zip/xml-advanced',
      isValid: isValid || cleanContent.length > 20,
      warnings
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar DOCX'
    console.error('DOCX parsing error:', error)
    
    // Provide comprehensive error message with solutions
    throw new Error(`${errorMessage}

SOLUÇÕES RECOMENDADAS:
1. 📝 Abra o arquivo no Microsoft Word
2. 💾 Vá em "Arquivo" → "Salvar Como"
3. 📄 Escolha "Texto Simples (*.txt)" como formato
4. ⬆️ Faça upload do arquivo .txt gerado
5. ✂️ Ou copie o texto diretamente e cole no campo manual

O parser DOCX melhorado suporta:
• Descompactação ZIP avançada
• Múltiplas codificações de texto
• Extração XML robusta
• Tratamento de erros detalhado`)
  }
}

// Parse SRT subtitle files
export async function parseSrtFile(file: File): Promise<ParsedFileContent> {
  const buffer = await file.arrayBuffer()
  const encoding = detectEncoding(buffer)
  
  let content: string
  try {
    const decoder = new TextDecoder(encoding)
    content = decoder.decode(buffer)
  } catch (error) {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    content = decoder.decode(buffer)
  }
  
  // Extract only text content from SRT, removing timestamps and sequence numbers
  const srtLines = content.split('\n')
  const textLines: string[] = []
  
  for (let i = 0; i < srtLines.length; i++) {
    const line = srtLines[i].trim()
    
    // Skip empty lines, sequence numbers, and timestamp lines
    if (line === '' || 
        /^\d+$/.test(line) || 
        /^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}$/.test(line)) {
      continue
    }
    
    textLines.push(line)
  }
  
  const extractedText = textLines.join(' ')
  const cleanContent = cleanTextContent(extractedText)
  const validation = validateTextContent(cleanContent)
  
  return {
    content: cleanContent,
    wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
    characterCount: cleanContent.length,
    fileType: 'srt',
    encoding,
    isValid: validation.isValid,
    warnings: validation.warnings
  }
}

// Parse VTT subtitle files
export async function parseVttFile(file: File): Promise<ParsedFileContent> {
  const buffer = await file.arrayBuffer()
  const encoding = detectEncoding(buffer)
  
  let content: string
  try {
    const decoder = new TextDecoder(encoding)
    content = decoder.decode(buffer)
  } catch (error) {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    content = decoder.decode(buffer)
  }
  
  // Extract only text content from WebVTT
  const vttLines = content.split('\n')
  const textLines: string[] = []
  
  for (let i = 0; i < vttLines.length; i++) {
    const line = vttLines[i].trim()
    
    // Skip WEBVTT header, empty lines, timestamps, and cue settings
    if (line === '' || 
        line === 'WEBVTT' ||
        /^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/.test(line) ||
        line.startsWith('NOTE ') ||
        line.includes(' --> ')) {
      continue
    }
    
    textLines.push(line)
  }
  
  const extractedText = textLines.join(' ')
  const cleanContent = cleanTextContent(extractedText)
  const validation = validateTextContent(cleanContent)
  
  return {
    content: cleanContent,
    wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
    characterCount: cleanContent.length,
    fileType: 'vtt',
    encoding,
    isValid: validation.isValid,
    warnings: validation.warnings
  }
}

// Main parser function that routes to appropriate parser
export async function parseFile(file: File): Promise<ParsedFileContent> {
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.split('.').pop()

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 10MB')
  }

  let result: ParsedFileContent

  switch (fileExtension) {
    case 'txt':
      result = await parseTextFile(file)
      break
    
    case 'srt':
      result = await parseSrtFile(file)
      break
      
    case 'vtt':
      result = await parseVttFile(file)
      break
    
    case 'csv':
      result = await parseCsvFile(file)
      break
    
    case 'docx':
      result = await parseDocxFile(file)
      break
    
    default:
      throw new Error(`Formato de arquivo não suportado: .${fileExtension}. Use: .txt, .srt, .vtt, .csv, .docx`)
  }

  // Final validation
  if (!result.isValid && fileExtension !== 'docx') {
    throw new Error(`Arquivo processado mas com problemas: ${result.warnings?.join(', ')}`)
  }

  return result
}

// Validate file type
export function isValidFileType(file: File): boolean {
  const allowedExtensions = ['txt', 'csv', 'docx', 'srt', 'vtt']
  const fileExtension = file.name.toLowerCase().split('.').pop()
  return allowedExtensions.includes(fileExtension || '')
}

// Get file type display name
export function getFileTypeDisplayName(extension: string): string {
  const displayNames: Record<string, string> = {
    txt: 'Texto (.txt) - Recomendado',
    csv: 'Planilha CSV (.csv)',
    docx: 'Documento Word (.docx) - Processamento Aprimorado',
    srt: 'Legenda SRT (.srt)',
    vtt: 'Legenda WebVTT (.vtt)'
  }
  return displayNames[extension] || extension.toUpperCase()
}

// Get file type recommendation
export function getFileTypeRecommendation(extension: string): string {
  const recommendations: Record<string, string> = {
    txt: 'Formato ideal para transcrições',
    csv: 'Dados tabulares serão convertidos em texto corrido',
    docx: 'Processamento completo com descompactação ZIP e parser XML. Para melhor compatibilidade, salve como .txt',
    srt: 'Legendas serão convertidas removendo timestamps',
    vtt: 'Legendas WebVTT serão convertidas removendo marcações'
  }
  return recommendations[extension] || 'Formato suportado'
}
