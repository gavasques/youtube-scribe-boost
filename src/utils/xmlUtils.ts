
// Utility functions for XML parsing

export interface WordTextNode {
  text: string
  formatting?: {
    bold?: boolean
    italic?: boolean
  }
}

// Extract text from Word document XML with improved error handling
export function extractWordDocumentText(xmlContent: string): string {
  try {
    console.log('Extracting text from Word XML, content length:', xmlContent.length)
    
    // First, let's check if this looks like XML
    if (!xmlContent.includes('<') || !xmlContent.includes('>')) {
      console.log('Content does not appear to be XML')
      throw new Error('Conteúdo não parece ser XML válido')
    }

    // Clean up the XML content more thoroughly
    let cleanXml = xmlContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\0/g, '')
      .trim()

    // Remove any potential binary data at the beginning
    const xmlStartIndex = cleanXml.indexOf('<?xml')
    if (xmlStartIndex > 0) {
      cleanXml = cleanXml.substring(xmlStartIndex)
    } else {
      // Look for document root if no XML declaration
      const docStartIndex = cleanXml.indexOf('<w:document')
      if (docStartIndex > 0) {
        cleanXml = cleanXml.substring(docStartIndex)
      }
    }

    console.log('Cleaned XML preview:', cleanXml.substring(0, 500))

    // Strategy 1: Use DOM Parser if available (most reliable)
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(cleanXml, 'text/xml')
        
        // Check for parsing errors
        const parserError = doc.querySelector('parsererror')
        if (!parserError) {
          const textParts = this.extractTextFromDOM(doc)
          if (textParts.length > 0) {
            const result = textParts.join(' ').trim()
            console.log('DOM Parser extraction successful:', textParts.length, 'text nodes, result length:', result.length)
            return result
          }
        } else {
          console.log('DOM Parser error:', parserError.textContent)
        }
      } catch (domError) {
        console.log('DOM Parser failed:', domError)
      }
    }
    
    // Strategy 2: Regex-based extraction for w:t tags
    const regexResult = this.extractTextWithRegex(cleanXml)
    if (regexResult.length > 0) {
      const result = regexResult.join(' ').trim()
      console.log('Regex extraction successful:', regexResult.length, 'matches, result length:', result.length)
      return result
    }
    
    // Strategy 3: Extract any readable text sequences
    const readableText = this.extractReadableSequences(cleanXml)
    if (readableText.length > 20) {
      console.log('Readable sequences extraction successful, result length:', readableText.length)
      return readableText
    }
    
    throw new Error('Nenhum texto legível encontrado no documento XML')
  } catch (error) {
    console.error('XML text extraction failed:', error)
    throw new Error(`Erro ao extrair texto do XML: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

function extractTextFromDOM(doc: Document): string[] {
  const textParts: string[] = []
  
  // Try multiple selectors for different XML namespaces
  const selectors = [
    'w\\:t', 't',  // Standard Word text tags
    'text', 'w\\:text',  // Alternative text tags
    '[*|localName="t"]'  // Namespace-agnostic approach
  ]
  
  for (const selector of selectors) {
    try {
      const textNodes = doc.querySelectorAll(selector)
      textNodes.forEach(node => {
        const text = node.textContent?.trim()
        if (text && text.length > 0) {
          textParts.push(text)
        }
      })
      
      if (textParts.length > 0) {
        break // Found text, no need to try other selectors
      }
    } catch (selectorError) {
      console.log('Selector failed:', selector, selectorError)
    }
  }
  
  return textParts
}

function extractTextWithRegex(xml: string): string[] {
  const textParts: string[] = []
  
  // Enhanced patterns for different XML structures
  const patterns = [
    // Standard Word text tags
    /<w:t[^>]*?>(.*?)<\/w:t>/gs,
    /<w:t>(.*?)<\/w:t>/gs,
    // Alternative text tags
    /<t[^>]*?>(.*?)<\/t>/gs,
    /<t>(.*?)<\/t>/gs,
    // Namespace-agnostic patterns
    /<[^:]*:t[^>]*?>(.*?)<\/[^:]*:t>/gs,
    // Text content patterns
    /<text[^>]*?>(.*?)<\/text>/gs,
    // Paragraph content as fallback
    /<w:p[^>]*?>(.*?)<\/w:p>/gs
  ]
  
  for (const pattern of patterns) {
    try {
      const matches = xml.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          let text = match[1].trim()
          
          // If this is a paragraph tag, extract text nodes from it
          if (match[0].includes('<w:p')) {
            const innerTextMatches = text.matchAll(/<w:t[^>]*?>(.*?)<\/w:t>/gs)
            for (const innerMatch of innerTextMatches) {
              if (innerMatch[1]) {
                const innerText = this.decodeXmlEntities(innerMatch[1].trim())
                if (innerText.length > 0 && this.isReadableText(innerText)) {
                  textParts.push(innerText)
                }
              }
            }
          } else {
            text = this.decodeXmlEntities(text)
            if (text.length > 0 && this.isReadableText(text)) {
              textParts.push(text)
            }
          }
        }
      }
      
      if (textParts.length > 0) {
        break // Found text, no need to try other patterns
      }
    } catch (patternError) {
      console.log('Pattern failed:', pattern, patternError)
    }
  }
  
  return textParts
}

function extractReadableSequences(content: string): string {
  try {
    // Remove XML tags but preserve structure
    const withoutTags = content.replace(/<[^>]*>/g, ' ')
    
    // Find sequences of readable characters (more permissive)
    const readableMatches = withoutTags.match(/[a-zA-ZÀ-ÿ0-9\s.,!?;:()\'"/-]{5,}/g)
    
    if (readableMatches) {
      return readableMatches
        .map(match => match.trim())
        .filter(text => text.length > 3 && this.isReadableText(text))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    return ''
  } catch (error) {
    console.error('Error extracting readable sequences:', error)
    return ''
  }
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => {
      try {
        return String.fromCharCode(parseInt(num))
      } catch {
        return ''
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16))
      } catch {
        return ''
      }
    })
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
    'word/document',
    'document.xml'
  ]
  
  const contentLower = content.toLowerCase()
  return wordIndicators.some(indicator => contentLower.includes(indicator.toLowerCase()))
}
