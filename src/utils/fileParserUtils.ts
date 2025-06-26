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

// Helper function to convert binary string to readable text
function extractReadableText(binaryString: string): string {
  const textChunks: string[] = []
  
  // Strategy 1: Extract text between common XML tags
  const xmlTextMatches = binaryString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
  if (xmlTextMatches) {
    xmlTextMatches.forEach(match => {
      const textMatch = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/)
      if (textMatch && textMatch[1]) {
        const text = textMatch[1]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
        textChunks.push(text)
      }
    })
  }
  
  // Strategy 2: Find readable sequences between null bytes
  if (textChunks.length === 0) {
    const nullSeparatedParts = binaryString.split('\x00').filter(part => part.length > 0)
    for (const part of nullSeparatedParts) {
      // Look for sequences with at least 5 readable characters
      const readableMatches = part.match(/[a-zA-ZÀ-ÿ\s.,!?;:()-]{5,}/g)
      if (readableMatches) {
        readableMatches.forEach(match => {
          const cleaned = match.trim()
          if (cleaned.length > 5 && cleaned.match(/[a-zA-ZÀ-ÿ]{2,}/)) {
            textChunks.push(cleaned)
          }
        })
      }
    }
  }
  
  // Strategy 3: Extract text from potential Word document structure
  if (textChunks.length === 0) {
    // Look for text after common Word document markers
    const wordPatterns = [
      /document\.xml.*?<w:t[^>]*>([^<]+)<\/w:t>/g,
      /word\/document\.xml.*?<w:t[^>]*>([^<]+)<\/w:t>/g,
      /<w:document[^>]*>.*?<w:t[^>]*>([^<]+)<\/w:t>/g
    ]
    
    for (const pattern of wordPatterns) {
      const matches = Array.from(binaryString.matchAll(pattern))
      matches.forEach(match => {
        if (match[1]) {
          textChunks.push(match[1])
        }
      })
    }
  }
  
  // Strategy 4: Last resort - extract any readable sequences
  if (textChunks.length === 0) {
    const readableSequences = binaryString.match(/[a-zA-ZÀ-ÿ\s.,!?;:()-]{10,}/g)
    if (readableSequences) {
      readableSequences.forEach(seq => {
        const words = seq.match(/[a-zA-ZÀ-ÿ]{3,}/g)
        if (words && words.length >= 2) {
          textChunks.push(seq.trim())
        }
      })
    }
  }
  
  return textChunks.join(' ')
}

// Improved DOCX parser with better text extraction
export async function parseDocxFile(file: File): Promise<ParsedFileContent> {
  const warnings: string[] = []
  
  try {
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    // Convert to binary string for processing
    let binaryString = ''
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i])
    }
    
    console.log('Processing DOCX file, size:', uint8Array.length, 'bytes')
    
    // Extract readable text using multiple strategies
    let extractedText = extractReadableText(binaryString)
    
    console.log('Extracted text length:', extractedText.length)
    console.log('First 100 chars:', extractedText.substring(0, 100))
    
    // If extraction failed, try with different encoding approaches
    if (!extractedText || extractedText.length < 20) {
      console.log('Primary extraction failed, trying alternative methods')
      
      // Try extracting as UTF-16
      try {
        const decoder = new TextDecoder('utf-16le', { fatal: false })
        const utf16Text = decoder.decode(buffer)
        const utf16Extracted = extractReadableText(utf16Text)
        if (utf16Extracted.length > extractedText.length) {
          extractedText = utf16Extracted
          console.log('UTF-16 extraction successful')
        }
      } catch (error) {
        console.log('UTF-16 extraction failed')
      }
      
      // Try extracting as Windows-1252
      try {
        const decoder = new TextDecoder('windows-1252', { fatal: false })
        const winText = decoder.decode(buffer)
        const winExtracted = extractReadableText(winText)
        if (winExtracted.length > extractedText.length) {
          extractedText = winExtracted
          console.log('Windows-1252 extraction successful')
        }
      } catch (error) {
        console.log('Windows-1252 extraction failed')
      }
    }
    
    // Final validation
    if (!extractedText || extractedText.length < 10) {
      throw new Error('Não foi possível extrair texto legível do arquivo DOCX. Tente: 1) Abrir no Word e salvar como arquivo .txt, 2) Copiar o texto e colar diretamente no campo manual, ou 3) Verificar se o arquivo não está corrompido.')
    }
    
    // Clean and validate the extracted text
    const cleanContent = cleanTextContent(extractedText)
    
    // More lenient validation for DOCX files
    const readableWords = cleanContent.match(/[a-zA-ZÀ-ÿ]{2,}/g)
    const isValid = readableWords && readableWords.length >= 5
    
    if (!isValid) {
      warnings.push('Texto extraído pode estar incompleto ou com problemas de codificação')
      warnings.push('Recomendamos salvar o arquivo como .txt no Word para melhor resultado')
    } else {
      warnings.push(`Texto extraído com sucesso: ${readableWords.length} palavras reconhecidas`)
    }
    
    warnings.push('Arquivo DOCX processado com múltiplas estratégias de extração')
    
    return {
      content: cleanContent,
      wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
      characterCount: cleanContent.length,
      fileType: 'docx',
      encoding: 'binary/xml',
      isValid: isValid || cleanContent.length > 50, // Be more lenient
      warnings
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar DOCX'
    console.error('DOCX parsing error:', error)
    throw new Error(errorMessage)
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

  // Final validation - be more lenient for DOCX files
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
    docx: 'Extração automática aprimorada com múltiplas estratégias. Para melhor resultado, salve como .txt',
    srt: 'Legendas serão convertidas removendo timestamps',
    vtt: 'Legendas WebVTT serão convertidas removendo marcações'
  }
  return recommendations[extension] || 'Formato suportado'
}
