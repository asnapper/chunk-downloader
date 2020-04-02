import { ChunkDownloader } from '../lib/ChunkDownloader'

const urlElement = document.getElementById('url') as HTMLInputElement
const logElement = document.getElementById('log')
const buttonElement = document.getElementById('go')

const _log = console.log
console.log = (...args) => {
    _log.apply(console, args)
    logElement.innerText += args.join(',') + '\n'
}

buttonElement.addEventListener('click', () => {
    const downloader = new ChunkDownloader(urlElement.value)

    downloader.start()
})