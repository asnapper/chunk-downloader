

export interface ChunkDownloaderOptions {
    fetchFunction?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    chunkSize?: number
    fileName?: string
}


export class ChunkDownloader {
    private options: ChunkDownloaderOptions
    private url: string
    private fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

    private totalChunks: number
    private fileSize: number
    private fileName: string
    private fileType: string

    constructor (url, options: ChunkDownloaderOptions = {}) {
        this.options = { chunkSize: 500000, ...options }
        this.url = url

        this.fetch = this.options.fetchFunction || fetch
    }

    public async start(): Promise<void> {

        const headResponse = await fetch(this.url, {
            method: 'HEAD',
            // mode: 'no-cors'
        })

        const rangeSupported = headResponse.headers.get('Accept-Ranges') == 'bytes'

        if (true || rangeSupported) {
            this.fileType = (headResponse.headers.get('content-type') || '').split(';').shift()
            this.fileSize = parseInt(headResponse.headers.get('content-Length'))
            
            this.fileName = this.options.fileName 
            || parseHeaderFieldValue(headResponse.headers.get('content-disposition'), 'filename')
            || 'file.' + (this.fileType ? this.fileType.split('/').pop() : 'unknown')
            
            const lastChunkSize = this.fileSize % this.options.chunkSize
            const fileSizeWithoutLastChunk = this.fileSize - lastChunkSize
            
            this.totalChunks = lastChunkSize > 0 
                ? fileSizeWithoutLastChunk / this.options.chunkSize 
                : fileSizeWithoutLastChunk / this.options.chunkSize + 1

            return this.downloadNextPart()
        } else {
            throw new Error("Range requests not supported by endpoint.")
        }

    }

    private async downloadNextPart(currentChunk = 0) {
        const chunkSize = this.options.chunkSize
        const fileSize = this.fileSize

        const rangeStart = currentChunk * chunkSize
        const rangeEnd = rangeStart + chunkSize < fileSize
            ? rangeStart + chunkSize
            : fileSize

        return fetch(this.url, {
            method: 'GET',
            headers: { 'range': `bytes=${rangeStart}-${rangeEnd}` }
        }).then(res => {
            console.log(`got bytes from ${rangeStart} to ${rangeEnd}`)
        })
        .then(() => {
            if (currentChunk < this.totalChunks) {
                return this.downloadNextPart(currentChunk + 1)
            } else {
                return
            }
        })
    }
}

function parseHeaderFieldValue(header: string, fieldName: string): string {
    // /(filename\=)\"?([\w|\.]+)\"?/gi
    const re = new RegExp('/' + fieldName+ '\\=\\"?([\\w|\\.]+)\\"?/gi').compile()
    const matches = re.exec(header)
    return matches[1]
}