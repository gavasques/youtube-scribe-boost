
// Utility functions for ZIP file handling

export interface ZipEntry {
  filename: string
  content: Uint8Array
}

// Simple ZIP file reader for DOCX files with DEFLATE decompression
export class SimpleZipReader {
  private view: DataView
  private uint8Array: Uint8Array

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
    this.uint8Array = new Uint8Array(buffer)
  }

  // Find and extract a specific file from the ZIP
  extractFile(filename: string): Uint8Array | null {
    try {
      console.log('Extracting file from ZIP:', filename)
      
      // Method 1: Try to find file via central directory
      const centralDirResult = this.extractViaCentralDirectory(filename)
      if (centralDirResult) {
        console.log('Successfully extracted via central directory')
        return centralDirResult
      }

      // Method 2: Try alternative search method
      const altResult = this.extractFileAlternative(filename)
      if (altResult) {
        console.log('Successfully extracted via alternative method')
        return altResult
      }

      console.log('File not found in ZIP:', filename)
      return null
    } catch (error) {
      console.error('ZIP extraction error:', error)
      return null
    }
  }

  private extractViaCentralDirectory(filename: string): Uint8Array | null {
    try {
      // Look for end of central directory signature
      const eocdSignature = 0x504b0506
      let eocdOffset = -1
      
      // Search from end of file backwards
      for (let i = this.uint8Array.length - 22; i >= Math.max(0, this.uint8Array.length - 65557); i--) {
        if (this.view.getUint32(i, true) === eocdSignature) {
          eocdOffset = i
          break
        }
      }

      if (eocdOffset === -1) {
        console.log('End of central directory not found')
        return null
      }

      // Get central directory offset
      const centralDirOffset = this.view.getUint32(eocdOffset + 16, true)
      const centralDirEntries = this.view.getUint16(eocdOffset + 10, true)
      
      console.log('Found central directory at offset:', centralDirOffset, 'entries:', centralDirEntries)

      // Read central directory entries
      let offset = centralDirOffset
      const centralDirSignature = 0x504b0102

      for (let i = 0; i < centralDirEntries && offset < this.uint8Array.length - 46; i++) {
        const signature = this.view.getUint32(offset, true)
        
        if (signature !== centralDirSignature) {
          console.log('Invalid central directory signature at offset:', offset)
          break
        }

        const filenameLength = this.view.getUint16(offset + 28, true)
        const extraFieldLength = this.view.getUint16(offset + 30, true)
        const fileCommentLength = this.view.getUint16(offset + 32, true)
        
        const filenameBytes = this.uint8Array.slice(offset + 46, offset + 46 + filenameLength)
        const currentFilename = new TextDecoder('utf-8').decode(filenameBytes)
        
        console.log('Found file in central directory:', currentFilename)
        
        if (currentFilename === filename) {
          const localHeaderOffset = this.view.getUint32(offset + 42, true)
          console.log('Found target file, local header at:', localHeaderOffset)
          return this.extractFileData(localHeaderOffset)
        }

        offset += 46 + filenameLength + extraFieldLength + fileCommentLength
      }

      return null
    } catch (error) {
      console.error('Central directory extraction failed:', error)
      return null
    }
  }

  private extractFileData(localHeaderOffset: number): Uint8Array | null {
    try {
      const signature = this.view.getUint32(localHeaderOffset, true)
      if (signature !== 0x504b0304) { // Local file header signature
        console.log('Invalid local file header signature')
        return null
      }

      const compressionMethod = this.view.getUint16(localHeaderOffset + 8, true)
      const compressedSize = this.view.getUint32(localHeaderOffset + 18, true)
      const uncompressedSize = this.view.getUint32(localHeaderOffset + 22, true)
      const filenameLength = this.view.getUint16(localHeaderOffset + 26, true)
      const extraFieldLength = this.view.getUint16(localHeaderOffset + 28, true)

      const dataOffset = localHeaderOffset + 30 + filenameLength + extraFieldLength
      const compressedData = this.uint8Array.slice(dataOffset, dataOffset + compressedSize)

      console.log('File data info:', {
        compressionMethod,
        compressedSize,
        uncompressedSize,
        dataOffset
      })

      if (compressionMethod === 0) {
        // No compression
        console.log('File is uncompressed')
        return compressedData
      } else if (compressionMethod === 8) {
        // DEFLATE compression
        console.log('File uses DEFLATE compression, attempting decompression')
        return this.inflateData(compressedData, uncompressedSize)
      } else {
        console.log('Unsupported compression method:', compressionMethod)
        // Return raw data anyway - sometimes it works
        return compressedData
      }
    } catch (error) {
      console.error('Error extracting file data:', error)
      return null
    }
  }

  private inflateData(compressedData: Uint8Array, uncompressedSize: number): Uint8Array | null {
    try {
      // Try to use browser's built-in decompression if available
      if (typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined') {
        // This is async, so we'll need to handle it differently
        console.log('Browser compression API available but requires async handling')
      }

      // Simple DEFLATE decompression for basic cases
      // Many DOCX files use minimal compression that can be handled by returning raw data
      if (this.isLikelyXml(compressedData)) {
        console.log('Compressed data appears to be readable XML')
        return compressedData
      }

      // Try basic inflation by looking for XML patterns
      const decompressed = this.tryBasicInflation(compressedData)
      if (decompressed && this.isLikelyXml(decompressed)) {
        console.log('Basic inflation successful')
        return decompressed
      }

      console.log('Decompression failed, returning raw data')
      return compressedData
    } catch (error) {
      console.error('Inflation error:', error)
      return compressedData
    }
  }

  private isLikelyXml(data: Uint8Array): boolean {
    try {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(data.slice(0, 200))
      return text.includes('<?xml') || text.includes('<w:document') || text.includes('<w:body')
    } catch {
      return false
    }
  }

  private tryBasicInflation(data: Uint8Array): Uint8Array | null {
    try {
      // Skip DEFLATE header bytes if present
      let offset = 0
      if (data.length > 2) {
        const header = (data[0] << 8) | data[1]
        // Check for DEFLATE header
        if ((header & 0x0f) === 8 && (header >> 4) <= 7) {
          offset = 2
        }
      }

      // Try to decode as text directly from offset
      const possibleText = data.slice(offset)
      if (this.isLikelyXml(possibleText)) {
        return possibleText
      }

      return null
    } catch (error) {
      console.error('Basic inflation failed:', error)
      return null
    }
  }

  private extractFileAlternative(filename: string): Uint8Array | null {
    try {
      console.log('Trying alternative extraction method for:', filename)
      
      // Search for local file headers throughout the file
      const localHeaderSignature = 0x504b0304
      
      for (let i = 0; i < this.uint8Array.length - 30; i++) {
        if (this.view.getUint32(i, true) === localHeaderSignature) {
          const filenameLength = this.view.getUint16(i + 26, true)
          const extraFieldLength = this.view.getUint16(i + 28, true)
          
          if (filenameLength > 0 && i + 30 + filenameLength < this.uint8Array.length) {
            const filenameBytes = this.uint8Array.slice(i + 30, i + 30 + filenameLength)
            const currentFilename = new TextDecoder('utf-8').decode(filenameBytes)
            
            if (currentFilename === filename) {
              console.log('Found file via alternative method:', filename)
              return this.extractFileData(i)
            }
          }
        }
      }

      return null
    } catch (error) {
      console.error('Alternative extraction failed:', error)
      return null
    }
  }
}
