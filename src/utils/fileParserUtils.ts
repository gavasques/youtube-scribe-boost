// Utility functions for parsing different file types

export interface ParsedFileContent {
  content: string
  wordCount: number
  characterCount: number
  fileType: string
}

// Parse plain text files
export async function parseTextFile(file: File): Promise<ParsedFileContent> {
  const content = await file.text()
  return {
    content: content.trim(),
    wordCount: content.trim().split(/\s+/).filter(Boolean).length,
    characterCount: content.length,
    fileType: 'txt'
  }
}

// Parse CSV files - extract text content from all cells
export async function parseCsvFile(file: File): Promise<ParsedFileContent> {
  const csvContent = await file.text()
  
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

  return {
    content: allText.trim(),
    wordCount: allText.trim().split(/\s+/).filter(Boolean).length,
    characterCount: allText.length,
    fileType: 'csv'
  }
}

// Parse DOCX files using basic extraction
export async function parseDocxFile(file: File): Promise<ParsedFileContent> {
  try {
    // For a full DOCX parser, we would need a library like mammoth
    // For now, we'll create a basic implementation that attempts to extract text
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Convert to string and try to extract readable text
    // This is a very basic approach - in production, use a proper DOCX library
    const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array))
    
    // Extract text between XML tags (very basic approach)
    const textMatches = binaryString.match(/>([^<]+)</g)
    let extractedText = ''
    
    if (textMatches) {
      extractedText = textMatches
        .map(match => match.slice(1, -1)) // Remove > and <
        .filter(text => {
          // Filter out XML noise and keep readable text
          return text.length > 2 && 
                 !text.includes('xml') && 
                 !text.includes('<?') &&
                 !/^\d+$/.test(text) && // Skip pure numbers
                 !/^[A-Z]{2,}$/.test(text) && // Skip all caps short strings
                 text.trim().length > 0
        })
        .join(' ')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }

    if (!extractedText || extractedText.length < 10) {
      throw new Error('Não foi possível extrair texto legível do arquivo DOCX')
    }

    return {
      content: extractedText,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      characterCount: extractedText.length,
      fileType: 'docx'
    }
  } catch (error) {
    throw new Error('Erro ao processar arquivo DOCX. Tente converter para .txt primeiro.')
  }
}

// Main parser function that routes to appropriate parser
export async function parseFile(file: File): Promise<ParsedFileContent> {
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.split('.').pop()

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
  }

  switch (fileExtension) {
    case 'txt':
    case 'srt':
    case 'vtt':
      return parseTextFile(file)
    
    case 'csv':
      return parseCsvFile(file)
    
    case 'docx':
      return parseDocxFile(file)
    
    default:
      throw new Error(`Formato de arquivo não suportado: .${fileExtension}`)
  }
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
    txt: 'Texto (.txt)',
    csv: 'Planilha CSV (.csv)',
    docx: 'Documento Word (.docx)',
    srt: 'Legenda SRT (.srt)',
    vtt: 'Legenda WebVTT (.vtt)'
  }
  return displayNames[extension] || extension.toUpperCase()
}
