
// Utility functions for XML parsing

export interface WordTextNode {
  text: string
  formatting?: {
    bold?: boolean
    italic?: boolean
  }
}

// Extract text from Word document XML
export function extractWordDocumentText(xmlContent: string): string {
  try {
    console.log('Extracting text from Word XML, content length:', xmlContent.length)
    
    // Clean up the XML content
    const cleanXml = xmlContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\0/g, '')
    
    // Strategy 1: Use DOM Parser if available
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(cleanXml, 'text/xml')
        
        // Check for parsing errors
        const parserError = doc.querySelector('parsererror')
        if (!parserError) {
          const textNodes = doc.querySelectorAll('w\\:t, t')
          const textParts: string[] = []
          
          textNodes.forEach(node => {
            const text = node.textContent?.trim()
            if (text && text.length > 0) {
              textParts.push(text)
            }
          })
          
          if (textParts.length > 0) {
            const result = textParts.join(' ')
            console.log('DOM Parser extraction successful:', textParts.length, 'text nodes')
            return result
          }
        }
      } catch (domError) {
        console.log('DOM Parser failed:', domError)
      }
    }
    
    // Strategy 2: Regex-based extraction for w:t tags
    const textMatches = extractTextWithRegex(cleanXml)
    if (textMatches.length > 0) {
      console.log('Regex extraction successful:', textMatches.length, 'matches')
      return textMatches.join(' ')
    }
    
    // Strategy 3: Extract any readable text sequences
    const readableText = extractReadableSequences(cleanXml)
    if (readableText.length > 20) {
      console.log('Readable sequences extraction successful')
      return readableText
    }
    
    throw new Error('No readable text found in XML content')
  } catch (error) {
    console.error('XML text extraction failed:', error)
    throw error
  }
}

function extractTextWithRegex(xml: string): string[] {
  const textParts: string[] = []
  
  // Pattern for w:t tags with various possible attributes
  const patterns = [
    /<w:t[^>]*?>(.*?)<\/w:t>/gs,
    /<w:t>(.*?)<\/w:t>/gs,
    /<t[^>]*?>(.*?)<\/t>/gs,
    /<t>(.*?)<\/t>/gs
  ]
  
  for (const pattern of patterns) {
    const matches = xml.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) {
        const text = decodeXmlEntities(match[1].trim())
        if (text.length > 0 && isReadableText(text)) {
          textParts.push(text)
        }
      }
    }
  }
  
  return textParts
}

function extractReadableSequences(content: string): string {
  // Remove XML tags and extract text
  const withoutTags = content.replace(/<[^>]*>/g, ' ')
  
  // Find sequences of readable characters
  const readableMatches = withoutTags.match(/[a-zA-ZÀ-ÿ0-9\s.,!?;:()'"/-]{10,}/g)
  
  if (readableMatches) {
    return readableMatches
      .map(match => match.trim())
      .filter(text => text.length > 5 && isReadableText(text))
      .join(' ')
  }
  
  return ''
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function isReadableText(text: string): boolean {
  // Check if text contains actual readable words
  const words = text.match(/[a-zA-ZÀ-ÿ]{2,}/g)
  return words !== null && words.length > 0
}

// Validate if content looks like Word document XML
export function isWordDocumentXml(content: string): boolean {
  const wordIndicators = [
    'w:document',
    'w:body',
    'w:p',
    'w:t',
    'xmlns:w',
    'word/document'
  ]
  
  return wordIndicators.some(indicator => content.includes(indicator))
}
