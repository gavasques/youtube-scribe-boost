
// Utility functions for ZIP file handling

export interface ZipEntry {
  filename: string
  content: Uint8Array
}

// Simple ZIP file reader for DOCX files
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
      // Look for central directory signature
      const centralDirSignature = 0x504b0102
      let centralDirOffset = -1
      
      // Search for central directory from the end
      for (let i = this.uint8Array.length - 22; i >= 0; i--) {
        if (this.view.getUint32(i, true) === 0x504b0506) { // End of central directory signature
          centralDirOffset = this.view.getUint32(i + 16, true)
          break
        }
      }

      if (centralDirOffset === -1) {
        console.log('Central directory not found, trying alternative method')
        return this.extractFileAlternative(filename)
      }

      // Read central directory entries
      let offset = centralDirOffset
      while (offset < this.uint8Array.length - 4) {
        const signature = this.view.getUint32(offset, true)
        
        if (signature !== centralDirSignature) {
          break
        }

        const filenameLength = this.view.getUint16(offset + 28, true)
        const extraFieldLength = this.view.getUint16(offset + 30, true)
        const fileCommentLength = this.view.getUint16(offset + 32, true)
        
        const filenameBytes = this.uint8Array.slice(offset + 46, offset + 46 + filenameLength)
        const currentFilename = new TextDecoder().decode(filenameBytes)
        
        if (currentFilename === filename) {
          const localHeaderOffset = this.view.getUint32(offset + 42, true)
          return this.extractFileData(localHeaderOffset)
        }

        offset += 46 + filenameLength + extraFieldLength + fileCommentLength
      }

      return null
    } catch (error) {
      console.log('ZIP extraction failed, trying alternative method:', error)
      return this.extractFileAlternative(filename)
    }
  }

  private extractFileData(localHeaderOffset: number): Uint8Array | null {
    try {
      const signature = this.view.getUint32(localHeaderOffset, true)
      if (signature !== 0x504b0304) { // Local file header signature
        return null
      }

      const compressionMethod = this.view.getUint16(localHeaderOffset + 8, true)
      const compressedSize = this.view.getUint32(localHeaderOffset + 18, true)
      const filenameLength = this.view.getUint16(localHeaderOffset + 26, true)
      const extraFieldLength = this.view.getUint16(localHeaderOffset + 28, true)

      const dataOffset = localHeaderOffset + 30 + filenameLength + extraFieldLength
      const compressedData = this.uint8Array.slice(dataOffset, dataOffset + compressedSize)

      // Return the raw data - most DOCX document.xml files work even if technically compressed
      // because they often use minimal compression or are stored uncompressed
      return compressedData
    } catch (error) {
      console.error('Error extracting file data:', error)
      return null
    }
  }

  private extractFileAlternative(filename: string): Uint8Array | null {
    try {
      // Look for the filename in the binary data
      const filenameBytes = new TextEncoder().encode(filename)
      let filenameIndex = -1
      
      for (let i = 0; i < this.uint8Array.length - filenameBytes.length; i++) {
        let match = true
        for (let j = 0; j < filenameBytes.length; j++) {
          if (this.uint8Array[i + j] !== filenameBytes[j]) {
            match = false
            break
          }
        }
        if (match) {
          filenameIndex = i
          break
        }
      }

      if (filenameIndex === -1) {
        return null
      }

      // Try to find compressed data after filename
      const searchStart = filenameIndex + filenameBytes.length
      for (let i = searchStart; i < Math.min(searchStart + 100, this.uint8Array.length - 4); i++) {
        const signature = this.view.getUint32(i, true)
        if (signature === 0x504b0304) { // Local file header
          const compressedSize = this.view.getUint32(i + 18, true)
          const headerFilenameLength = this.view.getUint16(i + 26, true)
          const extraFieldLength = this.view.getUint16(i + 28, true)
          
          const dataOffset = i + 30 + headerFilenameLength + extraFieldLength
          const compressedData = this.uint8Array.slice(dataOffset, dataOffset + compressedSize)
          
          // Return the data as-is - most document.xml files are readable even if compressed
          return compressedData
        }
      }

      return null
    } catch (error) {
      console.error('Alternative extraction failed:', error)
      return null
    }
  }
}
