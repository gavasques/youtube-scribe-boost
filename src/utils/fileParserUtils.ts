// Utility functions for parsing different file types

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

// Improved DOCX parser with better error handling
export async function parseDocxFile(file: File): Promise<ParsedFileContent> {
  const warnings: string[] = [
    'Arquivos DOCX podem não ser extraídos perfeitamente',
    'Para melhor resultado, salve como .txt no Word'
  ]
  
  try {
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    // Convert to string with better encoding handling
    let binaryString: string
    try {
      // Try UTF-8 decoding first
      const decoder = new TextDecoder('utf-8', { fatal: true })
      binaryString = decoder.decode(uint8Array)
    } catch {
      // Fallback to Latin-1 for binary compatibility
      binaryString = String.fromCharCode.apply(null, Array.from(uint8Array))
    }
    
    // Improved text extraction with better filtering
    const xmlContent = binaryString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
    let extractedText = ''
    
    if (xmlContent) {
      extractedText = xmlContent
        .map(match => {
          // Extract content between tags
          const textMatch = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/)
          return textMatch ? textMatch[1] : ''
        })
        .filter(text => text.length > 0)
        .join(' ')
    }
    
    // If no XML content found, try alternative extraction
    if (!extractedText) {
      const textMatches = binaryString.match(/>([^<\x00-\x1F\x7F-\x9F]{3,})</g)
      if (textMatches) {
        extractedText = textMatches
          .map(match => match.slice(1, -1))
          .filter(text => {
            // Better filtering for readable text
            return text.length > 2 && 
                   !/^[A-Z0-9_]{2,}$/.test(text) && // Skip constants/IDs
                   !/^\d+$/.test(text) && // Skip pure numbers
                   /[a-zA-ZÀ-ÿ]/.test(text) && // Must contain letters
                   !text.includes('xml') &&
                   !text.includes('<?')
          })
          .join(' ')
      }
    }
    
    if (!extractedText || extractedText.length < 20) {
      throw new Error('Não foi possível extrair texto legível do arquivo DOCX')
    }
    
    const cleanContent = cleanTextContent(extractedText)
    const validation = validateTextContent(cleanContent)
    
    // Add format-specific warnings
    if (!validation.isValid) {
      warnings.push('Texto extraído pode estar corrompido')
    }

    return {
      content: cleanContent,
      wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
      characterCount: cleanContent.length,
      fileType: 'docx',
      encoding: 'binary/xml',
      isValid: validation.isValid,
      warnings: [...warnings, ...validation.warnings]
    }
  } catch (error) {
    throw new Error('Erro ao processar arquivo DOCX. Recomendação: abra o arquivo no Word e salve como .txt')
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

  // Validate file size (max 10MB, increased from 5MB)
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
  if (!result.isValid) {
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
    docx: 'Documento Word (.docx)',
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
    docx: 'Para melhor resultado, salve como .txt no Word antes do upload',
    srt: 'Legendas serão convertidas removendo timestamps',
    vtt: 'Legendas WebVTT serão convertidas removendo marcações'
  }
  return recommendations[extension] || 'Formato suportado'
}
